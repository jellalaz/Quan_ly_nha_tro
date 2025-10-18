from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_active_user
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
def read_house(house_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_house = house_crud.get_house_by_id(db, house_id=house_id, owner_id=current_user.owner_id)
    if db_house is None:
        raise HTTPException(status_code=404, detail="House not found")
    return db_house

@router.put("/{house_id}", response_model=House)
def update_house(
    house_id: int,
    house_update: HouseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_house = house_crud.update_house(db, house_id=house_id, house_update=house_update, owner_id=current_user.owner_id)
    if db_house is None:
        raise HTTPException(status_code=404, detail="House not found")
    return db_house

@router.delete("/{house_id}")
def delete_house(house_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_house = house_crud.delete_house(db, house_id=house_id, owner_id=current_user.owner_id)
    if db_house is None:
        raise HTTPException(status_code=404, detail="House not found")
    return {"message": "House deleted successfully"}
