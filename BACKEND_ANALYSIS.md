# PHÂN TÍCH CHI TIẾT BACKEND - HỆ THỐNG QUẢN LÝ NHÀ TRỌ

## 📋 TỔNG QUAN KIẾN TRÚC

Backend được xây dựng theo kiến trúc **3-layer** (ba lớp) với FastAPI:
- **API Layer** (Controller): Xử lý HTTP requests/responses
- **Business Logic Layer** (CRUD): Xử lý logic nghiệp vụ
- **Data Access Layer** (Models): Tương tác với database

### Tech Stack:
- **Framework**: FastAPI (Python web framework hiện đại, nhanh)
- **ORM**: SQLAlchemy (Object-Relational Mapping)
- **Database**: MySQL (Relational Database)
- **Authentication**: JWT (JSON Web Tokens) với OAuth2
- **AI**: Google Gemini API (tạo báo cáo thông minh)

---

## 📁 CẤU TRÚC THỨ BẬC VÀ CHỨC NĂNG

### 1️⃣ **ROOT LEVEL - Điểm khởi đầu**

```
backend/
├── main.py                    # Entry point - Chạy server
├── requirements.txt           # Dependencies/thư viện cần cài
├── database_setup.sql         # SQL triggers cho business rules
└── init_db.py                # Script khởi tạo DB với dữ liệu mẫu
```

#### 📄 **main.py** (Backend Root)
```python
# Chức năng: Khởi chạy server Uvicorn
- Thiết lập biến môi trường PYTHONDONTWRITEBYTECODE=1 (không tạo __pycache__)
- Thêm backend vào Python path
- Chạy app FastAPI từ app/main.py
- Cấu hình: host=127.0.0.1, port=8000, reload=True (auto-reload khi code thay đổi)
```

#### 📄 **requirements.txt**
```
Các thư viện chính:
- fastapi: Web framework
- uvicorn: ASGI server
- sqlalchemy: ORM để làm việc với database
- pymysql + cryptography: MySQL driver
- python-jose: JWT authentication
- passlib[bcrypt]: Hash password
- google-generativeai: Gemini AI
- pydantic: Data validation
```

#### 📄 **database_setup.sql**
```sql
Chứa 6 TRIGGERS tự động:
1. tr_after_insert_rented_room: Khi tạo hợp đồng → set is_available=FALSE
2. tr_after_update_rented_room: Khi kết thúc hợp đồng → set is_available=TRUE
3. tr_after_update_invoice_paid: Khi đánh dấu thanh toán → tự động ghi payment_date
4. tr_after_insert_rented_room_invoice: Tự động tạo hóa đơn tiền cọc cho hợp đồng mới
5. tr_before_insert_room: Validate dữ liệu phòng (capacity > 0, price >= 0)
6. tr_before_insert_rented_room: Validate hợp đồng thuê
```

#### 📄 **init_db.py**
```python
# Script khởi tạo database với dữ liệu mẫu:
- Tạo role "owner"
- Tạo user owner mẫu (email: owner@example.com, pass: owner123)
- Tạo nhà trọ mẫu "Nhà trọ ABC"
- Tạo 4 phòng mẫu (P101, P102, P201, P202)
```

---

### 2️⃣ **APP FOLDER - Core Application**

```
app/
├── __init__.py                # Biến thư mục thành Python package
├── main.py                    # FastAPI app instance
├── api/                       # API endpoints (Controllers)
│   └── __init__.py           # Package marker
├── core/                      # Config, Database, Security
│   └── __init__.py           # Package marker
├── crud/                      # Business logic (Create, Read, Update, Delete)
│   └── __init__.py           # Package marker
├── models/                    # Database models (ORM)
│   └── __init__.py           # Package marker
├── schemas/                   # Pydantic schemas (Validation & Serialization)
│   └── __init__.py           # Package marker
└── services/                  # External services (AI)
    └── __init__.py           # Package marker
```

#### 🔍 **Vai trò của file `__init__.py`**

**File `__init__.py` tuy trống nhưng CỰC KỲ QUAN TRỌNG trong Python!**

**1. Biến thư mục thành Python Package:**
```python
# Không có __init__.py:
❌ from app.models import user     # ImportError!
❌ from app.crud import house      # ImportError!

# Có __init__.py (dù trống):
✅ from app.models import user     # Works!
✅ from app.crud.house import create_house  # Works!
✅ from app.core.security import get_current_user  # Works!
```

**2. Cho phép import tương đối (Relative imports):**
```python
# Trong file app/api/v2/houses.py:
from ...crud import house          # Lùi 3 cấp từ v2/ → api/ → app/
from ...models.house import House  # Truy cập models/
from ...core.database import get_db # Truy cập core/

# Chỉ hoạt động khi tất cả thư mục có __init__.py!
```

