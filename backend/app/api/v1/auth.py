from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.core.config import settings
from app.core.security import authenticate_user, create_access_token
from app.schemas.user import Token

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
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
