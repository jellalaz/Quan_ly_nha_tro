# GIẢI THÍCH CHI TIẾT FILE AUTH.PY

## 📋 TỔNG QUAN
File `auth.py` là file xử lý **xác thực và đăng ký** người dùng trong hệ thống quản lý nhà trọ. File này có 2 chức năng chính:
1. **Đăng nhập (login)** - Cho phép người dùng đăng nhập vào hệ thống
2. **Đăng ký (register)** - Cho phép người dùng tạo tài khoản mới

---

## 📦 CÁC THƯ VIỆN IMPORT

```python
from fastapi import APIRouter, Depends, HTTPException, status
```
- **APIRouter**: Tạo router để định nghĩa các đường dẫn API (endpoint)
- **Depends**: Dependency injection - cơ chế để FastAPI tự động cung cấp các tham số (như kết nối database)
- **HTTPException**: Ném lỗi HTTP khi có vấn đề (ví dụ: sai mật khẩu)
- **status**: Chứa các mã trạng thái HTTP (401, 403, 400...)

```python
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
```
- **Session**: Đối tượng để thao tác với database
- **IntegrityError**: Lỗi xảy ra khi vi phạm ràng buộc database (ví dụ: email trùng)

```python
from datetime import timedelta
```
- **timedelta**: Tính toán khoảng thời gian (dùng để đặt thời gian hết hạn token)

```python
from app.core.database import get_db
from app.core.config import settings
from app.core.security import authenticate_user, create_access_token
from app.schemas.user import Token, UserLogin, User, UserCreate
from app.crud import user as user_crud
```
- **get_db**: Hàm lấy kết nối database
- **settings**: Cấu hình hệ thống (thời gian hết hạn token, secret key...)
- **authenticate_user**: Hàm xác thực người dùng (kiểm tra email và mật khẩu)
- **create_access_token**: Hàm tạo JWT token để người dùng đăng nhập
- **Token, UserLogin, User, UserCreate**: Các schema định nghĩa cấu trúc dữ liệu
- **user_crud**: Module chứa các hàm CRUD (Create, Read, Update, Delete) cho user

---

## 🔐 ENDPOINT 1: ĐĂNG NHẬP (LOGIN)

### Định nghĩa endpoint
```python
@router.post("/login", response_model=Token)
async def login_for_access_token(credentials: UserLogin, db: Session = Depends(get_db)):
```

**Giải thích:**
- `@router.post("/login")`: Đây là endpoint POST tại đường dẫn `/login`
- `response_model=Token`: Kết quả trả về sẽ có cấu trúc như model `Token`
- `credentials: UserLogin`: Nhận dữ liệu đăng nhập (email + password) từ client
- `db: Session = Depends(get_db)`: Tự động lấy kết nối database

**Dữ liệu đầu vào (UserLogin)** - Từ file `schemas/user.py`:
```python
class UserLogin(BaseModel):
    email: EmailStr      # Email người dùng (phải đúng định dạng email)
    password: str        # Mật khẩu (dạng text thường)
```

### Bước 1: Xác thực người dùng
```python
user = authenticate_user(db, credentials.email, credentials.password)
if not user:
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )
```

**Giải thích:**
- Gọi hàm `authenticate_user` từ file `core/security.py`
- Hàm này kiểm tra:
  1. Email có tồn tại trong database không?
  2. Mật khẩu nhập vào có khớp với mật khẩu đã hash trong database không?
- Nếu sai email hoặc mật khẩu → Trả lỗi **401 UNAUTHORIZED**

**Chi tiết hàm authenticate_user** (từ `core/security.py`):
```python
def authenticate_user(db: Session, email: str, password: str):
    user = get_user(db, email)                    # Tìm user theo email
    if not user:                                   # Không tìm thấy user
        return False
    if not verify_password(password, user.password): # Mật khẩu không khớp
        return False
    return user                                    # Trả về đối tượng user
```

### Bước 2: Kiểm tra quyền (role)
```python
if not hasattr(user, 'role') or user.role is None:
    db.refresh(user, ['role'])
if not user.role or user.role.authority != 'owner':
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
                        detail="Only owner is allowed to login")
```

**Giải thích:**
- Kiểm tra xem đối tượng `user` có thuộc tính `role` chưa
- Nếu chưa có, gọi `db.refresh(user, ['role'])` để load thông tin role từ database
- **CHỈ CHO PHÉP** người dùng có quyền `owner` đăng nhập
- Nếu không phải `owner` → Trả lỗi **403 FORBIDDEN**

**Cấu trúc Role** (từ `models/user.py`):
```python
class Role(Base):
    id = Column(Integer, primary_key=True)
    authority = Column(String(50), unique=True, nullable=False)  # Ví dụ: "owner", "tenant"
```

### Bước 3: Tạo Access Token
```python
access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
access_token = create_access_token(
    data={"sub": user.email, "oid": user.owner_id}, 
    expires_delta=access_token_expires
)
```

