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

class RoomSearchRequest(BaseModel):
    min_price: float
    max_price: float
    min_capacity: int
    max_capacity: int
    district: Optional[str] = None

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
    Lấy thống kê doanh thu sử dụng stored procedure
    """
    try:
        # Gọi stored procedure
        db.execute(text("""
            CALL GetRevenueStats(:start_date, :end_date, @total_revenue, @paid_invoices, @pending_invoices, @avg_monthly_revenue)
        """), {
            'start_date': request.start_date.strftime('%Y-%m-%d'),
            'end_date': request.end_date.strftime('%Y-%m-%d')
        })
        
        # Lấy kết quả từ output variables
        result = db.execute(text("""
            SELECT @total_revenue as total_revenue, 
                   @paid_invoices as paid_invoices, 
                   @pending_invoices as pending_invoices, 
                   @avg_monthly_revenue as avg_monthly_revenue
        """)).fetchone()
        
        return RevenueStatsResponse(
            total_revenue=float(result.total_revenue or 0),
            paid_invoices=int(result.paid_invoices or 0),
            pending_invoices=int(result.pending_invoices or 0),
            avg_monthly_revenue=float(result.avg_monthly_revenue or 0)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy thống kê doanh thu: {str(e)}")

@router.post("/search-rooms")
async def search_available_rooms(
    request: RoomSearchRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Tìm phòng trống phù hợp sử dụng stored procedure
    """
    try:
        result = db.execute(text("""
            CALL FindAvailableRooms(:min_price, :max_price, :min_capacity, :max_capacity, :district)
        """), {
            'min_price': request.min_price,
            'max_price': request.max_price,
            'min_capacity': request.min_capacity,
            'max_capacity': request.max_capacity,
            'district': request.district
        }).fetchall()
        
        rooms = []
        for row in result:
            rooms.append({
                'room_id': row.room_id,
                'room_name': row.room_name,
                'capacity': row.capacity,
                'price': float(row.price),
                'description': row.description,
                'house_name': row.house_name,
                'district': row.district,
                'address_line': row.address_line,
                'asset_count': row.asset_count
            })
        
        return {
            'rooms': rooms,
            'total_found': len(rooms),
            'search_criteria': request.dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi tìm phòng: {str(e)}")

@router.post("/generate-report")
async def generate_detailed_report(
    request: ReportRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Tạo báo cáo chi tiết sử dụng stored procedure
    """
    try:
        result = db.execute(text("""
            CALL GenerateDetailedReport(:report_type, :start_date, :end_date)
        """), {
            'report_type': request.report_type,
            'start_date': request.start_date.strftime('%Y-%m-%d'),
            'end_date': request.end_date.strftime('%Y-%m-%d')
        }).fetchall()
        
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
    Tạo hóa đơn hàng tháng cho tất cả hợp đồng đang hoạt động
    """
    try:
        db.execute(text("CALL CreateMonthlyInvoices()"))
        db.commit()
        
        return {
            'message': 'Đã tạo hóa đơn hàng tháng thành công',
            'created_at': datetime.now()
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo hóa đơn: {str(e)}")

@router.get("/expiring-contracts")
async def get_expiring_contracts(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách hợp đồng sắp hết hạn (trong 30 ngày tới)
    """
    try:
        result = db.execute(text("""
            SELECT 
                rr.rr_id,
                rr.tenant_name,
                rr.tenant_phone,
                r.name as room_name,
                h.name as house_name,
                rr.end_date,
                DATEDIFF(rr.end_date, CURDATE()) as days_remaining
            FROM rented_rooms rr
            JOIN rooms r ON rr.room_id = r.room_id
            JOIN houses h ON r.house_id = h.house_id
            WHERE rr.is_active = TRUE
            AND DATEDIFF(rr.end_date, CURDATE()) <= 30
            AND DATEDIFF(rr.end_date, CURDATE()) > 0
            ORDER BY days_remaining ASC
        """)).fetchall()
        
        contracts = []
        for row in result:
            contracts.append({
                'rr_id': row.rr_id,
                'tenant_name': row.tenant_name,
                'tenant_phone': row.tenant_phone,
                'room_name': row.room_name,
                'house_name': row.house_name,
                'end_date': row.end_date,
                'days_remaining': row.days_remaining
            })
        
        return {
            'expiring_contracts': contracts,
            'total_count': len(contracts),
            'checked_at': datetime.now()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy hợp đồng sắp hết hạn: {str(e)}")

@router.get("/system-overview")
async def get_system_overview(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lấy tổng quan hệ thống sử dụng views
    """
    try:
        # Thống kê tổng quan
        stats = db.execute(text("""
            SELECT 
                (SELECT COUNT(*) FROM houses) as total_houses,
                (SELECT COUNT(*) FROM rooms) as total_rooms,
                (SELECT COUNT(*) FROM rooms WHERE is_available = TRUE) as available_rooms,
                (SELECT COUNT(*) FROM rooms WHERE is_available = FALSE) as occupied_rooms,
                (SELECT COUNT(*) FROM rented_rooms WHERE is_active = TRUE) as active_contracts,
                (SELECT COUNT(*) FROM invoices WHERE is_paid = FALSE) as pending_invoices
        """)).fetchone()
        
        # Doanh thu tháng hiện tại
        current_month_revenue = db.execute(text("""
            SELECT 
                COALESCE(SUM(price + water_price + internet_price + general_price + electricity_price), 0) as revenue
            FROM invoices 
            WHERE is_paid = TRUE 
            AND DATE_FORMAT(payment_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
        """)).fetchone()
        
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