**3. Namespace organization:**
```python
# File app/models/__init__.py có thể chứa:
from .user import User, Role
from .house import House
from .room import Room
from .invoice import Invoice

# Sau đó có thể import ngắn gọn:
from app.models import User, House, Room
# Thay vì:
from app.models.user import User
from app.models.house import House
from app.models.room import Room
```

**4. Trong dự án này - Tại sao để trống?**

Các file `__init__.py` trong dự án **CỐ TÌNH ĐỂ TRỐNG** vì:

✅ **Đơn giản hóa:** Không cần export phức tạp, import trực tiếp từng module  
✅ **Tường minh:** `from app.models.user import User` rõ ràng hơn `from app.models import User`  
✅ **Tránh circular imports:** Không gom tất cả vào `__init__.py` → giảm risk import lẫn nhau  
✅ **Convention:** FastAPI projects thường dùng explicit imports

**5. Ví dụ trong dự án:**

```python
# File: app/api/v2/houses.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ...crud import house as crud_house          # ← Cần __init__.py từ api/ đến crud/
from ...schemas.house import House, HouseCreate  # ← Cần __init__.py từ api/ đến schemas/
from ...core.database import get_db              # ← Cần __init__.py từ api/ đến core/
from ...core.security import get_current_user    # ← Cần __init__.py
```

**Python giải quyết import như thế nào?**
```
app/api/v2/houses.py muốn import từ app/crud/house.py:

1. Python check: app/ có __init__.py? ✅
2. Python check: app/api/ có __init__.py? ✅
3. Python check: app/api/v2/ có __init__.py? ✅
4. Python check: app/crud/ có __init__.py? ✅
5. → Import thành công!

Nếu thiếu 1 file __init__.py → ImportError!
```

**6. Thử nghiệm (KHÔNG NÊN LÀM):**

```bash
# Xóa app/models/__init__.py
rm app/models/__init__.py

# Chạy server
python main.py

# Kết quả:
ImportError: cannot import name 'User' from 'app.models'
ModuleNotFoundError: No module named 'app.models'
```

**7. Python 3.3+ và Namespace Packages:**

Từ Python 3.3+, có **implicit namespace packages** (PEP 420):
- Thư mục không có `__init__.py` vẫn có thể import
- NHƯNG: Không hỗ trợ relative imports
- Best practice: Vẫn nên dùng `__init__.py` cho clarity

**KẾT LUẬN:**
```
__init__.py = "Biển báo giao thông" cho Python
→ Báo hiệu: "Đây là package, có thể import được!"
→ Dù trống, nhưng thiếu nó = toàn bộ import system sụp đổ!
```

#### 📄 **app/main.py**
```python
# Trái tim của application:
1. Tạo FastAPI instance với title="Room Management API"
2. Cấu hình CORS middleware (cho phép frontend gọi API)
3. Tạo tất cả bảng database: Base.metadata.create_all()
4. Import tất cả models để SQLAlchemy biết structure
5. Include API router với prefix="/api/v2"
6. Endpoint root "/" trả về thông báo API đang chạy
```

**Flow hoạt động:**
```
Client Request → CORS Middleware → API Router → Endpoint Handler
                                                      ↓
                                        CRUD Layer (Business Logic)
                                                      ↓
                                        Models Layer (Database)
```

---

### 3️⃣ **CORE FOLDER - Cấu hình nền tảng**

```
core/
├── config.py          # Cấu hình toàn cục
├── database.py        # Kết nối database
└── security.py        # Authentication & Authorization
```

#### 📄 **core/config.py**
```python
class Settings:
    database_url: MySQL connection string
      → mysql+pymysql://Jellalaz:password@127.0.0.1:3306/room_management_db
    
    secret_key: Key mã hóa JWT (HS256)
    access_token_expire_minutes: 30 (token sống 30 phút)
    gemini_api_key: API key cho Gemini AI
```

#### 📄 **core/database.py**
```python
# Thiết lập SQLAlchemy:
1. engine: Kết nối đến MySQL database
2. SessionLocal: Factory tạo DB session
3. Base: Declarative base cho tất cả models
4. get_db(): Dependency injection - cung cấp DB session cho endpoints
   → Tự động đóng session sau khi xử lý request
```

#### 📄 **core/security.py**
```python
# Bảo mật & Xác thực:

1. Password Hashing:
   - pwd_context: Bcrypt hashing (an toàn, không thể reverse)
   - get_password_hash(): Hash password khi đăng ký
   - verify_password(): So sánh password khi login

2. JWT Token:
   - create_access_token(): Tạo JWT token chứa {sub: email, oid: owner_id}
   - Token có thời gian hết hạn (exp claim)

3. Authentication:
   - oauth2_scheme: Lấy token từ header "Authorization: Bearer <token>"
   - authenticate_user(): Kiểm tra email + password
   - get_current_user(): Decode JWT, lấy user từ DB
   - get_current_active_user(): Đảm bảo user.is_active=True

4. Authorization:
   - require_role(role): Decorator kiểm tra quyền theo role
   - VD: require_role("owner") → chỉ owner mới truy cập
```

