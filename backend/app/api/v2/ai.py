from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, date

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.services.ai_service import ai_service

router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    include_stats: bool = False
    include_available_rooms: bool = False
    include_pending_invoices: bool = False

class ChatResponse(BaseModel):
    answer: str
    timestamp: datetime

class RoomRecommendationRequest(BaseModel):
    budget: float
    capacity: int
    district: Optional[str] = None

class RevenueReportRequest(BaseModel):
    start_date: date
    end_date: date

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Chat với AI chatbot về quản lý nhà trọ
    """
    try:
        context = {
            'include_stats': request.include_stats,
            'include_available_rooms': request.include_available_rooms,
            'include_pending_invoices': request.include_pending_invoices,
            'owner_id': current_user.owner_id,
        }
        
        answer = ai_service.generate_response(request.question, context)
        
        return ChatResponse(
            answer=answer,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi AI service: {str(e)}")

@router.post("/recommend-rooms")
async def get_room_recommendations(
    request: RoomRecommendationRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Nhận gợi ý phòng phù hợp từ AI
    """
    try:
        recommendations = ai_service.get_room_recommendations(
            budget=request.budget,
            capacity=request.capacity,
            district=request.district
        )
        
        return {
            "recommendations": recommendations,
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi AI service: {str(e)}")

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
