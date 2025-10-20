from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class House(Base):
    __tablename__ = "houses"
    
    house_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    floor_count = Column(Integer, nullable=False)
    ward = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    address_line = Column(String(255), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.owner_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    owner = relationship("User", back_populates="houses")
    rooms = relationship("Room", back_populates="house", cascade="all, delete-orphan")
