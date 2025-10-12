from sqlalchemy import Column, Integer, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Invoice(Base):
    __tablename__ = "invoices"
    
    invoice_id = Column(Integer, primary_key=True, index=True)
    price = Column(Float, nullable=False)
    water_price = Column(Float, default=0)
    internet_price = Column(Float, default=0)
    general_price = Column(Float, default=0)
    electricity_price = Column(Float, default=0)
    electricity_num = Column(Float, default=0)
    water_num = Column(Float, default=0)
    due_date = Column(DateTime, nullable=False)
    payment_date = Column(DateTime)
    is_paid = Column(Boolean, default=False, nullable=False)
    rr_id = Column(Integer, ForeignKey("rented_rooms.rr_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    rented_room = relationship("RentedRoom", back_populates="invoices")
