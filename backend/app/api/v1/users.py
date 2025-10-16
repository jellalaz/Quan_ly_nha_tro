from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.security import get_current_active_user, get_admin_user
from app.schemas.user import User, UserCreate, UserUpdate, Role
from app.models.user import User as UserModel
from app.crud import user as user_crud

router = APIRouter()

@router.post("/register", response_model=User)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create new user account.
    """
    db_user = user_crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    # Check phone duplication
    db_phone_user = user_crud.get_user_by_phone(db, phone=user.phone)
    if db_phone_user:
        raise HTTPException(status_code=400, detail="Phone already registered")
    try:
        return user_crud.create_user(db=db, user=user)
    except IntegrityError:
        db.rollback()
        # In case of race condition or DB unique constraint violation
        raise HTTPException(status_code=400, detail="Email or Phone already registered")

@router.get("/me", response_model=User)
async def read_users_me(
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Ensure role is loaded
    if not hasattr(current_user, 'role') or current_user.role is None:
        db.refresh(current_user, ['role'])
    return current_user

# New: Update current user's profile
@router.put("/me", response_model=User)
async def update_users_me(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    # Pre-check duplicates if changing email/phone
    if user_update.email and user_update.email != current_user.email:
        if user_crud.get_user_by_email(db, email=user_update.email):
            raise HTTPException(status_code=400, detail="Email already registered")
    if user_update.phone and user_update.phone != current_user.phone:
        if user_crud.get_user_by_phone(db, phone=user_update.phone):
            raise HTTPException(status_code=400, detail="Phone already registered")
    try:
        updated = user_crud.update_user(db, current_user.owner_id, user_update)
        return updated
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email or Phone already registered")

# Admin-only endpoints
@router.get("/owners", response_model=List[User])
async def get_owners(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin_user: UserModel = Depends(get_admin_user)
):
    """Get all users with 'owner' role - Admin only"""
    # Get owner role
    owner_role = db.query(user_crud.Role).filter(user_crud.Role.authority == "owner").first()
    if not owner_role:
        return []
    
    # Get all users with owner role
    owners = db.query(UserModel).filter(UserModel.role_id == owner_role.id).offset(skip).limit(limit).all()
    return owners

@router.get("/owners/{owner_id}", response_model=User)
async def get_owner_detail(
    owner_id: int,
    db: Session = Depends(get_db),
    admin_user: UserModel = Depends(get_admin_user)
):
    """Get specific owner details - Admin only"""
    owner = user_crud.get_user_by_id(db, owner_id)
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    
    # Check if user is actually an owner
    if owner.role.authority != "owner":
        raise HTTPException(status_code=400, detail="User is not an owner")
    
    return owner

@router.post("/owners", response_model=User)
async def create_owner(
    user: UserCreate,
    db: Session = Depends(get_db),
    admin_user: UserModel = Depends(get_admin_user)
):
    """Create new owner account - Admin only"""
    # Check duplicates
    if user_crud.get_user_by_email(db, email=user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if user_crud.get_user_by_phone(db, phone=user.phone):
        raise HTTPException(status_code=400, detail="Phone already registered")

    # Do NOT mutate pydantic model with unknown fields; role will be forced to 'owner' in CRUD
    try:
        created = user_crud.create_user(db=db, user=user)
        return created
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email or Phone already registered")

@router.put("/owners/{owner_id}", response_model=User)
async def update_owner(
    owner_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    admin_user: UserModel = Depends(get_admin_user)
):
    """Update owner information - Admin only"""
    owner = user_crud.get_user_by_id(db, owner_id)
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    
    if owner.role.authority != "owner":
        raise HTTPException(status_code=400, detail="User is not an owner")
    
    # Pre-check duplicates if changing to another existing email/phone
    if user_update.email and user_update.email != owner.email:
        if user_crud.get_user_by_email(db, email=user_update.email):
            raise HTTPException(status_code=400, detail="Email already registered")
    if user_update.phone and user_update.phone != owner.phone:
        if user_crud.get_user_by_phone(db, phone=user_update.phone):
            raise HTTPException(status_code=400, detail="Phone already registered")

    try:
        updated_owner = user_crud.update_user(db, owner_id, user_update)
        return updated_owner
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email or Phone already registered")

@router.delete("/owners/{owner_id}")
async def delete_owner(
    owner_id: int,
    db: Session = Depends(get_db),
    admin_user: UserModel = Depends(get_admin_user)
):
    """Delete owner account - Admin only"""
    owner = user_crud.get_user_by_id(db, owner_id)
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    
    if owner.role.authority != "owner":
        raise HTTPException(status_code=400, detail="User is not an owner")
    
    user_crud.delete_user(db, owner_id)
    return {"message": "Owner deleted successfully"}

@router.get("/roles", response_model=List[Role])
def get_roles(db: Session = Depends(get_db)):
    """Get all available roles"""
    return user_crud.get_roles(db)

@router.get("/admin/statistics")
async def get_admin_statistics(
    db: Session = Depends(get_db),
    admin_user: UserModel = Depends(get_admin_user)
):
    """Get overall system statistics - Admin only"""
    from app.models.house import House
    from app.models.room import Room
    from app.models.rented_room import RentedRoom
    from app.models.invoice import Invoice
    
    # Get owner role
    owner_role = db.query(user_crud.Role).filter(user_crud.Role.authority == "owner").first()
    
    # Count statistics
    total_owners = db.query(UserModel).filter(UserModel.role_id == owner_role.id).count() if owner_role else 0
    total_houses = db.query(House).count()
    total_rooms = db.query(Room).count()
    total_rented_rooms = db.query(RentedRoom).count()
    available_rooms = db.query(Room).filter(Room.is_available == True).count()
    total_invoices = db.query(Invoice).count()
    pending_invoices = db.query(Invoice).filter(Invoice.is_paid == False).count()
    
    # Calculate revenue
    from sqlalchemy import func
    total_revenue = db.query(func.sum(Invoice.price)).filter(Invoice.is_paid == True).scalar() or 0
    pending_revenue = db.query(func.sum(Invoice.price)).filter(Invoice.is_paid == False).scalar() or 0
    
    return {
        "total_owners": total_owners,
        "total_houses": total_houses,
        "total_rooms": total_rooms,
        "total_rented_rooms": total_rented_rooms,
        "available_rooms": available_rooms,
        "total_invoices": total_invoices,
        "pending_invoices": pending_invoices,
        "total_revenue": float(total_revenue),
        "pending_revenue": float(pending_revenue),
        "occupancy_rate": round((total_rented_rooms / total_rooms * 100) if total_rooms > 0 else 0, 2)
    }