**Giải thích:**
- Tính thời gian hết hạn token (ví dụ: 30 phút)
- Tạo JWT token chứa thông tin:
  - `sub`: Email của user
  - `oid`: Owner ID (user.owner_id)
  - `exp`: Thời gian hết hạn
- JWT được mã hóa bằng `secret_key` từ settings

**Chi tiết hàm create_access_token** (từ `core/security.py`):
```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta    # Thời gian hết hạn
    to_encode.update({"exp": expire})              # Thêm thời gian hết hạn vào token
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt
```

### Bước 4: Trả kết quả
```python
return {"access_token": access_token, "token_type": "bearer"}
```

**Kết quả trả về (Token)** - Từ file `schemas/user.py`:
```python
class Token(BaseModel):
    access_token: str    # JWT token string
    token_type: str      # Luôn là "bearer"
```

**Ví dụ kết quả:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

## 📝 ENDPOINT 2: ĐĂNG KÝ (REGISTER)

### Định nghĩa endpoint
```python
@router.post("/register", response_model=User)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
```

**Giải thích:**
- `@router.post("/register")`: Endpoint POST tại `/register`
- `response_model=User`: Trả về thông tin user đã tạo
- `user: UserCreate`: Nhận dữ liệu đăng ký từ client

**Dữ liệu đầu vào (UserCreate)** - Từ file `schemas/user.py`:
```python
class UserCreate(UserBase):
    password: str        # Mật khẩu (có validation rất chặt chẽ)

class UserBase(BaseModel):
    fullname: str        # Họ tên (tối thiểu 3 ký tự)
    phone: str          # Số điện thoại (10-11 chữ số)
    email: EmailStr     # Email (phải đúng định dạng)
```

