from sqlalchemy.orm import Session
from typing import List
from app.models.house import House
from app.schemas.house import HouseCreate, HouseUpdate

def create_house(db: Session, house: HouseCreate, owner_id: int):
    db_house = House(**house.dict(), owner_id=owner_id)
    db.add(db_house)
    db.commit()
    db.refresh(db_house)
    return db_house

def get_house_by_id(db: Session, house_id: int):
    return db.query(House).filter(House.house_id == house_id).first()

def get_houses_by_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    return db.query(House).filter(House.owner_id == owner_id).offset(skip).limit(limit).all()

def get_all_houses(db: Session, skip: int = 0, limit: int = 100):
    return db.query(House).offset(skip).limit(limit).all()

def update_house(db: Session, house_id: int, house_update: HouseUpdate):
    db_house = get_house_by_id(db, house_id)
    if db_house:
        update_data = house_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_house, field, value)
        db.commit()
        db.refresh(db_house)
    return db_house

def delete_house(db: Session, house_id: int):
    db_house = get_house_by_id(db, house_id)
    if db_house:
        db.delete(db_house)
        db.commit()
    return db_house
