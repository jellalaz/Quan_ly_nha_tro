from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Room(Base):
    __tablename__ = "rooms"
    
    room_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    capacity = Column(Integer, nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    house_id = Column(Integer, ForeignKey("houses.house_id"), nullable=False)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    house = relationship("House", back_populates="rooms")
    assets = relationship("Asset", back_populates="room")
    rented_rooms = relationship("RentedRoom", back_populates="room")