**Flow Authentication:**
```
1. Login: POST /api/v2/auth/login
   → authenticate_user(email, password)
   → create_access_token({sub: email, oid: owner_id})
   → Return: {access_token, token_type: "bearer"}

2. Protected Endpoint:
   Request Header: Authorization: Bearer <token>
   → oauth2_scheme extracts token
   → get_current_user() decodes JWT
   → Verify user exists in DB
   → Inject current_user into endpoint
```

---

### 4️⃣ **MODELS FOLDER - Database Schema**

```
models/
├── user.py            # Users & Roles
├── house.py           # Houses (Nhà trọ)
├── room.py            # Rooms (Phòng)
├── asset.py           # Assets (Tài sản trong phòng)
├── rented_room.py     # Rental Contracts (Hợp đồng thuê)
└── invoice.py         # Invoices (Hóa đơn)
```

#### **Database Relationships (Mối quan hệ):**

```
User (owner) ──1:N──> House ──1:N──> Room ──1:N──> Asset
                                       │
                                     1:N
                                       │
                                  RentedRoom ──1:N──> Invoice
```

#### 📄 **models/user.py**
```python
# 2 Tables:

1. Role (Vai trò):
   - id (PK)
   - authority: "owner", "tenant", "admin"
   - Relationship: users (1:N)

2. User (Người dùng):
   - owner_id (PK)
   - fullname, phone, email (unique)
   - password (hashed)
   - role_id (FK → roles.id)
   - is_active, created_at, updated_at
   - Relationships:
     * role (N:1)
     * houses (1:N)
```

#### 📄 **models/house.py**
```python
# House (Nhà trọ):
- house_id (PK)
- name, floor_count
- ward, district, address_line (địa chỉ)
- owner_id (FK → users.owner_id)
- Relationships:
  * owner (N:1)
  * rooms (1:N, cascade delete) → Xóa nhà = xóa tất cả phòng
```

#### 📄 **models/room.py**
```python
# Room (Phòng):
- room_id (PK)
- name, capacity, description
- price (giá thuê)
- house_id (FK → houses.house_id)
- is_available (TRUE = còn trống, FALSE = đã cho thuê)
- Relationships:
  * house (N:1)
  * assets (1:N, cascade delete)
  * rented_rooms (1:N, cascade delete)
```

#### 📄 **models/asset.py**
```python
# Asset (Tài sản):
- asset_id (PK)
- name (tên tài sản: giường, tủ, điều hòa...)
- image_url (ảnh tài sản)
- room_id (FK → rooms.room_id)
- Relationship: room (N:1)
```

#### 📄 **models/rented_room.py**
```python
# RentedRoom (Hợp đồng thuê):
- rr_id (PK)
- tenant_name, tenant_phone (thông tin người thuê)
- number_of_tenants (số người ở)
- contract_url (link file hợp đồng)
- start_date, end_date (thời hạn)
- deposit (tiền cọc)
- monthly_rent (tiền thuê tháng)
- initial_electricity_num (số điện ban đầu)
- electricity_unit_price (đơn giá điện: 3500đ/kWh)
- water_price, internet_price, general_price (giá dịch vụ)
- room_id (FK → rooms.room_id)
- is_active (TRUE = đang thuê, FALSE = đã kết thúc)
- Relationships:
  * room (N:1)
  * invoices (1:N, cascade delete)
```

#### 📄 **models/invoice.py**
```python
# Invoice (Hóa đơn):
- invoice_id (PK)
- price (tiền phòng)
- water_price, internet_price, general_price (các khoản phí)
- electricity_price (tiền điện = số kWh × đơn giá)
- electricity_num, water_num (số điện, nước)
- due_date (ngày đến hạn)
- payment_date (ngày thanh toán thực tế)
- is_paid (TRUE = đã trả, FALSE = chưa trả)
- rr_id (FK → rented_rooms.rr_id)
- Relationship: rented_room (N:1)
```

**Cascade Delete Strategy:**
```
Delete House → Delete all Rooms → Delete all Assets + RentedRooms → Delete all Invoices
```

---

### 5️⃣ **SCHEMAS FOLDER - Data Validation**

