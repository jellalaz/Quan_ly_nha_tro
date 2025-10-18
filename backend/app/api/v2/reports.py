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

class ReportRequest(BaseModel):
    report_type: str  # 'revenue', 'occupancy', 'tenant'
    start_date: date
    end_date: date

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

@router.post("/generate-report")
async def generate_detailed_report(
    request: ReportRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Tạo báo cáo chi tiết theo chủ nhà (owner)
    """
    try:
        if request.report_type == 'revenue':
            result = db.execute(text("""
                SELECT 
                    DATE_FORMAT(i.payment_date, '%Y-%m') as month,
                    COUNT(*) as total_invoices,
                    SUM(i.price) as room_revenue,
                    SUM(i.water_price) as water_revenue,
                    SUM(i.internet_price) as internet_revenue,
                    SUM(i.electricity_price) as electricity_revenue,
                    SUM(i.general_price) as service_revenue,
                    SUM(i.price + i.water_price + i.internet_price + i.electricity_price + i.general_price) as total_revenue
                FROM invoices i 
                JOIN rented_rooms rr ON i.rr_id = rr.rr_id
                JOIN rooms r ON rr.room_id = r.room_id
                JOIN houses h ON r.house_id = h.house_id
                WHERE i.is_paid = TRUE 
                  AND i.payment_date BETWEEN :start_date AND :end_date
                  AND h.owner_id = :owner_id
                GROUP BY DATE_FORMAT(i.payment_date, '%Y-%m')
                ORDER BY month DESC
            """), {
                'start_date': request.start_date,
                'end_date': request.end_date,
                'owner_id': current_user.owner_id,
            }).fetchall()
        elif request.report_type == 'occupancy':
            result = db.execute(text("""
                SELECT 
                    h.name as house_name,
                    COUNT(r.room_id) as total_rooms,
                    SUM(CASE WHEN r.is_available = FALSE THEN 1 ELSE 0 END) as occupied_rooms,
                    ROUND((SUM(CASE WHEN r.is_available = FALSE THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(r.room_id),0)), 2) as occupancy_rate
                FROM houses h
                LEFT JOIN rooms r ON h.house_id = r.house_id
                WHERE h.owner_id = :owner_id
                GROUP BY h.house_id, h.name
                ORDER BY occupancy_rate DESC
            """), {'owner_id': current_user.owner_id}).fetchall()
        elif request.report_type == 'tenant':
            result = db.execute(text("""
                SELECT 
                    rr.tenant_name,
                    rr.tenant_phone,
                    rr.number_of_tenants,
                    r.name as room_name,
                    h.name as house_name,
                    rr.start_date,
                    rr.end_date,
                    DATEDIFF(rr.end_date, CURDATE()) as days_remaining,
                    rr.monthly_rent
                FROM rented_rooms rr
                JOIN rooms r ON rr.room_id = r.room_id
                JOIN houses h ON r.house_id = h.house_id
                WHERE rr.is_active = TRUE
                  AND rr.start_date <= :end_date
                  AND rr.end_date >= :start_date
                  AND h.owner_id = :owner_id
                ORDER BY days_remaining ASC
            """), {
                'start_date': request.start_date,
                'end_date': request.end_date,
                'owner_id': current_user.owner_id,
            }).fetchall()
        else:
            raise HTTPException(status_code=400, detail="Loại báo cáo không hợp lệ")

        report_data = []
        for row in result:
            report_data.append(dict(row._mapping))
        
        return {
            'report_type': request.report_type,
            'period': f"{request.start_date} đến {request.end_date}",
            'data': report_data,
            'generated_at': datetime.now()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo báo cáo: {str(e)}")

@router.post("/create-monthly-invoices")
async def create_monthly_invoices(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Tạo hóa đơn hàng tháng cho tất cả hợp đồng đang hoạt động của chủ nhà hiện tại
    """
    try:
        # Chỉ tạo hóa đơn cho rented_rooms thuộc owner hiện tại
        db.execute(text("""
            INSERT INTO invoices (
                price, water_price, internet_price, general_price, electricity_price,
                electricity_num, water_num, due_date, rr_id, is_paid, created_at
            )
            SELECT 
                rr.monthly_rent,
                100000,
                200000,
                50000,
                150000,
                0,
                0,
                DATE_ADD(CURDATE(), INTERVAL 30 DAY),
                rr.rr_id,
                FALSE,
                NOW()
            FROM rented_rooms rr
            JOIN rooms r ON rr.room_id = r.room_id
            JOIN houses h ON r.house_id = h.house_id
            WHERE rr.is_active = TRUE
              AND h.owner_id = :owner_id
        """), {'owner_id': current_user.owner_id})
        db.commit()
        
        return {
            'message': 'Đã tạo hóa đơn hàng tháng thành công',
            'created_at': datetime.now()
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo hóa đơn: {str(e)}")

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
