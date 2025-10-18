from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.room import Room, RoomCreate, RoomUpdate
from app.crud import room as room_crud
from app.core.security import get_current_active_user
from app.schemas.user import User

router = APIRouter()

@router.post("/", response_model=Room)
def create_room(room: RoomCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    created = room_crud.create_room(db=db, room=room, owner_id=current_user.owner_id)
    if created is None:
        raise HTTPException(status_code=404, detail="House not found or not owned by user")
    return created

@router.get("/", response_model=List[Room])
def read_rooms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    rooms = room_crud.get_all_rooms(db, owner_id=current_user.owner_id, skip=skip, limit=limit)
    return rooms

@router.get("/house/{house_id}", response_model=List[Room])
def read_rooms_by_house(house_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    rooms = room_crud.get_rooms_by_house(db, house_id=house_id, owner_id=current_user.owner_id, skip=skip, limit=limit)
    return rooms

@router.get("/available", response_model=List[Room])
def read_available_rooms(house_id: int | None = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    rooms = room_crud.get_available_rooms(db, owner_id=current_user.owner_id, house_id=house_id, skip=skip, limit=limit)
    return rooms

@router.get("/{room_id}", response_model=Room)
def read_room(room_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_room = room_crud.get_room_by_id(db, room_id=room_id, owner_id=current_user.owner_id)
    if db_room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return db_room

@router.put("/{room_id}", response_model=Room)
def update_room(
    room_id: int,
    room_update: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_room = room_crud.update_room(db, room_id=room_id, room_update=room_update, owner_id=current_user.owner_id)
    if db_room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return db_room

@router.delete("/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    db_room = room_crud.delete_room(db, room_id=room_id, owner_id=current_user.owner_id)
    if db_room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"message": "Room deleted successfully"}
