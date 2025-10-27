# GIẢI THÍCH CHI TIẾT FILE USERS.PY

## 📋 TỔNG QUAN
File `users.py` là file xử lý **quản lý thông tin người dùng** trong hệ thống quản lý nhà trọ. File này có 4 chức năng chính:
1. **Xem thông tin cá nhân** - Lấy thông tin user đang đăng nhập
2. **Cập nhật thông tin cá nhân** - Sửa họ tên, email, số điện thoại
3. **Xem danh sách roles** - Lấy tất cả các role trong hệ thống
4. **Đổi mật khẩu** - Thay đổi mật khẩu cho user hiện tại

---

## 📦 CÁC THƯ VIỆN IMPORT

```python
from fastapi import APIRouter, Depends, HTTPException
```
- **APIRouter**: Tạo router để định nghĩa các endpoint API
- **Depends**: Dependency injection - tự động cung cấp tham số (database, user hiện tại)
- **HTTPException**: Ném lỗi HTTP khi có vấn đề

```python
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
```
- **Session**: Đối tượng để thao tác với database
- **IntegrityError**: Lỗi khi vi phạm ràng buộc database (email/phone trùng)

```python
from typing import List
```
- **List**: Kiểu dữ liệu danh sách (dùng cho response trả về nhiều items)

```python
from app.core.database import get_db
from app.core.security import get_current_active_user, verify_password, get_password_hash
from app.schemas.user import User, UserUpdate, Role, PasswordChange
from app.models.user import User as UserModel
from app.crud import user as user_crud
```
- **get_db**: Hàm lấy kết nối database
- **get_current_active_user**: Lấy thông tin user đang đăng nhập từ JWT token
- **verify_password**: Kiểm tra mật khẩu có khớp với hash không
- **get_password_hash**: Hash mật khẩu mới
- **User, UserUpdate, Role, PasswordChange**: Các schema định nghĩa cấu trúc dữ liệu
- **UserModel**: Model database của User (đổi tên để tránh trùng với schema User)
- **user_crud**: Module chứa các hàm CRUD

---

## 👤 ENDPOINT 1: XEM THÔNG TIN CÁ NHÂN

### Định nghĩa endpoint
```python
@router.get("/me", response_model=User)
async def read_users_me(
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
```

**Giải thích:**
- `@router.get("/me")`: Endpoint GET tại đường dẫn `/me`
- `response_model=User`: Kết quả trả về có cấu trúc như model `User`
- `current_user: UserModel = Depends(get_current_active_user)`: Tự động lấy user từ JWT token
- `db: Session = Depends(get_db)`: Tự động lấy kết nối database

**Không cần dữ liệu đầu vào** - Chỉ cần gửi JWT token trong header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Luồng xử lý

```python
# Ensure role is loaded
if not hasattr(current_user, 'role') or current_user.role is None:
    db.refresh(current_user, ['role'])
return current_user
```

**Giải thích:**
1. Kiểm tra xem đối tượng `current_user` đã có thông tin `role` chưa
2. Nếu chưa, gọi `db.refresh(current_user, ['role'])` để load từ database
3. Trả về toàn bộ thông tin user

**Cơ chế get_current_active_user** (từ `core/security.py`):
```python
async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
```
- Lấy user từ JWT token
- Kiểm tra `is_active = True`
- Nếu user bị vô hiệu hóa → Trả lỗi 400

### Kết quả trả về (User)

**Schema User** (từ `schemas/user.py`):
```python
class User(UserBase):
    owner_id: int                      # ID người dùng
    is_active: bool                    # Trạng thái hoạt động
    created_at: datetime               # Thời gian tạo tài khoản
    updated_at: datetime | None        # Thời gian cập nhật gần nhất
    role: Role                         # Thông tin quyền

class UserBase(BaseModel):
    fullname: str                      # Họ tên
    phone: str                         # Số điện thoại
    email: EmailStr                    # Email
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
  "updated_at": "2025-10-27T15:45:00Z",
  "role": {
    "id": 1,
    "authority": "owner"
  }
}
```

---

## ✏️ ENDPOINT 2: CẬP NHẬT THÔNG TIN CÁ NHÂN

### Định nghĩa endpoint
```python
@router.put("/me", response_model=User)
async def update_users_me(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
```

**Giải thích:**
- `@router.put("/me")`: Endpoint PUT (cập nhật) tại `/me`
- `user_update: UserUpdate`: Dữ liệu cập nhật từ client
- `current_user`: User đang đăng nhập (từ JWT token)

**Dữ liệu đầu vào (UserUpdate)** - Từ file `schemas/user.py`:
```python
class UserUpdate(BaseModel):
    fullname: Optional[str] = None     # Họ tên mới (không bắt buộc)
    phone: Optional[str] = None        # SĐT mới (không bắt buộc)
    email: Optional[EmailStr] = None   # Email mới (không bắt buộc)
```

