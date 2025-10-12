from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.asset import Asset, AssetCreate, AssetUpdate
from app.crud import asset as asset_crud

router = APIRouter()

@router.post("/", response_model=Asset)
def create_asset(asset: AssetCreate, db: Session = Depends(get_db)):
    return asset_crud.create_asset(db=db, asset=asset)

@router.get("/room/{room_id}", response_model=List[Asset])
def read_assets_by_room(room_id: int, db: Session = Depends(get_db)):
    assets = asset_crud.get_assets_by_room(db, room_id=room_id)
    return assets

@router.get("/{asset_id}", response_model=Asset)
def read_asset(asset_id: int, db: Session = Depends(get_db)):
    db_asset = asset_crud.get_asset_by_id(db, asset_id=asset_id)
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return db_asset

@router.put("/{asset_id}", response_model=Asset)
def update_asset(
    asset_id: int,
    asset_update: AssetUpdate,
    db: Session = Depends(get_db)
):
    db_asset = asset_crud.update_asset(db, asset_id=asset_id, asset_update=asset_update)
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return db_asset

@router.delete("/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    db_asset = asset_crud.delete_asset(db, asset_id=asset_id)
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"message": "Asset deleted successfully"}
