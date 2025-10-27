from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.security import get_current_active_user, verify_password, get_password_hash
from app.schemas.user import User, UserUpdate, Role, PasswordChange
from app.models.user import User as UserModel
from app.crud import user as user_crud

router = APIRouter()

# Lấy thông tin người dùng hiện tại
@router.get("/me", response_model=User)
async def read_users_me(
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Nếu chưa load vai trò, thì load lại từ DB
    if not hasattr(current_user, 'role') or current_user.role is None:
        db.refresh(current_user, ['role'])
    return current_user

# Cập nhật thông tin người dùng hiện tại (PATCH vì chỉ cập nhật một phần)
@router.patch("/me", response_model=User)
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

# Lấy danh sách vai trò
@router.get("/roles", response_model=List[Role])
def get_roles(db: Session = Depends(get_db)):
    """Get all available roles"""
    return user_crud.get_roles(db)

# Đổi mật khẩu cho người dùng hiện tại
@router.patch("/me/password")
async def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    # Kiểm tra mật khẩu hiện tại có đúng không
    if not verify_password(payload.old_password, current_user.password):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")

    # Cập nhật mật khẩu mới đã băm
    current_user.password = get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()
    return {"message": "Đổi mật khẩu thành công"}