**Đặc điểm:**
- Tất cả các field đều **Optional** (không bắt buộc)
- Chỉ cần gửi field muốn cập nhật
- Vẫn có validation tương tự UserCreate (họ tên >= 3 ký tự, phone 10-11 số)

**Ví dụ request body:**
```json
{
  "fullname": "Nguyễn Văn B",
  "phone": "0987654321"
}
```
Hoặc chỉ cập nhật 1 field:
```json
{
  "email": "newemail@example.com"
}
```

### Bước 1: Kiểm tra email trùng lặp (nếu đổi email)

```python
if user_update.email and user_update.email != current_user.email:
    if user_crud.get_user_by_email(db, email=user_update.email):
        raise HTTPException(status_code=400, detail="Email already registered")
```

**Giải thích:**
- Kiểm tra nếu user muốn đổi email (có gửi email mới và khác email hiện tại)
- Tìm trong database xem email mới đã có ai dùng chưa
- Nếu đã tồn tại → Trả lỗi **400 Bad Request**

**Tại sao phải kiểm tra `user_update.email != current_user.email`?**
- Nếu user gửi lại email hiện tại của mình → Không cần kiểm tra trùng
- Chỉ kiểm tra khi thực sự muốn đổi sang email khác

### Bước 2: Kiểm tra phone trùng lặp (nếu đổi SĐT)

```python
if user_update.phone and user_update.phone != current_user.phone:
    if user_crud.get_user_by_phone(db, phone=user_update.phone):
        raise HTTPException(status_code=400, detail="Phone already registered")
```

**Giải thích:**
- Tương tự kiểm tra email
- Kiểm tra số điện thoại mới có bị trùng với user khác không

### Bước 3: Cập nhật thông tin

```python
try:
    updated = user_crud.update_user(db, current_user.owner_id, user_update)
    return updated
except IntegrityError:
    db.rollback()
    raise HTTPException(status_code=400, detail="Email or Phone already registered")
```

**Giải thích:**
- Gọi hàm `update_user` từ `crud/user.py`
- Nếu xảy ra IntegrityError (ví dụ: race condition - 2 request cùng lúc) → Rollback và báo lỗi
- Trả về thông tin user đã cập nhật

**Chi tiết hàm update_user** (từ `crud/user.py`):
```python
def update_user(db: Session, user_id: int, user_update: UserUpdate):
    db_user = get_user_by_id(db, user_id)          # Tìm user theo ID
    if db_user:
        update_data = user_update.dict(exclude_unset=True)  # Chỉ lấy field có giá trị
        for field, value in update_data.items():
            setattr(db_user, field, value)          # Cập nhật từng field
        db.commit()                                 # Lưu vào database
        db.refresh(db_user)                         # Làm mới object
    return db_user
```

**Lưu ý `exclude_unset=True`:**
- Chỉ lấy các field mà user thực sự gửi lên
- Ví dụ: Nếu chỉ gửi `{"fullname": "New Name"}` → Chỉ cập nhật fullname, không động email/phone

### Kết quả trả về
- Trả về thông tin user đã cập nhật (schema `User`)
- Giống như kết quả của endpoint `/me`

---

## 🔑 ENDPOINT 3: XEM DANH SÁCH ROLES

### Định nghĩa endpoint
```python
@router.get("/roles", response_model=List[Role])
def get_roles(db: Session = Depends(get_db)):
    """Get all available roles"""
    return user_crud.get_roles(db)
```

**Giải thích:**
- `@router.get("/roles")`: Endpoint GET tại `/roles`
- `response_model=List[Role]`: Trả về danh sách các Role
- **Không yêu cầu xác thực** - Không có `Depends(get_current_active_user)`

**Không cần dữ liệu đầu vào** - Chỉ cần gửi GET request

### Luồng xử lý

```python
return user_crud.get_roles(db)
```

**Chi tiết hàm get_roles** (từ `crud/user.py`):
```python
def get_roles(db: Session):
    return db.query(Role).all()  # Lấy tất cả roles từ bảng roles
```

### Kết quả trả về (List[Role])

**Schema Role** (từ `schemas/user.py`):
```python
class Role(RoleBase):
    id: int
    authority: str

class RoleBase(BaseModel):
    authority: str
```

**Ví dụ kết quả:**
```json
[
  {
    "id": 1,
    "authority": "owner"
  },
  {
    "id": 2,
    "authority": "tenant"
  },
  {
    "id": 3,
    "authority": "admin"
  }
]
```

