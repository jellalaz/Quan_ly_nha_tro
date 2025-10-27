from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, date

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User

router = APIRouter()

class RevenueStatsResponse(BaseModel):
    total_revenue: float
    paid_invoices: int
    pending_invoices: int
    avg_monthly_revenue: float

class RevenueStatsRequest(BaseModel):
    start_date: date
    end_date: date

@router.post("/revenue-stats", response_model=RevenueStatsResponse)
async def get_revenue_stats(
    request: RevenueStatsRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lấy thống kê doanh thu theo chủ nhà (owner)
    """
    try:
        params = {
            'start_date': request.start_date,
            'end_date': request.end_date,
            'owner_id': current_user.owner_id,
        }

        # Tổng doanh thu đã thanh toán trong khoảng
        total_revenue = db.execute(text(
            """
            SELECT COALESCE(SUM(i.price + i.water_price + i.internet_price + i.general_price + i.electricity_price), 0) AS total
            FROM invoices i
            JOIN rented_rooms rr ON i.rr_id = rr.rr_id
            JOIN rooms r ON rr.room_id = r.room_id
            JOIN houses h ON r.house_id = h.house_id
            WHERE i.is_paid = TRUE
              AND i.payment_date BETWEEN :start_date AND :end_date
              AND h.owner_id = :owner_id
            """
        ), params).scalar() or 0

        # Số hóa đơn đã thanh toán
        paid_invoices = db.execute(text(
            """
            SELECT COUNT(*)
            FROM invoices i
            JOIN rented_rooms rr ON i.rr_id = rr.rr_id
            JOIN rooms r ON rr.room_id = r.room_id
            JOIN houses h ON r.house_id = h.house_id
            WHERE i.is_paid = TRUE
              AND i.payment_date BETWEEN :start_date AND :end_date
              AND h.owner_id = :owner_id
            """
        ), params).scalar() or 0

        # Số hóa đơn chưa thanh toán đến hạn trong khoảng
        pending_invoices = db.execute(text(
            """
            SELECT COUNT(*)
            FROM invoices i
            JOIN rented_rooms rr ON i.rr_id = rr.rr_id
            JOIN rooms r ON rr.room_id = r.room_id
            JOIN houses h ON r.house_id = h.house_id
            WHERE i.is_paid = FALSE
              AND i.due_date BETWEEN :start_date AND :end_date
              AND h.owner_id = :owner_id
            """
        ), params).scalar() or 0

        # Doanh thu trung bình hàng tháng
        avg_monthly_revenue = db.execute(text(
            """
            SELECT COALESCE(AVG(monthly_revenue), 0) AS avg_rev
            FROM (
                SELECT DATE_FORMAT(i.payment_date, '%Y-%m') AS month,
                       SUM(i.price + i.water_price + i.internet_price + i.general_price + i.electricity_price) AS monthly_revenue
                FROM invoices i
                JOIN rented_rooms rr ON i.rr_id = rr.rr_id
                JOIN rooms r ON rr.room_id = r.room_id
                JOIN houses h ON r.house_id = h.house_id
                WHERE i.is_paid = TRUE
                  AND i.payment_date BETWEEN :start_date AND :end_date
                  AND h.owner_id = :owner_id
                GROUP BY DATE_FORMAT(i.payment_date, '%Y-%m')
            ) t
            """
        ), params).scalar() or 0

        return RevenueStatsResponse(
            total_revenue=float(total_revenue),
            paid_invoices=int(paid_invoices),
            pending_invoices=int(pending_invoices),
            avg_monthly_revenue=float(avg_monthly_revenue)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy thống kê doanh thu: {str(e)}")


@router.get("/system-overview")
async def get_system_overview(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lấy tổng quan hệ thống theo chủ nhà (owner)
    """
    try:
        # Thống kê tổng quan theo owner
        stats = db.execute(text("""
            SELECT 
                (SELECT COUNT(*) FROM houses WHERE owner_id = :owner_id) as total_houses,
                (SELECT COUNT(*) FROM rooms r JOIN houses h ON r.house_id = h.house_id WHERE h.owner_id = :owner_id) as total_rooms,
                (SELECT COUNT(*) FROM rooms r JOIN houses h ON r.house_id = h.house_id WHERE r.is_available = TRUE AND h.owner_id = :owner_id) as available_rooms,
                (SELECT COUNT(*) FROM rooms r JOIN houses h ON r.house_id = h.house_id WHERE r.is_available = FALSE AND h.owner_id = :owner_id) as occupied_rooms,
                (SELECT COUNT(*) FROM rented_rooms rr JOIN rooms r ON rr.room_id = r.room_id JOIN houses h ON r.house_id = h.house_id WHERE rr.is_active = TRUE AND h.owner_id = :owner_id) as active_contracts,
                (SELECT COUNT(*) FROM invoices i JOIN rented_rooms rr ON i.rr_id = rr.rr_id JOIN rooms r ON rr.room_id = r.room_id JOIN houses h ON r.house_id = h.house_id WHERE i.is_paid = FALSE AND h.owner_id = :owner_id) as pending_invoices
        """), {'owner_id': current_user.owner_id}).fetchone()

        # Doanh thu tháng hiện tại theo owner
        current_month_revenue = db.execute(text("""
            SELECT 
                COALESCE(SUM(i.price + i.water_price + i.internet_price + i.general_price + i.electricity_price), 0) as revenue
            FROM invoices i 
            JOIN rented_rooms rr ON i.rr_id = rr.rr_id
            JOIN rooms r ON rr.room_id = r.room_id
            JOIN houses h ON r.house_id = h.house_id
            WHERE i.is_paid = TRUE 
              AND DATE_FORMAT(i.payment_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
              AND h.owner_id = :owner_id
        """), {'owner_id': current_user.owner_id}).fetchone()

        # Tỷ lệ lấp đầy
        occupancy_rate = (stats.occupied_rooms / stats.total_rooms * 100) if stats.total_rooms > 0 else 0
        
        return {
            'total_houses': stats.total_houses,
            'total_rooms': stats.total_rooms,
            'available_rooms': stats.available_rooms,
            'occupied_rooms': stats.occupied_rooms,
            'occupancy_rate': round(occupancy_rate, 2),
            'active_contracts': stats.active_contracts,
            'pending_invoices': stats.pending_invoices,
            'current_month_revenue': float(current_month_revenue.revenue or 0),
            'generated_at': datetime.now()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy tổng quan hệ thống: {str(e)}")
