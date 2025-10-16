from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.rented_room import RentedRoom, RentedRoomCreate, RentedRoomUpdate
from app.crud import rented_room as rented_room_crud
from app.core.security import get_current_active_user
from app.schemas.user import User

router = APIRouter()

@router.post("/", response_model=RentedRoom)
def create_rented_room(rented_room: RentedRoomCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    created = rented_room_crud.create_rented_room(db=db, rented_room=rented_room, owner_id=current_user.owner_id)
    if created is None:
        raise HTTPException(status_code=400, detail="Room is not available or not owned by user")
    return created

@router.get("/", response_model=List[RentedRoom])
def read_rented_rooms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    rented_rooms = rented_room_crud.get_active_rented_rooms(db, owner_id=current_user.owner_id, skip=skip, limit=limit)
    return rented_rooms

@router.get("/room/{room_id}", response_model=List[RentedRoom])
def read_rented_rooms_by_room(room_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    rented_rooms = rented_room_crud.get_rented_rooms_by_room(db, room_id=room_id, owner_id=current_user.owner_id)
    return rented_rooms

@router.get("/{rr_id}", response_model=RentedRoom)
def read_rented_room(rr_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_rented_room = rented_room_crud.get_rented_room_by_id(db, rr_id=rr_id, owner_id=current_user.owner_id)
    if db_rented_room is None:
        raise HTTPException(status_code=404, detail="Rented room not found")
    return db_rented_room

@router.put("/{rr_id}", response_model=RentedRoom)
def update_rented_room(
    rr_id: int,
    rented_room_update: RentedRoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_rented_room = rented_room_crud.update_rented_room(db, rr_id=rr_id, rented_room_update=rented_room_update, owner_id=current_user.owner_id)
    if db_rented_room is None:
        raise HTTPException(status_code=404, detail="Rented room not found")
    return db_rented_room

@router.post("/{rr_id}/terminate")
def terminate_rental(rr_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_rented_room = rented_room_crud.terminate_rental(db, rr_id=rr_id, owner_id=current_user.owner_id)
    if db_rented_room is None:
        raise HTTPException(status_code=404, detail="Rented room not found")
    return {"message": "Rental terminated successfully"}