**Cấu trúc bảng roles** (từ `models/user.py`):
```python
class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    authority = Column(String(50), unique=True, nullable=False)
    
    users = relationship("User", back_populates="role")
```

---

## 🔒 ENDPOINT 4: ĐỔI MẬT KHẨU

### Định nghĩa endpoint
```python
@router.patch("/me/password")
async def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
```

**Giải thích:**
- `@router.patch("/me/password")`: Endpoint PATCH (cập nhật một phần) tại `/me/password`
- `payload: PasswordChange`: Dữ liệu đổi mật khẩu từ client
- `current_user`: User đang đăng nhập (cần xác thực)

**Dữ liệu đầu vào (PasswordChange)** - Từ file `schemas/user.py`:
```python
class PasswordChange(BaseModel):
    old_password: str      # Mật khẩu hiện tại (để xác thực)
    new_password: str      # Mật khẩu mới
```

**Validation cho new_password** (tự động):
- Tối thiểu 8 ký tự
- Ít nhất 1 chữ HOA (A-Z)
- Ít nhất 1 chữ thường (a-z)
- Ít nhất 1 chữ số (0-9)
- Ít nhất 1 ký tự đặc biệt (!@#$%...)

**Ví dụ request body:**
```json
{
  "old_password": "OldPass123!",
  "new_password": "NewPass456@"
}
```

### Bước 1: Xác thực mật khẩu hiện tại

```python
if not verify_password(payload.old_password, current_user.password):
    raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")
```

**Giải thích:**
- Dùng hàm `verify_password` để kiểm tra mật khẩu cũ có đúng không
- So sánh `old_password` (plain text) với `current_user.password` (đã hash)
- Nếu không khớp → Trả lỗi **400 Bad Request**

**Chi tiết hàm verify_password** (từ `core/security.py`):
```python
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)
```
- Dùng bcrypt để verify
- Bcrypt tự động trích xuất salt từ `hashed_password` để so sánh

**Tại sao phải xác thực mật khẩu cũ?**
- Bảo mật: Đảm bảo người đổi mật khẩu là chính chủ tài khoản
- Nếu ai đó lấy được token nhưng không biết password → Không thể đổi password

### Bước 2: Hash và cập nhật mật khẩu mới

```python
current_user.password = get_password_hash(payload.new_password)
db.add(current_user)
db.commit()
```

**Giải thích:**
1. Hash mật khẩu mới bằng bcrypt (tạo salt mới tự động)
2. Gán mật khẩu đã hash vào `current_user.password`
3. Đánh dấu object để update (`db.add`)
4. Lưu vào database (`db.commit`)

**Chi tiết hàm get_password_hash** (từ `core/security.py`):
```python
def get_password_hash(password):
    return pwd_context.hash(password)
```
- Dùng bcrypt để hash
- **Tạo salt mới ngẫu nhiên** mỗi lần hash
- Trả về chuỗi hash có format: `$2b$12$salt...hash...`

**Lưu ý quan trọng:**
- Mỗi lần đổi password sẽ có **salt mới**
- Không dùng lại salt cũ
- Đây là cơ chế bảo mật chuẩn của bcrypt

### Bước 3: Trả kết quả

```python
return {"message": "Đổi mật khẩu thành công"}
```

**Kết quả trả về:**
```json
{
  "message": "Đổi mật khẩu thành công"
}
```

**Không có response_model** → Trả về dict tự do

**Sau khi đổi password:**
- User vẫn giữ JWT token hiện tại (vẫn đăng nhập được)
- Nếu muốn bắt user đăng nhập lại → Cần implement thêm cơ chế blacklist token

---

## 📊 SƠ ĐỒ LUỒNG XỬ LÝ

### LUỒNG XEM THÔNG TIN:
```
1. Client gửi GET /me với JWT token trong header
   ↓
2. get_current_active_user() lấy user từ token
   ↓
3. Kiểm tra is_active = true
   ↓
4. Load thông tin role từ database (nếu chưa có)
   ↓
5. Trả về thông tin user đầy đủ
```

### LUỒNG CẬP NHẬT THÔNG TIN:
```
1. Client gửi PUT /me với {fullname?, phone?, email?} + JWT token
   ↓
2. get_current_active_user() lấy user từ token
   ↓
3. Validation dữ liệu (Pydantic tự động)
   ↓
4. Nếu đổi email → Kiểm tra email mới chưa bị trùng
   ↓
5. Nếu đổi phone → Kiểm tra phone mới chưa bị trùng
   ↓
6. Cập nhật các field vào database
   ↓
7. Trả về thông tin user đã cập nhật
```

### LUỒNG XEM ROLES:
```
1. Client gửi GET /roles
   ↓
2. Lấy tất cả roles từ bảng roles
   ↓
3. Trả về danh sách roles
```

### LUỒNG ĐỔI MẬT KHẨU:
```
1. Client gửi PATCH /me/password với {old_password, new_password} + JWT token
   ↓
2. get_current_active_user() lấy user từ token
   ↓
3. Validation new_password (tối thiểu 8 ký tự, có chữ hoa, thường, số, ký tự đặc biệt)
   ↓
4. verify_password() kiểm tra old_password có đúng không
   ↓
5. Hash new_password với salt mới
   ↓
6. Cập nhật password vào database
   ↓
7. Trả về message thành công
```

---

## 🔗 LIÊN KẾT GIỮA CÁC FILE

```
users.py (file hiện tại)
├── Import schemas từ: schemas/user.py
│   ├── User (thông tin user đầy đủ)
│   ├── UserUpdate (dữ liệu cập nhật - optional fields)
│   ├── Role (thông tin quyền)
│   └── PasswordChange (dữ liệu đổi mật khẩu)
│
├── Import CRUD từ: crud/user.py
│   ├── update_user() - Cập nhật thông tin user
│   ├── get_user_by_email() - Tìm user theo email
│   ├── get_user_by_phone() - Tìm user theo phone
│   └── get_roles() - Lấy tất cả roles
│
├── Import security từ: core/security.py
│   ├── get_current_active_user() - Lấy user từ JWT token
│   ├── verify_password() - Kiểm tra mật khẩu cũ
│   └── get_password_hash() - Hash mật khẩu mới
│
├── Import database từ: core/database.py
│   └── get_db() - Lấy database session
│
└── Sử dụng models từ: models/user.py
    ├── User (as UserModel) - Model bảng users
    └── Role - Model bảng roles
```

---

## 🗂️ CẤU TRÚC DATABASE

### Bảng `users`
```python
class User(Base):
    __tablename__ = "users"
    
    owner_id = Column(Integer, primary_key=True, autoincrement=True)
    fullname = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)       # UNIQUE constraint
    email = Column(String(100), unique=True, nullable=False)      # UNIQUE constraint
    password = Column(String(255), nullable=False)                # Mật khẩu đã hash
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())  # Tự động update
```

**Lưu ý:**
- `updated_at` tự động cập nhật khi có thay đổi
- `email` và `phone` có UNIQUE constraint → Không được trùng

---

## 🎯 TÓM TẮT

### File users.py làm gì?
1. **GET /me**: Xem thông tin cá nhân (cần đăng nhập)
2. **PUT /me**: Cập nhật thông tin cá nhân (cần đăng nhập)
3. **GET /roles**: Xem danh sách roles (không cần đăng nhập)
4. **PATCH /me/password**: Đổi mật khẩu (cần đăng nhập + mật khẩu cũ)

### Dữ liệu đầu vào:
- **GET /me**: Chỉ cần JWT token trong header
- **PUT /me**: JWT token + {fullname?, phone?, email?}
- **GET /roles**: Không cần gì
- **PATCH /me/password**: JWT token + {old_password, new_password}

### Dữ liệu trả về:
- **GET /me**: Thông tin user đầy đủ (User schema)
- **PUT /me**: Thông tin user đã cập nhật (User schema)
- **GET /roles**: Danh sách roles (List[Role])
- **PATCH /me/password**: Message thành công

### Đọc/Ghi dữ liệu từ đâu?
- **Database**: Bảng `users` và `roles`
- **Schemas**: `schemas/user.py` định nghĩa cấu trúc dữ liệu
- **Models**: `models/user.py` định nghĩa cấu trúc bảng database
- **CRUD**: `crud/user.py` chứa logic thao tác database
- **Security**: `core/security.py` xử lý JWT token, hash/verify password

### Bảo mật:
- ✅ Tất cả endpoint (trừ /roles) yêu cầu JWT token
- ✅ Kiểm tra user is_active trước khi cho phép thao tác
- ✅ Kiểm tra email/phone không trùng khi cập nhật
- ✅ Đổi password phải nhập đúng mật khẩu cũ
- ✅ Mật khẩu mới có validation chặt chẽ
- ✅ Mỗi lần đổi password tạo salt mới (bcrypt tự động)
- ✅ Sử dụng IntegrityError để xử lý race condition

### So sánh với auth.py:
| Đặc điểm | auth.py | users.py |
|----------|---------|----------|
| **Mục đích** | Đăng nhập/Đăng ký | Quản lý thông tin user |
| **Xác thực** | Tạo JWT token | Sử dụng JWT token |
| **Tạo user** | ✅ (register) | ❌ |
| **Cập nhật user** | ❌ | ✅ (update profile) |
| **Đổi password** | ❌ | ✅ (change password) |
| **Yêu cầu đăng nhập** | ❌ | ✅ (trừ /roles) |