```
schemas/
├── user.py            # UserCreate, UserUpdate, User, Token...
├── house.py           # HouseCreate, HouseUpdate, House...
├── room.py            # RoomCreate, RoomUpdate, Room...
├── asset.py           # AssetCreate, Asset...
├── rented_room.py     # RentedRoomCreate, RentedRoomUpdate...
└── invoice.py         # InvoiceCreate, InvoiceUpdate, InvoiceWithDetails...
```

**Pydantic Schemas đóng 3 vai trò:**
1. **Input Validation** (Request): Validate dữ liệu từ client
2. **Output Serialization** (Response): Format dữ liệu trả về JSON
3. **Documentation**: Tự động tạo OpenAPI docs (Swagger UI)

#### 📄 **schemas/user.py** (Ví dụ chi tiết)
```python
# Pattern: Base → Create/Update → Response

1. UserBase:
   - fullname, phone, email (fields chung)

2. UserCreate (extends UserBase):
   - password (thêm field cho registration)
   - Validators:
     * fullname: ≥3 ký tự
     * phone: 10-11 chữ số
     * password: ≥8 ký tự, phải có: chữ hoa, chữ thường, số, ký tự đặc biệt

3. UserUpdate:
   - All fields Optional (cho phép update từng field)
   - Validators tương tự nhưng skip nếu None

4. User (Response model):
   - Extends UserBase
   - Thêm: owner_id, is_active, created_at, updated_at, role
   - from_attributes=True: Convert SQLAlchemy model → Pydantic

5. Token, TokenData: Schemas cho JWT
```

**Validation Flow:**
```
Client sends JSON → Pydantic validates → Pass to endpoint → Return Pydantic model → Auto serialize to JSON
```

---

### 6️⃣ **CRUD FOLDER - Business Logic**

```
crud/
├── user.py            # User operations
├── house.py           # House operations
├── room.py            # Room operations
├── asset.py           # Asset operations
├── rented_room.py     # Rental operations
└── invoice.py         # Invoice operations
```

**CRUD = Create, Read, Update, Delete** (4 thao tác cơ bản)

#### 📄 **crud/user.py** (Ví dụ)
```python
# Functions:

1. create_user(db, user: UserCreate):
   - Hash password
   - Tìm/tạo role "owner"
   - Tạo User record
   - Return user (with relationships loaded)

2. get_user_by_id(db, user_id):
   - Query by owner_id
   
3. get_user_by_email(db, email):
   - Query by email (unique)
   
4. get_user_by_phone(db, phone):
   - Query by phone (unique)

5. update_user(db, user_id, user_update):
   - Lấy user
   - Update chỉ các fields được set
   - Commit & refresh

6. delete_user(db, user_id):
   - Query → delete → commit
```

#### 📄 **crud/invoice.py** (Advanced)
```python
# Đặc biệt: Có filtering & authorization

1. create_invoice(db, invoice, owner_id):
   - Verify rented_room thuộc owner (qua JOIN)
   - Tạo invoice

2. get_invoice_by_id(db, invoice_id, owner_id):
   - joinedload: Eager loading relationships (tránh N+1 queries)
   - Filter theo owner_id (security)

3. get_invoices(..., month, house_id, room_id, is_paid):
   - Dynamic filtering
   - Hỗ trợ filter theo tháng (due_date trong khoảng)

4. mark_invoice_paid(db, invoice_id, owner_id):
   - Set is_paid=TRUE
   - Set payment_date nếu chưa có
```

**Authorization Pattern:**
```python
# Tất cả CRUD functions đều check ownership qua JOIN:
db.query(Entity)
  .join(ParentEntity)
  .join(House)
  .filter(House.owner_id == owner_id)
  
→ Đảm bảo user chỉ thao tác trên dữ liệu của mình
```

---

### 7️⃣ **API FOLDER - HTTP Endpoints**

```
api/
├── __init__.py
└── v2/
    ├── api.py              # Router aggregator
    ├── auth.py             # Login, Register
    ├── users.py            # User management
    ├── houses.py           # House CRUD
    ├── rooms.py            # Room CRUD
    ├── assets.py           # Asset CRUD
    ├── rented_rooms.py     # Rental management
    ├── invoices.py         # Invoice management
    ├── ai.py               # AI report generation
    └── reports.py          # Statistics & reports
```

#### 📄 **api/v2/api.py** (Router Aggregator)
```python
# Gom tất cả routers vào 1 chỗ:
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
# ... tương tự cho các module khác

→ Endpoint URLs:
  /api/v2/auth/*
  /api/v2/users/*
  /api/v2/houses/*
  ...
```

