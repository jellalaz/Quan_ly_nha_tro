from fastapi import APIRouter
from . import auth, users, houses, rooms, assets, rented_rooms, invoices, ai, reports

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(houses.router, prefix="/houses", tags=["houses"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["rooms"])
api_router.include_router(assets.router, prefix="/assets", tags=["assets"])
api_router.include_router(rented_rooms.router, prefix="/rented-rooms", tags=["rented-rooms"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai-chatbot"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
