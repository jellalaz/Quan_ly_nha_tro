from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.asset import Asset, AssetCreate, AssetUpdate
from app.crud import asset as asset_crud
from app.core.security import get_current_active_user
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=Asset)
def create_asset(asset: AssetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_asset = asset_crud.create_asset(db=db, asset=asset, owner_id=current_user.owner_id)
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Room not found or not owned by user")
    return db_asset

@router.get("/room/{room_id}", response_model=List[Asset])
def read_assets_by_room(room_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    assets = asset_crud.get_assets_by_room(db, room_id=room_id, owner_id=current_user.owner_id)
    return assets

@router.get("/{asset_id}", response_model=Asset)
def read_asset(asset_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_asset = asset_crud.get_asset_by_id(db, asset_id=asset_id, owner_id=current_user.owner_id)
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return db_asset

@router.put("/{asset_id}", response_model=Asset)
def update_asset(
    asset_id: int,
    asset_update: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_asset = asset_crud.update_asset(db, asset_id=asset_id, asset_update=asset_update, owner_id=current_user.owner_id)
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return db_asset

@router.delete("/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_asset = asset_crud.delete_asset(db, asset_id=asset_id, owner_id=current_user.owner_id)
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"message": "Asset deleted successfully"}
