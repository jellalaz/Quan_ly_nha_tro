from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.security import get_current_active_user
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

@router.get("/roles", response_model=List[Role])
def get_roles(db: Session = Depends(get_db)):
    """Get all available roles"""
    return user_crud.get_roles(db)
