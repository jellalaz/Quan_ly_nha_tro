from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RentedRoomBase(BaseModel):
    tenant_name: str
    tenant_phone: str
    number_of_tenants: int
    contract_url: Optional[str] = None
    start_date: datetime
    end_date: datetime
    deposit: float = 0
    monthly_rent: float
    initial_electricity_num: float = 0
    electricity_unit_price: float = 3500
    water_price: float = 80000
    internet_price: float = 100000
    general_price: float = 100000

class RentedRoomCreate(RentedRoomBase):
    room_id: int

class RentedRoomUpdate(BaseModel):
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None
    number_of_tenants: Optional[int] = None
    contract_url: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    deposit: Optional[float] = None
    monthly_rent: Optional[float] = None
    initial_electricity_num: Optional[float] = None
    electricity_unit_price: Optional[float] = None
    water_price: Optional[float] = None
    internet_price: Optional[float] = None
    general_price: Optional[float] = None
    is_active: Optional[bool] = None

class RentedRoom(RentedRoomBase):
    rr_id: int
    room_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class RentedRoomWithDetails(RentedRoom):
    room: "Room"
    invoices: List["Invoice"] = []
