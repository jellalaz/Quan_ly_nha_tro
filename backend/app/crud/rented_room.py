from sqlalchemy.orm import Session
from typing import List
from app.models.rented_room import RentedRoom
from app.schemas.rented_room import RentedRoomCreate, RentedRoomUpdate
from app.crud.room import get_room_by_id

def create_rented_room(db: Session, rented_room: RentedRoomCreate):
    db_rented_room = RentedRoom(**rented_room.dict())
    db.add(db_rented_room)
    
    # Update room availability
    room = get_room_by_id(db, rented_room.room_id)
    if room:
        room.is_available = False
    
    db.commit()
    db.refresh(db_rented_room)
    return db_rented_room

def get_rented_room_by_id(db: Session, rr_id: int):
    return db.query(RentedRoom).filter(RentedRoom.rr_id == rr_id).first()

def get_rented_rooms_by_room(db: Session, room_id: int):
    return db.query(RentedRoom).filter(RentedRoom.room_id == room_id).all()

def get_active_rented_rooms(db: Session, skip: int = 0, limit: int = 100):
    return db.query(RentedRoom).filter(RentedRoom.is_active == True).offset(skip).limit(limit).all()

def update_rented_room(db: Session, rr_id: int, rented_room_update: RentedRoomUpdate):
    db_rented_room = get_rented_room_by_id(db, rr_id)
    if db_rented_room:
        update_data = rented_room_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_rented_room, field, value)
        db.commit()
        db.refresh(db_rented_room)
    return db_rented_room

def terminate_rental(db: Session, rr_id: int):
    db_rented_room = get_rented_room_by_id(db, rr_id)
    if db_rented_room:
        db_rented_room.is_active = False
        # Make room available again
        room = get_room_by_id(db, db_rented_room.room_id)
        if room:
            room.is_available = True
        db.commit()
        db.refresh(db_rented_room)
    return db_rented_room
