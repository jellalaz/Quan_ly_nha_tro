from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AssetBase(BaseModel):
    name: str
    image_url: Optional[str] = None

class AssetCreate(AssetBase):
    room_id: int

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    image_url: Optional[str] = None

class Asset(AssetBase):
    asset_id: int
    room_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
