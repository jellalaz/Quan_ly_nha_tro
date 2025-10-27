# HƯỚNG DẪN TEST POSTMAN - HỆ THỐNG QUẢN LÝ NHÀ TRỌ

## 📋 MỤC LỤC
1. [Chuẩn bị](#chuẩn-bị)
2. [Authentication (auth.py)](#1-authentication---authpy)
3. [User Management (users.py)](#2-user-management---userspy)
4. [AI Service (ai.py)](#3-ai-service---aipy)
5. [Reports (reports.py)](#4-reports---reportspy)
6. [Houses (houses.py)](#5-houses---housespy)
7. [Rooms (rooms.py)](#6-rooms---roomspy)
8. [Rented Rooms (rented_rooms.py)](#7-rented-rooms---rented_roomspy)
9. [Invoices (invoices.py)](#8-invoices---invoicespy)
10. [Assets (assets.py)](#9-assets---assetspy)
11. [Kiểm tra Frontend sử dụng API](#10-kiểm-tra-frontend-sử-dụng-api)

---

## 🔧 CHUẨN BỊ

### Base URL
```
http://localhost:8000/api/v2
```

### Lấy Access Token
**Bước 1**: Đăng nhập để lấy token
```
POST /auth/login
Body:
{
  "email": "owner@example.com",
  "password": "Password123!"
}

Response:
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer"
}
```

**Bước 2**: Sử dụng token cho các request khác
- Header: `Authorization: Bearer eyJhbGci...`

---

## 1. AUTHENTICATION - auth.py

### 1.1. Đăng ký tài khoản mới
```
POST /auth/register

Headers:
- Content-Type: application/json

Body:
{
  "fullname": "Nguyễn Văn A",
  "phone": "0123456789",
  "email": "nguyenvana@example.com",
  "password": "Password123!"
}

Response (200):
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

Lỗi thường gặp:
- 400: Email already registered (email đã tồn tại)
- 400: Phone already registered (số điện thoại đã tồn tại)
- 422: Validation error (mật khẩu yếu, phone không đúng format)
```

**Test Cases**:
- ✅ Đăng ký thành công với thông tin hợp lệ
- ❌ Đăng ký với email đã tồn tại
- ❌ Đăng ký với phone đã tồn tại
- ❌ Mật khẩu không đủ mạnh (thiếu chữ hoa, số, ký tự đặc biệt)
- ❌ Phone không đúng format (không phải 10-11 số)
- ❌ Họ tên dưới 3 ký tự

---

### 1.2. Đăng nhập
```
POST /auth/login

Headers:
- Content-Type: application/json

Body:
{
  "email": "nguyenvana@example.com",
  "password": "Password123!"
}

Response (200):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}

Lỗi thường gặp:
- 401: Incorrect email or password (sai email hoặc password)
- 403: Only owner is allowed to login (không phải role owner)
```

**Test Cases**:
- ✅ Đăng nhập thành công với thông tin đúng
- ❌ Sai email
- ❌ Sai password
- ❌ User không phải owner (nếu có role khác)

---

## 2. USER MANAGEMENT - users.py

### 2.1. Xem thông tin cá nhân
```
GET /users/me

Headers:
- Authorization: Bearer {access_token}

Response (200):
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

Lỗi thường gặp:
- 403: Không gửi token
- 401: Token không hợp lệ hoặc hết hạn
- 400: Inactive user (user bị vô hiệu hóa)
```

**Test Cases**:
- ✅ Lấy thông tin thành công với token hợp lệ
- ❌ Không gửi token
- ❌ Token không hợp lệ
- ❌ Token hết hạn

---

### 2.2. Cập nhật thông tin cá nhân
```
PATCH /users/me

Headers:
- Authorization: Bearer {access_token}
- Content-Type: application/json

Body (có thể gửi 1 hoặc nhiều field):
{
  "fullname": "Nguyễn Văn B",
  "phone": "0987654321",
  "email": "newemail@example.com"
}

Response (200):
{
  "owner_id": 1,
  "fullname": "Nguyễn Văn B",
  "phone": "0987654321",
  "email": "newemail@example.com",
  "is_active": true,
  "created_at": "2025-10-27T10:30:00Z",
  "updated_at": "2025-10-27T15:45:00Z",
  "role": {
    "id": 1,
    "authority": "owner"
  }
}

Lỗi thường gặp:
- 400: Email already registered (email mới đã có người dùng)
- 400: Phone already registered (phone mới đã có người dùng)
- 422: Validation error
```

**Test Cases**:
- ✅ Cập nhật chỉ fullname
- ✅ Cập nhật chỉ email
- ✅ Cập nhật chỉ phone
- ✅ Cập nhật cả 3 field
- ❌ Email mới bị trùng với user khác
- ❌ Phone mới bị trùng với user khác
- ❌ Phone không đúng format

---

### 2.3. Đổi mật khẩu
```
PATCH /users/me/password

Headers:
- Authorization: Bearer {access_token}
- Content-Type: application/json

Body:
{
  "old_password": "Password123!",
  "new_password": "NewPassword456@"
}

Response (200):
{
  "message": "Đổi mật khẩu thành công"
}

Lỗi thường gặp:
- 400: Mật khẩu hiện tại không đúng
- 422: Mật khẩu mới không đủ mạnh
```

**Test Cases**:
- ✅ Đổi mật khẩu thành công
- ❌ Sai mật khẩu cũ
- ❌ Mật khẩu mới quá yếu
- ❌ Không gửi token

---

### 2.4. Xem danh sách roles
```
GET /users/roles

Headers:
- KHÔNG CẦN Authorization (endpoint công khai)

Response (200):
[
  {
    "id": 1,
    "authority": "owner"
  },
  {
    "id": 2,
    "authority": "tenant"
  }
]
```

**Test Cases**:
- ✅ Lấy danh sách roles (không cần đăng nhập)

---

## 3. AI SERVICE - ai.py

### 3.1. Tạo báo cáo doanh thu bằng AI
```
POST /ai/generate-revenue-report

Headers:
- Authorization: Bearer {access_token}
- Content-Type: application/json

Body:
{
  "start_date": "2025-01-01",
  "end_date": "2025-01-31"
}

Response (200):
{
  "report": "## PHÂN TÍCH DOANH THU\n- **Kỳ báo cáo:** 2025-01-01 - 2025-01-31\n\n## CHỈ SỐ CHÍNH\n...",
  "period": "2025-01-01 đến 2025-01-31",
  "timestamp": "2025-10-27T16:00:00Z"
}

Lỗi thường gặp:
- 500: Lỗi AI service (không kết nối được Gemini API)
- 401: Không có token
```

**Cách hoạt động**:
1. Hệ thống query database lấy dữ liệu doanh thu của owner hiện tại
2. Gửi dữ liệu đến Gemini AI để phân tích
3. AI trả về báo cáo dạng Markdown với:
   - Chỉ số chính (tổng doanh thu, tỷ lệ thanh toán...)
   - Điểm mạnh
   - Vấn đề cần lưu ý
   - Khuyến nghị

**Test Cases**:
- ✅ Tạo báo cáo với khoảng thời gian hợp lệ
- ✅ Tạo báo cáo cho tháng hiện tại
- ❌ Không gửi token
- ❌ start_date > end_date

**Lưu ý**:
- Cần có `GEMINI_API_KEY` trong file `.env`
- Báo cáo chỉ tính doanh thu của owner đang đăng nhập

---

## 4. REPORTS - reports.py

### 4.1. Thống kê doanh thu
```
POST /reports/revenue-stats

Headers:
- Authorization: Bearer {access_token}
- Content-Type: application/json

Body:
{
  "start_date": "2025-01-01",
  "end_date": "2025-01-31"
}

Response (200):
{
  "total_revenue": 15000000.0,
  "paid_invoices": 10,
  "pending_invoices": 3,
  "avg_monthly_revenue": 5000000.0
}

Lỗi thường gặp:
- 500: Lỗi SQL
- 401: Không có token
```

**Chỉ số trả về**:
- `total_revenue`: Tổng doanh thu đã thanh toán trong khoảng thời gian
- `paid_invoices`: Số hóa đơn đã thanh toán
- `pending_invoices`: Số hóa đơn chưa thanh toán (theo due_date)
- `avg_monthly_revenue`: Doanh thu trung bình mỗi tháng

**Test Cases**:
- ✅ Lấy thống kê tháng hiện tại
- ✅ Lấy thống kê quý
- ✅ Lấy thống kê năm

---

### 4.2. Tạo báo cáo chi tiết
```
POST /reports/generate-report

Headers:
- Authorization: Bearer {access_token}
- Content-Type: application/json

Body:
{
  "report_type": "revenue",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31"
}

Response (200):
{
  "report_type": "revenue",
  "period": "2025-01-01 đến 2025-12-31",
  "data": [
    {
      "month": "2025-01",
      "total_invoices": 10,
      "room_revenue": 8000000,
      "water_revenue": 500000,
      "internet_revenue": 400000,
      "electricity_revenue": 600000,
      "service_revenue": 300000,
      "total_revenue": 9800000
    }
  ],
  "generated_at": "2025-10-27T16:00:00Z"
}
```

**Các loại báo cáo**:

#### A. Báo cáo doanh thu (`report_type: "revenue"`)
```json
{
  "report_type": "revenue",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31"
}
```
- Trả về doanh thu theo tháng
- Phân tích theo: tiền phòng, nước, điện, internet, dịch vụ

#### B. Báo cáo tỷ lệ lấp đầy (`report_type: "occupancy"`)
```json
{
  "report_type": "occupancy",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31"
}
```
Response:
```json
{
  "data": [
    {
      "house_name": "Nhà trọ A",
      "total_rooms": 10,
      "occupied_rooms": 8,
      "occupancy_rate": 80.0
    }
  ]
}
```

#### C. Báo cáo khách thuê (`report_type: "tenant"`)
```json
{
  "report_type": "tenant",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31"
}
```
Response:
```json
{
  "data": [
    {
      "tenant_name": "Nguyễn Văn B",
      "tenant_phone": "0987654321",
      "number_of_tenants": 2,
      "room_name": "Phòng 101",
      "house_name": "Nhà trọ A",
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "days_remaining": 90,
      "monthly_rent": 3000000
    }
  ]
}
```

**Test Cases**:
- ✅ Báo cáo doanh thu
- ✅ Báo cáo tỷ lệ lấp đầy
- ✅ Báo cáo khách thuê
- ❌ report_type không hợp lệ (400)

---

### 4.3. Tạo hóa đơn hàng tháng
```
POST /reports/create-monthly-invoices

Headers:
- Authorization: Bearer {access_token}

Response (200):
{
  "message": "Đã tạo hóa đơn hàng tháng thành công",
  "created_at": "2025-10-27T16:00:00Z"
}
```

**Chức năng**:
- Tự động tạo hóa đơn cho TẤT CẢ hợp đồng đang hoạt động
- Chỉ tạo cho các phòng thuộc owner hiện tại
- Giá trị mặc định:
  - `price`: Lấy từ `monthly_rent`
  - `water_price`: 100,000
  - `internet_price`: 200,000
  - `general_price`: 50,000
  - `electricity_price`: 150,000
  - `due_date`: 30 ngày từ hôm nay

**Test Cases**:
- ✅ Tạo hóa đơn thành công
- ❌ Không có hợp đồng nào đang hoạt động

---

### 4.4. Tổng quan hệ thống
```
GET /reports/system-overview

Headers:
- Authorization: Bearer {access_token}

Response (200):
{
  "total_houses": 5,
  "total_rooms": 50,
  "available_rooms": 10,
  "occupied_rooms": 40,
  "occupancy_rate": 80.0,
  "active_contracts": 38,
  "pending_invoices": 12,
  "current_month_revenue": 45000000.0,
  "generated_at": "2025-10-27T16:00:00Z"
}
```

**Chỉ số trả về**:
- `total_houses`: Tổng số nhà trọ
- `total_rooms`: Tổng số phòng
- `available_rooms`: Số phòng còn trống
- `occupied_rooms`: Số phòng đã cho thuê
- `occupancy_rate`: Tỷ lệ lấp đầy (%)
- `active_contracts`: Số hợp đồng đang hoạt động
- `pending_invoices`: Số hóa đơn chưa thanh toán
- `current_month_revenue`: Doanh thu tháng hiện tại

**Test Cases**:
- ✅ Lấy tổng quan hệ thống

---

## 5. HOUSES - houses.py

### 5.1. Lấy danh sách nhà trọ
```
GET /houses/

Headers:
- Authorization: Bearer {access_token}

Response (200):
[
  {
    "house_id": 1,
    "name": "Nhà trọ A",
    "address": "123 Đường ABC, TP.HCM",
    "owner_id": 1,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": null
  }
]
```

---

### 5.2. Lấy thông tin 1 nhà trọ
```
GET /houses/{house_id}

Headers:
- Authorization: Bearer {access_token}

Response (200):
{
  "house_id": 1,
  "name": "Nhà trọ A",
  "address": "123 Đường ABC, TP.HCM",
  "owner_id": 1,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": null
}

Lỗi:
- 404: House not found
- 403: Không có quyền xem (không phải owner của nhà này)
```

---

### 5.3. Tạo nhà trọ mới
```
POST /houses/

Headers:
- Authorization: Bearer {access_token}
- Content-Type: application/json

Body:
{
  "name": "Nhà trọ B",
  "address": "456 Đường XYZ, TP.HCM"
}

Response (201):
{
  "house_id": 2,
  "name": "Nhà trọ B",
  "address": "456 Đường XYZ, TP.HCM",
  "owner_id": 1,
  "created_at": "2025-10-27T16:00:00Z",
  "updated_at": null
}
```

---

### 5.4. Cập nhật nhà trọ
```
PUT /houses/{house_id}

Headers:
- Authorization: Bearer {access_token}
- Content-Type: application/json

Body:
{
  "name": "Nhà trọ B (Đã sửa)",
  "address": "789 Đường DEF, TP.HCM"
}

Response (200):
{
  "house_id": 2,
  "name": "Nhà trọ B (Đã sửa)",
  "address": "789 Đường DEF, TP.HCM",
  "owner_id": 1,
  "created_at": "2025-10-27T16:00:00Z",
  "updated_at": "2025-10-27T17:00:00Z"
}
```

---

### 5.5. Xóa nhà trọ
```
DELETE /houses/{house_id}

Headers:
- Authorization: Bearer {access_token}

Response (200):
{
  "house_id": 2,
  "name": "Nhà trọ B",
  "address": "789 Đường DEF, TP.HCM",
  "owner_id": 1,
  "created_at": "2025-10-27T16:00:00Z",
  "updated_at": "2025-10-27T17:00:00Z"
}

Lỗi:
- 404: House not found
- 403: Không có quyền xóa
```

---

## 6. ROOMS - rooms.py

### 6.1. Lấy tất cả phòng
```
GET /rooms/

Headers:
- Authorization: Bearer {access_token}

Response (200):
[
  {
    "room_id": 1,
    "name": "Phòng 101",
    "price": 3000000,
    "is_available": true,
    "house_id": 1,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

### 6.2. Lấy phòng theo nhà trọ
```
GET /rooms/house/{house_id}

Headers:
- Authorization: Bearer {access_token}

Response (200):
[
  {
    "room_id": 1,
    "name": "Phòng 101",
    "price": 3000000,
    "is_available": true,
    "house_id": 1,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

### 6.3. Lấy phòng còn trống
```
GET /rooms/available?house_id=1

Headers:
- Authorization: Bearer {access_token}

Query Params:
- house_id (optional): Lọc theo nhà trọ

Response (200):
[
  {
    "room_id": 2,
    "name": "Phòng 102",
    "price": 3000000,
    "is_available": true,
    "house_id": 1,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

### 6.4. Lấy thông tin 1 phòng
```
GET /rooms/{room_id}

Headers:
- Authorization: Bearer {access_token}

Response (200):
{
  "room_id": 1,
  "name": "Phòng 101",
  "price": 3000000,
  "is_available": false,
  "house_id": 1,
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

### 6.5. Tạo phòng mới
```
POST /rooms/

Headers:
- Authorization: Bearer {access_token}
- Content-Type: application/json

Body:
{
  "name": "Phòng 103",
  "price": 3500000,
  "house_id": 1,
  "is_available": true
}

Response (201):
{
  "room_id": 3,
  "name": "Phòng 103",
  "price": 3500000,
  "is_available": true,
  "house_id": 1,
  "created_at": "2025-10-27T16:00:00Z"
}
```

---

### 6.6. Cập nhật phòng
```
PUT /rooms/{room_id}

Headers:
- Authorization: Bearer {access_token}
- Content-Type: application/json

Body:
{
  "name": "Phòng 103 VIP",
  "price": 4000000,
  "is_available": true
}

Response (200):
{
  "room_id": 3,
  "name": "Phòng 103 VIP",
  "price": 4000000,
  "is_available": true,
  "house_id": 1,
  "created_at": "2025-10-27T16:00:00Z"
}
```

---

### 6.7. Xóa phòng
```
DELETE /rooms/{room_id}

Headers:
- Authorization: Bearer {access_token}

Response (200):
{
  "room_id": 3,
  "name": "Phòng 103 VIP",
  "price": 4000000,
  "is_available": true,
  "house_id": 1,
  "created_at": "2025-10-27T16:00:00Z"
}
```

---

## 7. RENTED ROOMS - rented_rooms.py

### 7.1. Lấy tất cả hợp đồng thuê
```
GET /rented-rooms/

Headers:
- Authorization: Bearer {access_token}

Response (200):
[
  {
    "rr_id": 1,
    "tenant_name": "Nguyễn Văn B",
    "tenant_phone": "0987654321",
    "number_of_tenants": 2,
    "monthly_rent": 3000000,
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "is_active": true,
    "room_id": 1,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

### 7.2. Lấy hợp đồng theo phòng
```
GET /rented-rooms/room/{room_id}

Headers:
- Authorization: Bearer {access_token}

Response (200):
[
  {
    "rr_id": 1,
    "tenant_name": "Nguyễn Văn B",
    "tenant_phone": "0987654321",
    "number_of_tenants": 2,
    "monthly_rent": 3000000,
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "is_active": true,
    "room_id": 1,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

### 7.3. Lấy thông tin 1 hợp đồng
```
GET /rented-rooms/{rr_id}

Headers:
- Authorization: Bearer {access_token}

Response (200):
{
  "rr_id": 1,
  "tenant_name": "Nguyễn Văn B",
  "tenant_phone": "0987654321",
  "number_of_tenants": 2,
  "monthly_rent": 3000000,
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "is_active": true,
  "room_id": 1,
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

### 7.4. Tạo hợp đồng thuê mới
```
POST /rented-rooms/

Headers:
- Authorization: Bearer {access_token}
- Content-Type: application/json

Body:
{
  "tenant_name": "Trần Thị C",
  "tenant_phone": "0912345678",
  "number_of_tenants": 1,
  "monthly_rent": 3500000,
  "start_date": "2025-11-01",
  "end_date": "2025-10-31",
  "room_id": 2
}

Response (201):
{
  "rr_id": 2,
  "tenant_name": "Trần Thị C",
  "tenant_phone": "0912345678",
  "number_of_tenants": 1,
  "monthly_rent": 3500000,
  "start_date": "2025-11-01",
  "end_date": "2025-10-31",
  "is_active": true,
  "room_id": 2,
  "created_at": "2025-10-27T16:00:00Z"
}

Lỗi:
- 400: Phòng đang được thuê
- 400: Số người thuê vượt quá giới hạn
```

---

### 7.5. Cập nhật hợp đồng
```
PUT /rented-rooms/{rr_id}

Headers:
- Authorization: Bearer {access_token}
- Content-Type: application/json

Body:
{
  "tenant_name": "Trần Thị C (Updated)",
  "tenant_phone": "0912345678",
  "number_of_tenants": 2,
  "monthly_rent": 3800000,
  "start_date": "2025-11-01",
  "end_date": "2025-10-31",
  "is_active": true
}

Response (200):
{
  "rr_id": 2,
  "tenant_name": "Trần Thị C (Updated)",
  "tenant_phone": "0912345678",
  "number_of_tenants": 2,
  "monthly_rent": 3800000,
  "start_date": "2025-11-01",
  "end_date": "2025-10-31",
  "is_active": true,
  "room_id": 2,
  "created_at": "2025-10-27T16:00:00Z"
}
```

---

### 7.6. Xóa hợp đồng
```
DELETE /rented-rooms/{rr_id}

Headers:
- Authorization: Bearer {access_token}

Response (200):
{
  "rr_id": 2,
  "tenant_name": "Trần Thị C",
  ...
}
```

---

## 8. INVOICES - invoices.py

### 8.1. Lấy tất cả hóa đơn
```
GET /invoices/

Headers:
- Authorization: Bearer {access_token}

Query Params (optional):
- is_paid: true/false
- rr_id: filter by rented room

Response (200):
[
  {
    "invoice_id": 1,
    "price": 3000000,
    "water_price": 100000,
    "internet_price": 200000,
    "general_price": 50000,
    "electricity_price": 150000,
    "electricity_num": 100,
    "water_num": 15,
    "due_date": "2025-02-01",
    "payment_date": null,
    "is_paid": false,
    "rr_id": 1,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

### 8.2. Lấy hóa đơn theo hợp đồng
```
GET /invoices/rented-room/{rr_id}

Headers:
- Authorization: Bearer {access_token}

Response (200):
[
  {
    "invoice_id": 1,
    "price": 3000000,
    ...
  }
]
```

---

### 8.3. Lấy hóa đơn chưa thanh toán
```
GET /invoices/pending

Headers:
- Authorization: Bearer {access_token}

Response (200):
[
  {
    "invoice_id": 1,
    "price": 3000000,
    "is_paid": false,
    ...
  }
]
```

---

### 8.4. Lấy thông tin 1 hóa đơn
```
GET /invoices/{invoice_id}

Headers:
- Authorization: Bearer {access_token}

Response (200):
{
  "invoice_id": 1,
  "price": 3000000,
  "water_price": 100000,
  "internet_price": 200000,
  "general_price": 50000,
  "electricity_price": 150000,
  "electricity_num": 100,
  "water_num": 15,
  "due_date": "2025-02-01",
  "payment_date": null,
  "is_paid": false,
  "rr_id": 1,
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

### 8.5. Tạo hóa đơn mới
```
POST /invoices/

Headers:
- Authorization: Bearer {access_token}
- Content-Type: application/json

Body:
{
  "price": 3000000,
  "water_price": 100000,
  "internet_price": 200000,
  "general_price": 50000,
  "electricity_price": 150000,
  "electricity_num": 100,
  "water_num": 15,
  "due_date": "2025-02-01",
  "rr_id": 1
}

Response (201):
{
  "invoice_id": 2,
  "price": 3000000,
  "water_price": 100000,
  "internet_price": 200000,
  "general_price": 50000,
  "electricity_price": 150000,
  "electricity_num": 100,
  "water_num": 15,
  "due_date": "2025-02-01",
  "payment_date": null,
  "is_paid": false,
  "rr_id": 1,
  "created_at": "2025-10-27T16:00:00Z"
}
```

---

### 8.6. Cập nhật hóa đơn
```
PUT /invoices/{invoice_id}

Headers:
- Authorization: Bearer {access_token}
- Content-Type: application/json

Body:
{
  "price": 3200000,
  "water_price": 120000,
  "internet_price": 200000,
  "general_price": 50000,
  "electricity_price": 180000,
  "electricity_num": 120,
  "water_num": 18,
  "due_date": "2025-02-01"
}

Response (200):
{
  "invoice_id": 2,
  "price": 3200000,
  ...
}
```

---

### 8.7. Thanh toán hóa đơn
```
POST /invoices/{invoice_id}/pay

Headers:
- Authorization: Bearer {access_token}

Response (200):
{
  "invoice_id": 2,
  "price": 3000000,
  "is_paid": true,
  "payment_date": "2025-10-27T16:00:00Z",
  ...
}
```

---

### 8.8. Xóa hóa đơn
```
DELETE /invoices/{invoice_id}

Headers:
- Authorization: Bearer {access_token}

Response (200):
{
  "invoice_id": 2,
  ...
}
```

---

## 9. ASSETS - assets.py

### 9.1. Lấy tài sản theo phòng
```
GET /assets/room/{room_id}

Headers:
- Authorization: Bearer {access_token}

Response (200):
[
  {
    "asset_id": 1,
    "name": "Tủ lạnh",
    "quantity": 1,
    "price": 5000000,
    "room_id": 1,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

### 9.2. Lấy thông tin 1 tài sản
```
GET /assets/{asset_id}

Headers:
- Authorization: Bearer {access_token}

Response (200):
{
  "asset_id": 1,
  "name": "Tủ lạnh",
  "quantity": 1,
  "price": 5000000,
  "room_id": 1,
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

### 9.3. Tạo tài sản mới
```
POST /assets/

Headers:
- Authorization: Bearer {access_token}
- Content-Type: application/json

Body:
{
  "name": "Máy giặt",
  "quantity": 1,
  "price": 3000000,
  "room_id": 1
}

Response (201):
{
  "asset_id": 2,
  "name": "Máy giặt",
  "quantity": 1,
  "price": 3000000,
  "room_id": 1,
  "created_at": "2025-10-27T16:00:00Z"
}
```

---

### 9.4. Cập nhật tài sản
```
PUT /assets/{asset_id}

Headers:
- Authorization: Bearer {access_token}
- Content-Type: application/json

Body:
{
  "name": "Máy giặt LG",
  "quantity": 1,
  "price": 3500000
}

Response (200):
{
  "asset_id": 2,
  "name": "Máy giặt LG",
  "quantity": 1,
  "price": 3500000,
  "room_id": 1,
  "created_at": "2025-10-27T16:00:00Z"
}
```

---

### 9.5. Xóa tài sản
```
DELETE /assets/{asset_id}

Headers:
- Authorization: Bearer {access_token}

Response (200):
{
  "asset_id": 2,
  "name": "Máy giặt LG",
  ...
}
```

---

## 10. KIỂM TRA FRONTEND SỬ DỤNG API

### ✅ API Frontend ĐÃ SỬ DỤNG

| Service File | API Endpoint | Method | Được dùng |
|--------------|--------------|--------|-----------|
| **authService.js** |
| | `/auth/login` | POST | ✅ |
| | `/auth/register` | POST | ✅ |
| | `/users/me` | GET | ✅ (3 lần) |
| | `/users/me` | PATCH | ✅ |
| | `/users/me/password` | PATCH | ✅ |
| **aiService.js** |
| | `/ai/generate-revenue-report` | POST | ✅ |
| **reportsService.js** |
| | `/reports/system-overview` | GET | ✅ |
| | `/reports/revenue-stats` | POST | ✅ |
| **houseService.js** |
| | `/houses/` | GET | ✅ |
| | `/houses/{id}` | GET | ✅ |
| | `/houses/` | POST | ✅ |
| | `/houses/{id}` | PUT | ✅ |
| | `/houses/{id}` | DELETE | ✅ |
| **roomService.js** |
| | `/rooms/` | GET | ✅ |
| | `/rooms/house/{houseId}` | GET | ✅ |
| | `/rooms/available` | GET | ✅ |
| | `/rooms/{id}` | GET | ✅ |
| | `/rooms/` | POST | ✅ |
| | `/rooms/{id}` | PUT | ✅ |
| | `/rooms/{id}` | DELETE | ✅ |
| **rentedRoomService.js** |
| | `/rented-rooms/` | GET | ✅ |
| | `/rented-rooms/room/{roomId}` | GET | ✅ |
| | `/rented-rooms/{id}` | GET | ✅ |
| | `/rented-rooms/` | POST | ✅ |
| | `/rented-rooms/{id}` | PUT | ✅ |
| **invoiceService.js** |
| | `/invoices/` | GET | ✅ |
| | `/invoices/rented-room/{rrId}` | GET | ✅ |
| | `/invoices/pending` | GET | ✅ |
| | `/invoices/{id}` | GET | ✅ |
| | `/invoices/` | POST | ✅ |
| | `/invoices/{id}` | PUT | ✅ |
| | `/invoices/{id}/pay` | POST | ✅ |
| | `/invoices/{id}` | DELETE | ✅ |
| **assetService.js** |
| | `/assets/room/{roomId}` | GET | ✅ |
| | `/assets/{id}` | GET | ✅ |
| | `/assets/` | POST | ✅ |
| | `/assets/{id}` | PUT | ✅ |
| | `/assets/{id}` | DELETE | ✅ |

---

### ❌ API Backend CHƯA ĐƯỢC FRONTEND SỬ DỤNG

| API Endpoint | Method | Chức năng | Lý do |
|--------------|--------|-----------|-------|
| `/users/roles` | GET | Lấy danh sách roles | Frontend chưa có trang quản lý roles |
| `/reports/generate-report` | POST | Tạo báo cáo chi tiết (revenue/occupancy/tenant) | Frontend chưa implement |
| `/reports/create-monthly-invoices` | POST | Tạo hóa đơn tự động | Frontend chưa implement |

---

## 📝 GỢI Ý TEST FLOW HOÀN CHỈNH

### Flow 1: Đăng ký và đăng nhập
```
1. POST /auth/register → Tạo tài khoản
2. POST /auth/login → Lấy token
3. GET /users/me → Xem thông tin
```

### Flow 2: Quản lý nhà trọ và phòng
```
1. POST /houses/ → Tạo nhà trọ
2. POST /rooms/ → Tạo phòng cho nhà trọ
3. GET /rooms/house/{house_id} → Xem danh sách phòng
4. GET /rooms/available → Xem phòng trống
```

### Flow 3: Tạo hợp đồng và hóa đơn
```
1. POST /rented-rooms/ → Tạo hợp đồng thuê (phòng sẽ is_available=false)
2. POST /invoices/ → Tạo hóa đơn cho hợp đồng
3. GET /invoices/pending → Xem hóa đơn chưa thanh toán
4. POST /invoices/{id}/pay → Thanh toán hóa đơn
```

### Flow 4: Báo cáo và thống kê
```
1. GET /reports/system-overview → Xem tổng quan
2. POST /reports/revenue-stats → Thống kê doanh thu
3. POST /ai/generate-revenue-report → Tạo báo cáo AI
4. POST /reports/generate-report (type=occupancy) → Báo cáo tỷ lệ lấp đầy
```

### Flow 5: Quản lý tài sản
```
1. POST /assets/ → Thêm tài sản vào phòng
2. GET /assets/room/{room_id} → Xem tài sản của phòng
3. PUT /assets/{id} → Cập nhật tài sản
```

---

## 🎯 TỔNG KẾT

### Thống kê API:
- **Tổng số endpoint backend**: ~45 endpoints
- **Frontend đã dùng**: ~35 endpoints
- **Tỷ lệ sử dụng**: ~78%

### API chưa dùng:
1. `/users/roles` (GET)
2. `/reports/generate-report` (POST)
3. `/reports/create-monthly-invoices` (POST)

### Khuyến nghị:
1. ✅ Tất cả các API chính đã được frontend sử dụng
2. ⚠️ 3 API báo cáo nâng cao chưa được implement ở frontend
3. 💡 Có thể thêm trang "Báo cáo nâng cao" để sử dụng các API còn lại
4. 🔒 Tất cả API (trừ login/register/roles) đều yêu cầu authentication

### Lưu ý khi test:
- Luôn đăng nhập trước để lấy token
- Token có thời gian hết hạn (xem `ACCESS_TOKEN_EXPIRE_MINUTES` trong config)
- Mọi thao tác đều theo owner_id từ token (data isolation)
- Kiểm tra cả trường hợp thành công và lỗi

