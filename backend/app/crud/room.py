from sqlalchemy.orm import Session
from typing import List
from app.models.room import Room
from app.models.house import House
from app.schemas.room import RoomCreate, RoomUpdate

def create_room(db: Session, room: RoomCreate, owner_id: int):
    # Ensure the house belongs to the owner
    house = db.query(House).filter(House.house_id == room.house_id, House.owner_id == owner_id).first()
    if not house:
        return None
    db_room = Room(**room.dict())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

def get_room_by_id(db: Session, room_id: int, owner_id: int):
    return (
        db.query(Room)
        .join(House)
        .filter(Room.room_id == room_id, House.owner_id == owner_id)
        .first()
    )

def get_rooms_by_house(db: Session, house_id: int, owner_id: int, skip: int = 0, limit: int = 100):
    # House must belong to owner
    house = db.query(House).filter(House.house_id == house_id, House.owner_id == owner_id).first()
    if not house:
        return []
    return db.query(Room).filter(Room.house_id == house_id).offset(skip).limit(limit).all()

def get_available_rooms(db: Session, owner_id: int, house_id: int | None = None, skip: int = 0, limit: int = 100):
    query = db.query(Room).join(House).filter(Room.is_available == True, House.owner_id == owner_id)
    if house_id:
        # ensure the house belongs to the owner
        query = query.filter(Room.house_id == house_id)
    return query.offset(skip).limit(limit).all()

def get_all_rooms(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(Room)
        .join(House)
        .filter(House.owner_id == owner_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

def update_room(db: Session, room_id: int, room_update: RoomUpdate, owner_id: int):
    db_room = get_room_by_id(db, room_id, owner_id)
    if db_room:
        update_data = room_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_room, field, value)
        db.commit()
        db.refresh(db_room)
    return db_room

def delete_room(db: Session, room_id: int, owner_id: int):
    db_room = get_room_by_id(db, room_id, owner_id)
    if db_room:
        db.delete(db_room)
        db.commit()
    return db_room