**Các validation tự động (từ schemas/user.py):**
- **Họ tên**: Tối thiểu 3 ký tự
- **Số điện thoại**: Phải là 10-11 chữ số
- **Mật khẩu phải có**:
  - Tối thiểu 8 ký tự
  - Ít nhất 1 chữ HOA (A-Z)
  - Ít nhất 1 chữ thường (a-z)
  - Ít nhất 1 chữ số (0-9)
  - Ít nhất 1 ký tự đặc biệt (!@#$%...)

### Bước 1: Kiểm tra email đã tồn tại
```python
db_user = user_crud.get_user_by_email(db, email=user.email)
if db_user:
    raise HTTPException(status_code=400, detail="Email already registered")
```

**Giải thích:**
- Gọi hàm `get_user_by_email` từ `crud/user.py` để tìm user theo email
- Nếu đã có email này trong database → Trả lỗi **400 Bad Request**

**Chi tiết hàm get_user_by_email** (từ `crud/user.py`):
```python
def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()
```

### Bước 2: Kiểm tra số điện thoại đã tồn tại
```python
db_phone_user = user_crud.get_user_by_phone(db, phone=user.phone)
if db_phone_user:
    raise HTTPException(status_code=400, detail="Phone already registered")
```

**Giải thích:**
- Tương tự như kiểm tra email, nhưng kiểm tra số điện thoại
- Nếu số điện thoại đã tồn tại → Trả lỗi **400 Bad Request**

### Bước 3: Tạo user mới
```python
try:
    return user_crud.create_user(db=db, user=user)
except IntegrityError:
    db.rollback()
    raise HTTPException(status_code=400, detail="Email or Phone already registered")
```

**Giải thích:**
- Gọi hàm `create_user` để tạo user mới trong database
- Nếu có lỗi IntegrityError (ví dụ: 2 request cùng lúc với cùng email) → Rollback và trả lỗi

**Chi tiết hàm create_user** (từ `crud/user.py`):
```python
def create_user(db: Session, user: UserCreate):
    # 1. Hash mật khẩu (mã hóa bằng bcrypt)
    hashed_password = get_password_hash(user.password)

    # 2. Tìm hoặc tạo role "owner"
    owner_role = db.query(Role).filter(Role.authority == "owner").first()
    if not owner_role:
        owner_role = Role(authority="owner")
        db.add(owner_role)
        db.commit()
        db.refresh(owner_role)

    # 3. Tạo user mới
    db_user = User(
        fullname=user.fullname,
        phone=user.phone,
        email=user.email,
        password=hashed_password,   # Lưu mật khẩu đã hash
        role_id=owner_role.id       # Gán role_id
    )
    
    # 4. Lưu vào database
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
```

### Kết quả trả về (User)
**Schema User** (từ `schemas/user.py`):
```python
class User(UserBase):
    owner_id: int                      # ID tự động tăng
    is_active: bool                    # Trạng thái hoạt động (mặc định True)
    created_at: datetime               # Thời gian tạo
    updated_at: datetime | None        # Thời gian cập nhật
    role: Role                         # Thông tin role

class Role(RoleBase):
    id: int
    authority: str                     # "owner", "tenant", etc.
```

**Ví dụ kết quả:**
```json
{
  "owner_id": 1,
  "fullname": "Nguyễn Văn A",
  "phone": "0123456789",
  "email": "nguyenvana@example.com",
  "is_active": true,
  "created_at": "2025-10-27T10:30:00Z",
  "updated_at": null,
  "role": {
    "id": 1,
    "authority": "owner"
  }
}
```

---

## 🗂️ CẤU TRÚC DATABASE (từ models/user.py)

### Bảng `users`
```python
class User(Base):
    __tablename__ = "users"
    
    owner_id = Column(Integer, primary_key=True, autoincrement=True)  # Khóa chính
    fullname = Column(String(100), nullable=False)                    # Họ tên
    phone = Column(String(20), unique=True, nullable=False)           # SĐT (unique)
    email = Column(String(100), unique=True, nullable=False)          # Email (unique)
    password = Column(String(255), nullable=False)                    # Mật khẩu đã hash
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False) # Khóa ngoại
    is_active = Column(Boolean, default=True)                         # Trạng thái
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    role = relationship("Role", back_populates="users")               # Quan hệ với Role
    houses = relationship("House", back_populates="owner")            # Quan hệ với House
```

### Bảng `roles`
```python
class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    authority = Column(String(50), unique=True, nullable=False)  # "owner", "tenant"...
    
    users = relationship("User", back_populates="role")
```

---

## 📊 SƠ ĐỒ LUỒNG XỬ LÝ

### LUỒNG ĐĂNG NHẬP:
```
1. Client gửi POST /login với {email, password}
   ↓
2. authenticate_user() kiểm tra email & password
   ↓
3. Kiểm tra role phải là "owner"
   ↓
4. Tạo JWT token chứa {sub: email, oid: owner_id}
   ↓
5. Trả về {access_token, token_type: "bearer"}
   ↓
6. Client lưu token và gửi kèm trong header cho các request sau
```

### LUỒNG ĐĂNG KÝ:
```
1. Client gửi POST /register với {fullname, phone, email, password}
   ↓
2. Validation dữ liệu (tự động bởi Pydantic)
   ↓
3. Kiểm tra email đã tồn tại chưa
   ↓
4. Kiểm tra phone đã tồn tại chưa
   ↓
5. Hash mật khẩu bằng bcrypt
   ↓
6. Tạo hoặc lấy role "owner"
   ↓
7. Lưu user mới vào database
   ↓
8. Trả về thông tin user (không có password)
```

---

## 🔗 LIÊN KẾT GIỮA CÁC FILE

```
auth.py (file hiện tại)
├── Import schemas từ: schemas/user.py
│   ├── Token (kết quả đăng nhập)
│   ├── UserLogin (dữ liệu đăng nhập)
│   ├── User (thông tin user)
│   └── UserCreate (dữ liệu đăng ký)
│
├── Import CRUD từ: crud/user.py
│   ├── create_user() - Tạo user mới
│   ├── get_user_by_email() - Tìm user theo email
│   └── get_user_by_phone() - Tìm user theo phone
│
├── Import security từ: core/security.py
│   ├── authenticate_user() - Xác thực user
│   ├── create_access_token() - Tạo JWT token
│   ├── verify_password() - Kiểm tra mật khẩu
│   └── get_password_hash() - Hash mật khẩu
│
├── Import database từ: core/database.py
│   └── get_db() - Lấy database session
│
├── Import config từ: core/config.py
│   └── settings - Cấu hình (secret_key, token expire time...)
│
└── Sử dụng models từ: models/user.py
    ├── User - Model bảng users
    └── Role - Model bảng roles
```

---

## 🎯 TÓM TẮT

### File auth.py làm gì?
- **Đăng nhập**: Kiểm tra email/password, xác minh role là "owner", trả về JWT token
- **Đăng ký**: Tạo tài khoản mới với role "owner", kiểm tra email/phone không trùng

### Dữ liệu đầu vào:
- **Login**: Email + Password
- **Register**: Fullname + Phone + Email + Password

### Dữ liệu trả về:
- **Login**: JWT Token (để xác thực các request sau)
- **Register**: Thông tin user vừa tạo (không có password)

### Đọc dữ liệu từ đâu?
- **Database**: Bảng `users` và `roles` (định nghĩa trong `models/user.py`)
- **Schemas**: `schemas/user.py` định nghĩa cấu trúc dữ liệu đầu vào/đầu ra
- **CRUD**: `crud/user.py` chứa các hàm thao tác database
- **Security**: `core/security.py` xử lý xác thực và mã hóa
- **Config**: `core/config.py` cung cấp cấu hình hệ thống

### Bảo mật:
- ✅ Mật khẩu được hash bằng bcrypt (không lưu plain text)
- ✅ JWT token có thời gian hết hạn
- ✅ Chỉ cho phép role "owner" đăng nhập
- ✅ Kiểm tra trùng lặp email và phone
- ✅ Validation chặt chẽ (độ dài, format, ký tự đặc biệt...)