#### 📄 **api/v2/auth.py**
```python
# 2 Endpoints:

1. POST /api/v2/auth/login
   Input: {email, password}
   Process:
   - authenticate_user()
   - Verify role = "owner" (chỉ owner được login)
   - create_access_token()
   Output: {access_token, token_type: "bearer"}

2. POST /api/v2/auth/register
   Input: UserCreate {fullname, phone, email, password}
   Process:
   - Check email/phone đã tồn tại
   - create_user() (tự động hash password + assign role owner)
   Output: User object
   Errors: 400 if duplicate email/phone
```

#### 📄 **api/v2/houses.py**
```python
# 5 Endpoints (CRUD + List):

1. POST / - create_house
   - Tạo nhà trọ mới cho current_user
   
2. GET / - read_houses
   - Lấy danh sách nhà trọ của current_user
   - Pagination: skip, limit
   
3. GET /{house_id} - read_house
   - Lấy chi tiết 1 nhà trọ
   - Verify ownership
   
4. PUT /{house_id} - update_house
   - Cập nhật thông tin nhà trọ
   - Verify ownership
   
5. DELETE /{house_id} - delete_house
   - Business rule: Không được xóa nếu có phòng đang cho thuê
   - Check: Room.is_available=FALSE hoặc RentedRoom.is_active=TRUE
   - Error 400: "Nhà trọ đang có phòng cho thuê, không được xóa!"
```

#### 📄 **api/v2/rooms.py**
```python
# 7 Endpoints:

1. POST / - create_room
2. GET / - read_rooms (all rooms của owner)
3. GET /house/{house_id} - read_rooms_by_house
4. GET /available - read_available_rooms (is_available=TRUE)
5. GET /{room_id} - read_room
6. PUT /{room_id} - update_room
7. DELETE /{room_id} - delete_room
   - Business rule: Không xóa nếu đang có người thuê
   - Check: is_available=FALSE hoặc có RentedRoom active
```

#### 📄 **api/v2/rented_rooms.py**
```python
# 6 Endpoints:

1. POST / - create_rented_room
   - Tạo hợp đồng thuê mới
   - Trigger tự động: set room.is_available=FALSE + tạo invoice tiền cọc
   
2. GET / - read_rented_rooms (active contracts)
3. GET /room/{room_id} - read_rented_rooms_by_room (lịch sử thuê)
4. GET /{rr_id} - read_rented_room
5. PUT /{rr_id} - update_rented_room
6. POST /{rr_id}/terminate - terminate_rental
   - Kết thúc hợp đồng: set is_active=FALSE
   - Trigger tự động: set room.is_available=TRUE
```

#### 📄 **api/v2/invoices.py**
```python
# 8 Endpoints:

1. POST / - create_invoice
   - Tạo hóa đơn cho hợp đồng
   
2. GET / - read_invoices
   - Filtering: month, house_id, room_id, is_paid
   - Example: ?month=2024-10&is_paid=false
   
3. GET /rented-room/{rr_id} - Invoices of 1 contract
4. GET /pending - Unpaid invoices (is_paid=FALSE)
5. GET /{invoice_id} - Invoice detail
6. PUT /{invoice_id} - update_invoice
7. POST /{invoice_id}/pay - mark_invoice_paid
   - Set is_paid=TRUE, payment_date=NOW
   
8. DELETE /{invoice_id} - delete_invoice
```

#### 📄 **api/v2/reports.py**
```python
# Thống kê & Báo cáo (dùng raw SQL):

1. POST /revenue-stats
   Input: {start_date, end_date}
   Output:
   - total_revenue (tổng doanh thu đã thu)
   - paid_invoices, pending_invoices (số lượng)
   - avg_monthly_revenue (TB tháng)
   Queries:
   - SUM(price + water + internet + general + electricity) WHERE is_paid=TRUE
   - GROUP BY month, AVG()

2. POST /generate-report
   Types: 'revenue', 'occupancy', 'tenant'
   - revenue: Doanh thu theo tháng (group by month)
   - occupancy: Tỷ lệ lấp đầy (TODO)
   - tenant: Thông tin người thuê (TODO)
```

#### 📄 **api/v2/ai.py**
```python
# AI-powered Report Generation:

POST /generate-revenue-report
Input: {start_date, end_date}
Process:
- Gọi ai_service.generate_revenue_report()
- Truyền owner_id để filter data
Output:
- report: Markdown text phân tích doanh thu
- period, timestamp
```

---

### 8️⃣ **SERVICES FOLDER - External Services**

```
services/
└── ai_service.py      # Gemini AI integration
```

