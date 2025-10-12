from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

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
    role_id: int

class UserUpdate(BaseModel):
    fullname: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class User(UserBase):
    owner_id: int
    role_id: int
    is_active: bool
    created_at: datetime
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
