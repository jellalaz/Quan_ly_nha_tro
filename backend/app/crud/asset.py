from sqlalchemy.orm import Session
from typing import List
from app.models.asset import Asset
from app.models.room import Room
from app.models.house import House
from app.schemas.asset import AssetCreate, AssetUpdate

def create_asset(db: Session, asset: AssetCreate, owner_id: int):
    # Check if the room belongs to the owner
    room = db.query(Room).join(House).filter(Room.room_id == asset.room_id, House.owner_id == owner_id).first()
    if not room:
        return None
    db_asset = Asset(**asset.dict())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

def get_asset_by_id(db: Session, asset_id: int, owner_id: int):
    return db.query(Asset).join(Room).join(House).filter(Asset.asset_id == asset_id, House.owner_id == owner_id).first()

def get_assets_by_room(db: Session, room_id: int, owner_id: int):
    # First, check if the room belongs to the owner
    room = db.query(Room).join(House).filter(Room.room_id == room_id, House.owner_id == owner_id).first()
    if not room:
        return []
    return db.query(Asset).filter(Asset.room_id == room_id).all()

def update_asset(db: Session, asset_id: int, asset_update: AssetUpdate, owner_id: int):
    db_asset = get_asset_by_id(db, asset_id, owner_id=owner_id)
    if db_asset:
        update_data = asset_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_asset, field, value)
        db.commit()
        db.refresh(db_asset)
    return db_asset

def delete_asset(db: Session, asset_id: int, owner_id: int):
    db_asset = get_asset_by_id(db, asset_id, owner_id=owner_id)
    if db_asset:
        db.delete(db_asset)
        db.commit()
    return db_asset
