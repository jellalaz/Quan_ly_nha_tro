from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class RentedRoom(Base):
    __tablename__ = "rented_rooms"
    
    rr_id = Column(Integer, primary_key=True, index=True)
    tenant_name = Column(String(100), nullable=False)
    tenant_phone = Column(String(20), nullable=False)
    number_of_tenants = Column(Integer, nullable=False)
    contract_url = Column(String(255))
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    deposit = Column(Float, default=0)
    monthly_rent = Column(Float, nullable=False)
    initial_electricity_num = Column(Float, default=0)
    electricity_unit_price = Column(Float, default=3500)
    water_price = Column(Float, default=80000)
    internet_price = Column(Float, default=100000)
    general_price = Column(Float, default=100000)
    room_id = Column(Integer, ForeignKey("rooms.room_id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    room = relationship("Room", back_populates="rented_rooms")
    invoices = relationship("Invoice", back_populates="rented_room", cascade="all, delete-orphan")