#### 📄 **services/ai_service.py**
```python
class AIService:
    def __init__(self):
        - Configure Gemini API với settings.gemini_api_key
        - Model: gemini-2.5-pro

    def generate_revenue_report(start_date, end_date, owner_id):
        # Step 1: Truy vấn SQL lấy metrics
        - total_revenue (SUM invoices đã thanh toán)
        - paid_invoices, pending_invoices (COUNT)
        - avg_monthly_revenue (AVG grouped by month)
        - payment_rate = paid / total * 100%
        
        # Step 2: Tạo prompt cho AI
        Prompt structure:
        """
        ## PHÂN TÍCH DOANH THU
        - Kỳ báo cáo: {start_date} - {end_date}
        
        ## CHỈ SỐ CHÍNH
        - Tổng doanh thu: {total_revenue} VNĐ
        - Tỷ lệ thanh toán: {payment_rate}%
        - Số lượng hóa đơn: {total_invoices}
        
        ## ĐIỂM MẠNH
        - [AI tự điền dựa trên data]
        
        ## VẤN ĐỀ CẦN LƯU Ý
        - [AI tự điền]
        
        ## KHUYẾN NGHỊ
        - [AI tự đưa ra 3-4 gợi ý cụ thể]
        """
        
        # Step 3: Gọi Gemini API
        response = model.generate_content(prompt)
        
        # Step 4: Sanitize Markdown
        - Loại bỏ emoji, code fences
        - Chuẩn hóa bullet points
        
        Return: Clean Markdown report

    def _sanitize_markdown(content):
        - Regex cleanup: bỏ emoji, chuẩn hóa bullets thành "-"
        - Loại bỏ nhiều dòng trống thừa
```

**AI Integration Flow:**
```
Client request → API endpoint → ai_service
                                     ↓
                        Query DB metrics (SQL)
                                     ↓
                        Build prompt with data
                                     ↓
                        Call Gemini API
                                     ↓
                        Sanitize response
                                     ↓
                        Return Markdown report → Client
```

---

## 🔗 SƠ ĐỒ LIÊN KẾT TỔNG THỂ

