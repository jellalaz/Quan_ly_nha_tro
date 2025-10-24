from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
import re

# Base schemas
class RoleBase(BaseModel):
    authority: str

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: int
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    fullname: str
    phone: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

    @field_validator('fullname')
    @classmethod
    def validate_fullname(cls, v: str):
        if not isinstance(v, str) or len(v.strip()) < 3:
            raise ValueError("Họ tên phải có ít nhất 3 ký tự")
        return v

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: str):
        if not re.fullmatch(r"^\d{10,11}$", v or ""):
            raise ValueError("Số điện thoại không hợp lệ. Phải gồm 10-11 chữ số")
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str):
        pwd = v or ""
        if len(pwd) < 8:
            raise ValueError("Mật khẩu quá yếu: tối thiểu 8 ký tự")
        if not re.search(r"[A-Z]", pwd):
            raise ValueError("Mật khẩu phải có ít nhất 1 chữ hoa (A-Z)")
        if not re.search(r"[a-z]", pwd):
            raise ValueError("Mật khẩu phải có ít nhất 1 chữ thường (a-z)")
        if not re.search(r"\d", pwd):
            raise ValueError("Mật khẩu phải có ít nhất 1 chữ số (0-9)")
        if not re.search(r"[^A-Za-z0-9]", pwd):
            raise ValueError("Mật khẩu phải có ít nhất 1 ký tự đặc biệt (ví dụ: !@#$%)")
        return v

class UserUpdate(BaseModel):
    fullname: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

    @field_validator('fullname')
    @classmethod
    def validate_fullname_optional(cls, v: Optional[str]):
        if v is None:
            return v
        if not isinstance(v, str) or len(v.strip()) < 3:
            raise ValueError("Họ tên phải có ít nhất 3 ký tự")
        return v

    @field_validator('phone')
    @classmethod
    def validate_phone_optional(cls, v: Optional[str]):
        if v is None:
            return v
        if not re.fullmatch(r"^\d{10,11}$", v or ""):
            raise ValueError("Số điện thoại không hợp lệ. Phải gồm 10-11 chữ số")
        return v

class User(UserBase):
    owner_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime | None = None
    role: Role

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Schema đổi mật khẩu cho người dùng hiện tại
class PasswordChange(BaseModel):
    # Mật khẩu hiện tại để xác thực
    old_password: str
    # Mật khẩu mới
    new_password: str

    # Validate độ mạnh của mật khẩu mới (giống UserCreate.password)
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str):
        pwd = v or ""
        if len(pwd) < 8:
            raise ValueError("Mật khẩu quá yếu: tối thiểu 8 ký tự")
        if not re.search(r"[A-Z]", pwd):
            raise ValueError("Mật khẩu phải có ít nhất 1 chữ hoa (A-Z)")
        if not re.search(r"[a-z]", pwd):
            raise ValueError("Mật khẩu phải có ít nhất 1 chữ thường (a-z)")
        if not re.search(r"\d", pwd):
            raise ValueError("Mật khẩu phải có ít nhất 1 chữ số (0-9)")
        if not re.search(r"[^A-Za-z0-9]", pwd):
            raise ValueError("Mật khẩu phải có ít nhất 1 ký tự đặc biệt (ví dụ: !@#$%)")
        return v
