from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.room import Room
from app.schemas.room import RoomCreate, RoomUpdate

def create_room(db: Session, room: RoomCreate):
    db_room = Room(**room.dict())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

def get_room_by_id(db: Session, room_id: int):
    return db.query(Room).filter(Room.room_id == room_id).first()

def get_rooms_by_house(db: Session, house_id: int, skip: int = 0, limit: int = 100):
    return db.query(Room).filter(Room.house_id == house_id).offset(skip).limit(limit).all()

def get_available_rooms(db: Session, house_id: int = None, skip: int = 0, limit: int = 100):
    query = db.query(Room).filter(Room.is_available == True)
    if house_id:
        query = query.filter(Room.house_id == house_id)
    return query.offset(skip).limit(limit).all()

def get_all_rooms(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Room).offset(skip).limit(limit).all()

def update_room(db: Session, room_id: int, room_update: RoomUpdate):
    db_room = get_room_by_id(db, room_id)
    if db_room:
        update_data = room_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_room, field, value)
        db.commit()
        db.refresh(db_room)
    return db_room

def delete_room(db: Session, room_id: int):
    db_room = get_room_by_id(db, room_id)
    if db_room:
        db.delete(db_room)
        db.commit()
    return db_room
