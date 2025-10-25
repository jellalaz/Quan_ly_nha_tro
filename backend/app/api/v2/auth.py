from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import timedelta

from app.core.database import get_db
from app.core.config import settings
from app.core.security import authenticate_user, create_access_token
from app.schemas.user import Token, UserLogin, User, UserCreate
from app.crud import user as user_crud

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_for_access_token(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Only allow owner role to log in
    if not hasattr(user, 'role') or user.role is None:
        db.refresh(user, ['role'])
    if not user.role or user.role.authority != 'owner':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner is allowed to login")

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email, "oid": user.owner_id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

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

