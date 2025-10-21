from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, date

from ...core.security import get_current_active_user
from ...models.user import User
from ...services.ai_service import ai_service

router = APIRouter()

class RevenueReportRequest(BaseModel):
    start_date: date
    end_date: date

@router.post("/generate-revenue-report")
async def generate_revenue_report(
    request: RevenueReportRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Tạo báo cáo doanh thu bằng AI (phạm vi tài khoản đang đăng nhập)
    """
    try:
        report = ai_service.generate_revenue_report(
            start_date=request.start_date.strftime('%Y-%m-%d'),
            end_date=request.end_date.strftime('%Y-%m-%d'),
            owner_id=current_user.owner_id
        )

        return {
            "report": report,
            "period": f"{request.start_date} đến {request.end_date}",
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi AI service: {str(e)}")
