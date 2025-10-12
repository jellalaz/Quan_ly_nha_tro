from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_active_user, get_admin_user
from app.schemas.house import House, HouseCreate, HouseUpdate
from app.schemas.user import User
from app.crud import house as house_crud

router = APIRouter()

@router.post("/", response_model=House)
def create_house(
    house: HouseCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return house_crud.create_house(db=db, house=house, owner_id=current_user.owner_id)

@router.get("/", response_model=List[House])
def read_houses(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    houses = house_crud.get_houses_by_owner(db, owner_id=current_user.owner_id, skip=skip, limit=limit)
    return houses

@router.get("/{house_id}", response_model=House)
def read_house(house_id: int, db: Session = Depends(get_db)):
    db_house = house_crud.get_house_by_id(db, house_id=house_id)
    if db_house is None:
        raise HTTPException(status_code=404, detail="House not found")
    return db_house

@router.put("/{house_id}", response_model=House)
def update_house(
    house_id: int,
    house_update: HouseUpdate,
    db: Session = Depends(get_db)
):
    db_house = house_crud.update_house(db, house_id=house_id, house_update=house_update)
    if db_house is None:
        raise HTTPException(status_code=404, detail="House not found")
    return db_house

@router.delete("/{house_id}")
def delete_house(house_id: int, db: Session = Depends(get_db)):
    db_house = house_crud.delete_house(db, house_id=house_id)
    if db_house is None:
        raise HTTPException(status_code=404, detail="House not found")
    return {"message": "House deleted successfully"}

# Admin-only endpoint to get houses by specific owner
@router.get("/owner/{owner_id}", response_model=List[House])
async def get_houses_by_owner_id(
    owner_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get all houses of a specific owner - Admin only"""
    houses = house_crud.get_houses_by_owner(db, owner_id=owner_id, skip=skip, limit=limit)
    return houses

# Admin-only endpoint to get all houses in system
@router.get("/admin/all", response_model=List[House])
async def get_all_houses_admin(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Get all houses in the system - Admin only"""
    houses = house_crud.get_all_houses(db, skip=skip, limit=limit)
    return houses
