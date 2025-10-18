from sqlalchemy.orm import Session
from typing import List
from app.models.rented_room import RentedRoom
from app.models.room import Room
from app.models.house import House
from app.schemas.rented_room import RentedRoomCreate, RentedRoomUpdate
from app.crud.room import get_room_by_id

def create_rented_room(db: Session, rented_room: RentedRoomCreate, owner_id: int):
    # Ensure the room belongs to the owner and is available
    room = (
        db.query(Room)
        .join(House)
        .filter(Room.room_id == rented_room.room_id, 
                House.owner_id == owner_id, 
                Room.is_available == True,  
                rented_room.number_of_tenants <= Room.capacity)
        .first()
    )
    if not room:
        return None
    db_rented_room = RentedRoom(**rented_room.model_dump())
    db.add(db_rented_room)
    
    # Update room availability
    room.is_available = False

    db.commit()
    db.refresh(db_rented_room)
    return db_rented_room

def get_rented_room_by_id(db: Session, rr_id: int, owner_id: int):
    return (
        db.query(RentedRoom)
        .join(Room)
        .join(House)
        .filter(RentedRoom.rr_id == rr_id, House.owner_id == owner_id)
        .first()
    )

def get_rented_rooms_by_room(db: Session, room_id: int, owner_id: int):
    # Verify room belongs to owner
    room = db.query(Room).join(House).filter(Room.room_id == room_id, House.owner_id == owner_id).first()
    if not room:
        return []
    return db.query(RentedRoom).filter(RentedRoom.room_id == room_id).all()

def get_active_rented_rooms(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(RentedRoom)
        .join(Room)
        .join(House)
        .filter(RentedRoom.is_active == True, House.owner_id == owner_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

def update_rented_room(db: Session, rr_id: int, rented_room_update: RentedRoomUpdate, owner_id: int):
    db_rented_room = get_rented_room_by_id(db, rr_id, owner_id)
    if db_rented_room:
        update_data = rented_room_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_rented_room, field, value)
        db.commit()
        db.refresh(db_rented_room)
    return db_rented_room

def terminate_rental(db: Session, rr_id: int, owner_id: int):
    db_rented_room = get_rented_room_by_id(db, rr_id, owner_id)
    if db_rented_room:
        db_rented_room.is_active = False
        # Make room available again
        room = db.query(Room).filter(Room.room_id == db_rented_room.room_id).first()
        if room:
            room.is_available = True
        db.commit()
        db.refresh(db_rented_room)
    return db_rented_room
