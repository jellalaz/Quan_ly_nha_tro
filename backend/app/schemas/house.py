from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class HouseBase(BaseModel):
    name: str
    floor_count: int
    ward: str
    district: str
    address_line: str

class HouseCreate(HouseBase):
    pass

class HouseUpdate(BaseModel):
    name: Optional[str] = None
    floor_count: Optional[int] = None
    ward: Optional[str] = None
    district: Optional[str] = None
    address_line: Optional[str] = None

class House(HouseBase):
    house_id: int
    owner_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class HouseWithRooms(House):
    rooms: List["Room"] = []
