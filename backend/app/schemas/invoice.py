from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

class InvoiceBase(BaseModel):
    price: float
    water_price: float = 0
    internet_price: float = 0
    general_price: float = 0
    electricity_price: float = 0
    electricity_num: float = 0
    water_num: float = 0
    due_date: datetime
    payment_date: Optional[datetime] = None

class InvoiceCreate(InvoiceBase):
    rr_id: int

class InvoiceUpdate(BaseModel):
    price: Optional[float] = None
    water_price: Optional[float] = None
    internet_price: Optional[float] = None
    general_price: Optional[float] = None
    electricity_price: Optional[float] = None
    electricity_num: Optional[float] = None
    water_num: Optional[float] = None
    due_date: Optional[datetime] = None
    payment_date: Optional[datetime] = None
    is_paid: Optional[bool] = None

class Invoice(InvoiceBase):
    invoice_id: int
    rr_id: int
    is_paid: bool
    created_at: datetime
    
    @field_validator('is_paid', mode='before')
    @classmethod
    def validate_is_paid(cls, v):
        if v is None:
            return False
        return v
    
    class Config:
        from_attributes = True

class InvoiceWithDetails(Invoice):
    rented_room: "RentedRoom"
