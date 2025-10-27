# 📘 GIẢI THÍCH CHI TIẾT: `user.role.authority`

## 🎯 TÓM TẮT NHANH
`user.role.authority` là một chuỗi text lấy từ **bảng `roles`** trong database, được liên kết với **bảng `users`** thông qua **relationship SQLAlchemy**.

---

## 📊 CẤU TRÚC DATABASE

### 1️⃣ **Bảng `roles`** (Bảng vai trò)
```sql
┌─────────────────────────────┐
│        TABLE: roles         │
├─────────────────────────────┤
│ id (PK)      │ authority    │
├─────────────────────────────┤
│ 1            │ "owner"      │
│ 2            │ "tenant"     │
│ 3            │ "admin"      │
└─────────────────────────────┘
```

**Định nghĩa trong Model** (`app/models/user.py` dòng 6-12):
```python
class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    authority = Column(String(50), unique=True, nullable=False)  # ← ĐÂY NÈ!
    
    users = relationship("User", back_populates="role")
```

**Đặc điểm:**
- `authority`: Tên vai trò (string), **UNIQUE** và **NOT NULL**
- Ví dụ giá trị: `"owner"`, `"tenant"`, `"admin"`

---

### 2️⃣ **Bảng `users`** (Bảng người dùng)
```sql
┌───────────────────────────────────────────────┐
│              TABLE: users                      │
├──────────────��────────────────────────────────┤
│ owner_id │ fullname │ email │ role_id (FK)   │
├───────────────────────────────────────────────┤
│ 1        │ Nguyen A │ ...   │ 1 → roles.id   │
│ 2        │ Tran B   │ ...   │ 2 → roles.id   │
└───────────────────────────────────────────────┘
```

**Định nghĩa trong Model** (`app/models/user.py` dòng 14-28):
```python
class User(Base):
    __tablename__ = "users"
    
    owner_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fullname = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)  # ← Foreign Key
    # ... các field khác
    
    role = relationship("Role", back_populates="users")  # ← QUAN HỆ ĐÂY!
```

---

## 🔗 MỐI QUAN HỆ (RELATIONSHIP)

### Sơ đồ quan hệ:
```
┌─────────────┐           ┌─────────────┐
│    User     │           │    Role     │
├─────────────┤           ├─────────────┤
│ owner_id    │           │ id          │
│ fullname    │           │ authority   │
│ email       │    FK     ├─────────────┘
│ role_id     ├──────────►│
│             │  1 : N    
│ role ───────┼──────┐    
└─────────────┘      │    
                     │    
                     └──► Khi gọi user.role 
                          → Trả về object Role
                          → Có thuộc tính authority
```

### Cách hoạt động:
1. Trong bảng `users`, có cột `role_id` (Foreign Key) → trỏ đến `roles.id`
2. SQLAlchemy tạo **relationship** `role` → tự động JOIN 2 bảng
3. Khi gọi `user.role` → trả về object `Role` tương ứng
4. Object `Role` có thuộc tính `authority` → **`user.role.authority`**

---

## 💻 TRONG CODE `auth.py`

### Dòng 27 bạn đang chọn:
```python
if not user.role or user.role.authority != 'owner':
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, 
                       detail="Only owner is allowed to login")
```

### Giải thích từng bước:

#### **Bước 1: `user.role`**
```python
user.role  # → Trả về object Role (nếu có)
```
- SQLAlchemy thực hiện JOIN:
  ```sql
  SELECT roles.* 
  FROM roles 
  WHERE roles.id = user.role_id
  ```
- Kết quả: Object `Role` với các thuộc tính `id`, `authority`

#### **Bước 2: `user.role.authority`**
```python
user.role.authority  # → Trả về string: "owner", "tenant", etc.
```
- Lấy giá trị cột `authority` từ bảng `roles`
- Ví dụ: `"owner"`, `"tenant"`, `"admin"`

#### **Bước 3: So sánh**
```python
user.role.authority != 'owner'  # → True/False
```
- Kiểm tra xem authority có = `'owner'` không
- Nếu khác `'owner'` → User không được phép đăng nhập

---

## 🔍 DỮ LIỆU MẪU TRONG DATABASE

Xem file `init_db.py` (dòng 18):
```python
# Tạo role owner
owner_role = user.Role(authority="owner")
db.add(owner_role)
db.commit()

# Tạo user owner
owner_user = user.User(
    fullname="House Owner",
    phone="0987654321",
    email="owner@example.com",
    password=get_password_hash("owner123"),
    role_id=owner_role.id  # ← Liên kết với role
)
```

Sau khi chạy `init_db.py`, database sẽ có:

**Bảng `roles`:**
| id | authority |
|----|-----------|
| 1  | owner     |

**Bảng `users`:**
| owner_id | fullname     | email              | role_id |
|----------|--------------|-------------------|---------|
| 1        | House Owner  | owner@example.com | 1       |

Khi login với `owner@example.com`:
```python
user.role.authority  # → "owner" ✅ Được phép đăng nhập
```

---

## ⚙️ TẠI SAO CẦN `db.refresh(user, ['role'])`?

### Dòng 26 trong `auth.py`:
```python
if not hasattr(user, 'role') or user.role is None:
    db.refresh(user, ['role'])
```

### Lý do:
SQLAlchemy sử dụng **Lazy Loading** (tải lười):
- Khi query `User`, mặc định KHÔNG tự động load `role` relationship
- Chỉ khi bạn truy cập `user.role` lần đầu → mới thực hiện JOIN query
- Trong một số trường hợp, session có thể đã đóng → cần `refresh()` để reload

### Giải pháp:
```python
db.refresh(user, ['role'])  # Force reload relationship 'role' từ database
```

---

## 📝 TÓM TẮT LUỒNG DỮ LIỆU

```
1. User đăng nhập → email + password
                    ↓
2. authenticate_user() → Query từ bảng users
                    ↓
3. Lấy object User → user.role_id = 1
                    ↓
4. SQLAlchemy JOIN → SELECT * FROM roles WHERE id = 1
                    ↓
5. Trả về Role object → role.authority = "owner"
                    ↓
6. Kiểm tra → user.role.authority == "owner" ✅
                    ↓
7. Cho phép đăng nhập → Tạo JWT token
```

---

## 🎓 KẾT LUẬN

### `user.role.authority` lấy từ:
1. **Bảng `roles`** trong database
2. **Cột `authority`** (kiểu String)
3. Thông qua **relationship SQLAlchemy** giữa `User` và `Role`
4. JOIN tự động qua `role_id` (Foreign Key)

### Giá trị có thể có:
- `"owner"` - Chủ nhà (được phép login web)
- `"tenant"` - Người thuê
- `"admin"` - Quản trị viên
- ...các role khác nếu được thêm vào database

### Mục đích trong code:
**Chỉ cho phép user có `role.authority = "owner"` đăng nhập vào hệ thống web quản lý nhà trọ.**

---

## 📌 XEM THÊM

- Model User: `backend/app/models/user.py`
- Schema User: `backend/app/schemas/user.py`
- CRUD User: `backend/app/crud/user.py`
- Auth API: `backend/app/api/v2/auth.py`
- Init DB: `backend/init_db.py`

