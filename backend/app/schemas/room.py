from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RoomBase(BaseModel):
    name: str
    capacity: int
    description: Optional[str] = None
    price: float

class RoomCreate(RoomBase):
    house_id: int

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    description: Optional[str] = None
    price: Optional[float] = None
    is_available: Optional[bool] = None

class Room(RoomBase):
    room_id: int
    house_id: int
    is_available: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class RoomWithDetails(Room):
    house: "House"
    assets: List["Asset"] = []
    rented_rooms: List["RentedRoom"] = []
