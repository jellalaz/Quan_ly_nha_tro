from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Asset(Base):
    __tablename__ = "assets"
    
    asset_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    image_url = Column(String(255))
    room_id = Column(Integer, ForeignKey("rooms.room_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    room = relationship("Room", back_populates="assets")
