from sqlalchemy.orm import Session
from typing import List
from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate

def create_asset(db: Session, asset: AssetCreate):
    db_asset = Asset(**asset.dict())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

def get_asset_by_id(db: Session, asset_id: int):
    return db.query(Asset).filter(Asset.asset_id == asset_id).first()

def get_assets_by_room(db: Session, room_id: int):
    return db.query(Asset).filter(Asset.room_id == room_id).all()

def update_asset(db: Session, asset_id: int, asset_update: AssetUpdate):
    db_asset = get_asset_by_id(db, asset_id)
    if db_asset:
        update_data = asset_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_asset, field, value)
        db.commit()
        db.refresh(db_asset)
    return db_asset

def delete_asset(db: Session, asset_id: int):
    db_asset = get_asset_by_id(db, asset_id)
    if db_asset:
        db.delete(db_asset)
        db.commit()
    return db_asset