### **Request Flow (Luồng xử lý 1 API call):**

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CLIENT (Frontend/Postman)                                   │
│     POST /api/v2/houses                                         │
│     Headers: Authorization: Bearer <JWT_TOKEN>                  │
│     Body: {name, floor_count, ward, district, address_line}    │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. FASTAPI APP (app/main.py)                                   │
│     - CORS Middleware: Check origin                             │
│     - Router matching: /api/v2/* → api_router                   │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. API ENDPOINT (api/v2/houses.py)                             │
│     @router.post("/")                                           │
│     def create_house(                                           │
│         house: HouseCreate,              ← Pydantic validation  │
│         current_user = Depends(...),     ← Inject authenticated │
│         db = Depends(get_db)             ← Inject DB session    │
│     )                                                            │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. SECURITY (core/security.py)                                 │
│     get_current_user():                                         │
│     - Extract token from header                                 │
│     - Decode JWT → get owner_id                                 │
│     - Query User from DB                                        │
│     - Return current_user object                                │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. CRUD LAYER (crud/house.py)                                  │
│     create_house(db, house, owner_id):                          │
│     - Create House instance from HouseCreate schema             │
│     - Set house.owner_id = owner_id                             │
│     - db.add(house)                                             │
│     - db.commit()                                               │
│     - db.refresh(house)                                         │
│     - Return house                                              │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│  6. DATABASE LAYER (models/house.py + MySQL)                    │
│     - SQLAlchemy generates INSERT statement                     │
│     - Execute on MySQL                                          │
│     - Triggers fire (if any)                                    │
│     - Return new house_id                                       │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│  7. RESPONSE (Back to Client)                                   │
│     - Convert SQLAlchemy House → Pydantic House schema          │
│     - Serialize to JSON                                         │
│     - Return HTTP 200 with house data                           │
└─────────────────────────────────────────────────────────────────┘
```

### **Authentication Flow:**

```
┌──────────────┐
│ 1. Register  │
└──────┬───────┘
       ↓
  POST /auth/register
  {fullname, phone, email, password}
       ↓
  Pydantic validates (8+ chars, uppercase, number, special char...)
       ↓
  crud.create_user():
    - Hash password (bcrypt)
    - Create User with role="owner"
       ↓
  Return User object

┌──────────────┐
│ 2. Login     │
└──────┬───────┘
       ↓
  POST /auth/login
  {email, password}
       ↓
  authenticate_user():
    - Query user by email
    - verify_password(plain, hashed)
    - Check role == "owner"
       ↓
  create_access_token():
    - Payload: {sub: email, oid: owner_id, exp: 30min}
    - Sign with HS256 + secret_key
       ↓
  Return {access_token, token_type: "bearer"}

┌──────────────┐
│ 3. Use Token │
└──────┬───────┘
       ↓
  GET /houses
  Header: Authorization: Bearer eyJhbGc...
       ↓
  oauth2_scheme extracts token
       ↓
  get_current_user():
    - jwt.decode(token, secret_key, algorithms=["HS256"])
    - Extract oid from payload
    - Query User by owner_id
       ↓
  Inject current_user into endpoint
       ↓
  Endpoint accesses current_user.owner_id
```

### **Database Relationships (Chi tiết):**

```
┌──────────────────────────────────────────────────────────────────┐
│                         USERS (owner)                             │
│  owner_id (PK), fullname, email, phone, password, role_id        │
└────────────┬─────────────────────────────────────────────────────┘
             │ 1:N (owner → houses)
             ↓
┌──────────────────────────────────────────────────────────────────┐
│                          HOUSES                                   │
│  house_id (PK), name, floor_count, address_line, owner_id (FK)   │
└────────────┬─────────────────────────────────────────────────────┘
             │ 1:N (house → rooms)
             ↓
┌──────────────────────────────────────────────────────────────────┐
│                           ROOMS                                   │
│  room_id (PK), name, capacity, price, is_available, house_id(FK) │
└──────┬──────────────────────────┬────────────────────────────────┘
       │ 1:N                      │ 1:N
       │ (room → assets)          │ (room → rented_rooms)
       ↓                          ↓
┌─────────────────┐      ┌─────────────────────────────────────────┐
│     ASSETS      │      │          RENTED_ROOMS                    │
│  asset_id (PK)  │      │  rr_id (PK), tenant_name, start_date,   │
│  name           │      │  monthly_rent, deposit, is_active,      │
│  image_url      │      │  room_id (FK)                           │
│  room_id (FK)   │      └───────────────┬─────────────────────────┘
└─────────────────┘                      │ 1:N
                                         │ (rented_room → invoices)
                                         ↓
                               ┌──────────────────────────────────┐
                               │          INVOICES                 │
                               │  invoice_id (PK), price,         │
                               │  water_price, electricity_price, │
                               │  due_date, is_paid, rr_id (FK)   │
                               └──────────────────────────────────┘
```

### **Business Rules Enforced by Triggers:**

```
Event: INSERT rented_room
  → Trigger: tr_after_insert_rented_room
    → UPDATE rooms SET is_available=FALSE WHERE room_id=NEW.room_id
  
  → Trigger: tr_after_insert_rented_room_invoice
    → INSERT INTO invoices (tiền cọc, due_date = start_date + 30 days)

Event: UPDATE rented_room SET is_active=FALSE
  → Trigger: tr_after_update_rented_room
    → UPDATE rooms SET is_available=TRUE WHERE room_id=NEW.room_id

Event: UPDATE invoice SET is_paid=TRUE
  → Trigger: tr_after_update_invoice_paid
    → UPDATE invoices SET payment_date=NOW() WHERE invoice_id=NEW.invoice_id
```

---

## 🎯 CÁC TÍNH NĂNG CHÍNH

### 1. **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (owner role)
- Password strength validation
- Token expiration (30 minutes)

### 2. **Multi-tenancy**
- Mỗi owner chỉ thấy & thao tác dữ liệu của mình
- Tất cả CRUD đều filter theo owner_id
- JOIN qua House table để verify ownership

### 3. **Business Rules**
- Không xóa house nếu có phòng đang cho thuê
- Không xóa room nếu đang có người thuê
- Tự động cập nhật trạng thái phòng (triggers)
- Tự động tạo invoice tiền cọc (trigger)

### 4. **Data Validation**
- Pydantic schemas cho tất cả inputs
- Validators tùy chỉnh (phone format, password strength...)
- Database constraints (unique, foreign keys...)

### 5. **Reporting & Analytics**
- Thống kê doanh thu (SQL aggregations)
- Filter invoices theo nhiều tiêu chí
- AI-generated reports (Gemini)

### 6. **API Design**
- RESTful conventions
- Versioning (/api/v2/*)
- Consistent error handling
- Pagination (skip, limit)
- OpenAPI/Swagger documentation

---

## 🔒 BẢO MẬT

### 1. **Password Security**
```python
- Bcrypt hashing (cost factor: auto)
- Never store plain passwords
- Hash trong create_user(), không bao giờ ở endpoint
```

### 2. **JWT Security**
```python
- HS256 algorithm
- Secret key từ config (không hardcode)
- Expiration time (30 phút)
- Payload minimal: {sub, oid, exp}
```

### 3. **Authorization**
```python
- Mọi endpoint protected đều require current_user
- Verify ownership qua JOIN trong CRUD layer:
  .join(House).filter(House.owner_id == owner_id)
- Không cho phép cross-owner data access
```

### 4. **Input Validation**
```python
- Pydantic validates all inputs
- SQL injection prevention (SQLAlchemy ORM)
- CORS configured (can restrict origins in production)
```

---

## 📊 PERFORMANCE CONSIDERATIONS

### 1. **N+1 Query Problem**
```python
# Giải pháp: Eager loading
.options(joinedload(Invoice.rented_room).joinedload(RentedRoom.room))
→ 1 query thay vì N+1 queries
```

### 2. **Database Indexing**
```python
# Models có index=True trên:
- Primary keys (auto)
- Foreign keys
- Unique fields (email, phone)
```

### 3. **Pagination**
```python
# Tất cả list endpoints có:
skip: int = 0
limit: int = 100
→ Tránh load toàn bộ data
```

### 4. **Connection Pooling**
```python
# SQLAlchemy engine tự quản lý pool
SessionLocal: Reuse connections
get_db(): Proper session cleanup (finally: db.close())
```

---

## 🧪 TESTING (Recommendations)

### 1. **Unit Tests**
```python
# Test CRUD functions với mock DB:
- create_user() với valid/invalid data
- authenticate_user() với correct/wrong password
- Ownership verification logic
```

### 2. **Integration Tests**
```python
# Test API endpoints với TestClient:
- Register → Login → Create house → Create room → ...
- Test authorization (access other owner's data)
- Test business rules (delete rented room)
```

### 3. **Load Tests**
```python
# Sử dụng tools: Locust, JMeter
- Concurrent users
- Response times
- Database connection pool saturation
```

---

## 🚀 DEPLOYMENT CHECKLIST

### 1. **Environment Variables**
```bash
# Tách config ra .env file:
DATABASE_URL=mysql+pymysql://...
SECRET_KEY=<strong-random-key>
GEMINI_API_KEY=<your-key>
```

### 2. **Security**
```python
# Production settings:
- Change SECRET_KEY
- Restrict CORS origins (không dùng "*")
- Use HTTPS
- Rate limiting (slowapi)
```

### 3. **Database**
```sql
-- Migration tool: Alembic
-- Backup strategy
-- Index optimization
```

### 4. **Monitoring**
```python
# Logging:
import logging
logging.basicConfig(level=logging.INFO)

# Error tracking: Sentry
# Performance monitoring: New Relic, DataDog
```

---

## 📝 TÓM TẮT FLOW HOẠT ĐỘNG

### **Kịch bản: Tạo hợp đồng thuê mới**

```
1. User login:
   POST /api/v2/auth/login {email, password}
   → Nhận access_token

2. Xem danh sách phòng trống:
   GET /api/v2/rooms/available
   Header: Authorization: Bearer <token>
   → Trả về list rooms với is_available=TRUE

3. Tạo hợp đồng:
   POST /api/v2/rented-rooms
   Body: {
     tenant_name, tenant_phone, number_of_tenants,
     start_date, end_date, deposit, monthly_rent,
     room_id, ...
   }
   
   Backend xử lý:
   a) get_current_user() → verify token, lấy owner_id
   b) crud.create_rented_room():
      - Verify room thuộc owner (JOIN qua House)
      - Verify room.is_available = TRUE
      - INSERT INTO rented_rooms
   c) Trigger tr_after_insert_rented_room fires:
      - UPDATE rooms SET is_available=FALSE
   d) Trigger tr_after_insert_rented_room_invoice fires:
      - INSERT INTO invoices (tiền cọc)
   e) Return RentedRoom object

4. Kiểm tra invoice tiền cọc:
   GET /api/v2/invoices/rented-room/{rr_id}
   → Trả về invoice tự động tạo

5. Đánh dấu đã thanh toán:
   POST /api/v2/invoices/{invoice_id}/pay
   → Trigger tr_after_update_invoice_paid:
      UPDATE invoices SET payment_date=NOW()
```

---

## 🎓 KẾT LUẬN

Backend này được thiết kế theo **best practices**:

✅ **Separation of Concerns**: API → CRUD → Models tách biệt rõ ràng  
✅ **Security-first**: JWT, password hashing, ownership verification  
✅ **Scalable**: Pagination, eager loading, connection pooling  
✅ **Maintainable**: Clean code structure, type hints, Pydantic validation  
✅ **Documented**: OpenAPI/Swagger auto-generated  
✅ **Modern Stack**: FastAPI (async-ready), SQLAlchemy 2.0 style, Pydantic v2  

**Điểm mạnh:**
- Kiến trúc rõ ràng, dễ mở rộng
- Bảo mật tốt với JWT + role-based access
- Tự động hóa business rules qua triggers
- AI integration cho báo cáo thông minh

**Điểm cần cải thiện:**
- Thêm unit tests
- Implement rate limiting
- Add logging/monitoring
- Database migration với Alembic
- Async endpoints (FastAPI hỗ trợ async/await)
- Caching cho frequent queries

---

**Tác giả:** AI Analysis  
**Ngày:** October 26, 2025  
**Version:** Backend API v2.0.0

