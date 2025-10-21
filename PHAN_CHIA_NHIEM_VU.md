# PHÂN CHIA NHIỆM VỤ - QUẢN LÝ PHÒNG TRỌ

## TỔNG QUAN DỰ ÁN

**Tên dự án:** Hệ thống Quản Lý Phòng Trọ  
**Công nghệ:**
- **Backend:** FastAPI (Python), SQLAlchemy ORM, MySQL, JWT Authentication, Google Gemini AI
- **Frontend:** React, React Router, Ant Design, Axios
- **Kiến trúc:** RESTful API với authentication & authorization

**Các chức năng chính:**
1. Quản lý người dùng (Authentication & Authorization)
2. Quản lý nhà trọ (Houses)
3. Quản lý phòng trọ (Rooms)
4. Quản lý tài sản phòng (Assets)
5. Quản lý hợp đồng thuê (Rented Rooms/Contracts)
6. Quản lý hóa đơn (Invoices)
7. Báo cáo & Thống kê (Reports)
8. Tích hợp AI Chatbot (Gemini AI)

---

## NHÓM BACKEND (A & B)

### 👤 THÀNH VIÊN A - BACKEND CORE & AUTHENTICATION
**Trách nhiệm:** Core system, Authentication, Database, User Management

#### 📋 NHIỆM VỤ CHI TIẾT:

##### 1. **Core System & Configuration** ⭐⭐⭐
**Files phụ trách:**
- `backend/app/core/config.py` - Cấu hình hệ thống
- `backend/app/core/database.py` - Kết nối database
- `backend/app/core/security.py` - Bảo mật, JWT, password hashing
- `backend/app/__init__.py` và `backend/app/main.py` - Entry point
- `backend/main.py` - Main runner
- `backend/requirements.txt` - Dependencies

**Kiến thức cần nắm:**
- FastAPI framework (routing, middleware, dependency injection)
- SQLAlchemy ORM (Session, connection pooling)
- JWT Token (create, verify, decode)
- Password hashing với bcrypt
- CORS middleware
- Environment variables với pydantic-settings
- Database connection management

**Câu hỏi có thể gặp:**
- JWT token hoạt động như thế nào?
- Làm sao để bảo mật password?
- CORS là gì và tại sao cần thiết?
- SQLAlchemy Session lifecycle hoạt động ra sao?
- Dependency injection trong FastAPI?

##### 2. **Authentication System** ⭐⭐⭐
**Files phụ trách:**
- `backend/app/api/v2/auth.py` - Login endpoint
- `backend/app/models/user.py` - User & Role models
- `backend/app/schemas/user.py` - User schemas (Pydantic)
- `backend/app/crud/user.py` - User CRUD operations
- `backend/app/api/v2/users.py` - User management endpoints

**Kiến thức cần nắm:**
- OAuth2 Password Flow
- Role-based Access Control (RBAC)
- Token authentication
- User registration & login flow
- Password validation
- User profile management
- SQLAlchemy relationships

**Câu hỏi có thể gặp:**
- Phân biệt authentication vs authorization?
- Role system hoạt động như thế nào?
- Làm sao kiểm tra user có quyền truy cập?
- Token expiration được xử lý ra sao?
- Làm sao đảm bảo chỉ owner mới login được?

##### 3. **Database Schema & Initialization** ⭐⭐⭐
**Files phụ trách:**
- `backend/database_setup.sql` - SQL triggers & indexes
- `backend/init_db.py` - Database initialization script
- Tất cả files trong `backend/app/models/` - Hiểu tổng quan các models

**Kiến thức cần nắm:**
- MySQL triggers (before/after insert/update)
- Database indexes cho performance
- Foreign key relationships
- Cascade delete operations
- Database constraints
- SQLAlchemy declarative base
- Migration concepts (nếu có)

**Câu hỏi có thể gặp:**
- Trigger `tr_after_insert_rented_room` làm gì?
- Tại sao cần indexes?
- Cascade delete ảnh hưởng thế nào?
- Làm sao khởi tạo database từ đầu?
- Relationship giữa các bảng?

##### 4. **API Router Configuration** ⭐⭐
**Files phụ trách:**
- `backend/app/api/v2/api.py` - API router aggregation
- `backend/app/api/__init__.py` và `backend/app/api/v2/__init__.py`

**Kiến thức cần nắm:**
- FastAPI APIRouter
- API versioning (v2)
- Route organization
- Tag grouping

**Câu hỏi có thể gặp:**
- Tại sao chia API thành modules?
- API versioning là gì?
- Tags trong Swagger/OpenAPI?

---

### 👤 THÀNH VIÊN B - BACKEND BUSINESS LOGIC
**Trách nhiệm:** Business logic, AI Service, Reports, Complex endpoints

#### 📋 NHIỆM VỤ CHI TIẾT:

##### 1. **Houses & Rooms Management** ⭐⭐⭐
**Files phụ trách:**
- `backend/app/api/v2/houses.py` - Houses API endpoints
- `backend/app/api/v2/rooms.py` - Rooms API endpoints
- `backend/app/models/house.py` - House model
- `backend/app/models/room.py` - Room model
- `backend/app/schemas/house.py` - House schemas
- `backend/app/schemas/room.py` - Room schemas
- `backend/app/crud/house.py` - House CRUD
- `backend/app/crud/room.py` - Room CRUD

**Kiến thức cần nắm:**
- CRUD operations (Create, Read, Update, Delete)
- SQLAlchemy relationships (one-to-many)
- Query filtering và pagination
- Owner-specific data filtering
- Room availability logic
- Nested data structures (house -> rooms)

**Câu hỏi có thể gặp:**
- Làm sao lấy tất cả rooms của một house?
- Làm sao filter rooms theo availability?
- Owner chỉ thấy houses của mình thế nào?
- Update cascade khi thay đổi house?
- Xóa house có ảnh hưởng gì đến rooms?

##### 2. **Assets Management** ⭐⭐
**Files phụ trách:**
- `backend/app/api/v2/assets.py` - Assets API endpoints
- `backend/app/models/asset.py` - Asset model
- `backend/app/schemas/asset.py` - Asset schemas
- `backend/app/crud/asset.py` - Asset CRUD

**Kiến thức cần nắm:**
- Asset tracking per room
- CRUD với foreign keys
- Asset status management
- Quantity và purchase date tracking

**Câu hỏi có thể gặp:**
- Làm sao liệt kê assets của một room?
- Asset model có những fields gì?
- Khi xóa room, assets bị xử lý ra sao?

##### 3. **Contracts & Invoices Management** ⭐⭐⭐
**Files phụ trách:**
- `backend/app/api/v2/rented_rooms.py` - Contracts/Rented rooms API
- `backend/app/api/v2/invoices.py` - Invoices API
- `backend/app/models/rented_room.py` - RentedRoom model
- `backend/app/models/invoice.py` - Invoice model
- `backend/app/schemas/rented_room.py` - RentedRoom schemas
- `backend/app/schemas/invoice.py` - Invoice schemas
- `backend/app/crud/rented_room.py` - RentedRoom CRUD
- `backend/app/crud/invoice.py` - Invoice CRUD

**Kiến thức cần nắm:**
- Contract lifecycle (start, active, end)
- Invoice generation logic
- Payment tracking (is_paid, payment_date)
- Complex queries joining multiple tables
- Date filtering (due_date, payment_date)
- Automatic invoice creation (deposit invoice)
- Room availability updates via triggers

**Câu hỏi có thể gặp:**
- Khi tạo contract mới, invoice tiền cọc được tạo như thế nào?
- Làm sao đánh dấu invoice đã thanh toán?
- Filter invoices theo pending/paid?
- Lấy tất cả invoices của một contract?
- Khi kết thúc contract (is_active=False), room status thay đổi ra sao?
- Invoice calculation (electricity, water, internet, etc.)?

##### 4. **Reports & Analytics** ⭐⭐⭐
**Files phụ trách:**
- `backend/app/api/v2/reports.py` - Reports API endpoints
- Hiểu các queries phức tạp trong invoices và rented_rooms

**Kiến thức cần nắm:**
- Complex SQL queries với joins
- Aggregation (SUM, COUNT, AVG)
- Date range filtering
- Revenue calculations
- Occupancy statistics
- SQLAlchemy query optimization

**Câu hỏi có thể gặp:**
- Tính tổng doanh thu trong khoảng thời gian?
- Thống kê số phòng đã thuê vs còn trống?
- Query nào cho revenue report?
- Làm sao filter theo owner_id?

##### 5. **AI Service Integration** ⭐⭐⭐
**Files phụ trách:**
- `backend/app/services/ai_service.py` - Gemini AI service
- `backend/app/api/v2/ai.py` - AI chatbot endpoints

**Kiến thức cần nắm:**
- Google Gemini API integration
- Prompt engineering
- SQL query generation từ natural language
- Markdown sanitization
- Context building cho AI
- Error handling với external APIs

**Câu hỏi có thể gặp:**
- AI service dùng để làm gì?
- Gemini AI model nào được sử dụng?
- Làm sao generate revenue report bằng AI?
- _sanitize_markdown() làm gì?
- API key được config ở đâu?
- Làm sao AI biết được database schema?

---

## NHÓM FRONTEND (C & D)

### 👤 THÀNH VIÊN C - FRONTEND CORE & AUTH
**Trách nhiệm:** Core setup, Authentication, Layout, Navigation, User pages

#### 📋 NHIỆM VỤ CHI TIẾT:

##### 1. **Application Core & Configuration** ⭐⭐⭐
**Files phụ trách:**
- `frontend/src/index.js` - Entry point
- `frontend/src/App.js` - Main app component, routing
- `frontend/src/App.css` - Global styles
- `frontend/src/index.css` - Base styles
- `frontend/package.json` - Dependencies
- `frontend/public/` - Static assets

**Kiến thức cần nắm:**
- React 19 basics (components, hooks, state)
- React Router v7 (Routes, Route, Navigate, useNavigate)
- Ant Design ConfigProvider
- Vietnamese locale configuration
- Component composition
- Protected routes pattern

**Câu hỏi có thể gặp:**
- ProtectedRoute component hoạt động thế nào?
- PublicRoute vs ProtectedRoute vs OwnerRoute khác nhau gì?
- React Router Navigate dùng để làm gì?
- ConfigProvider và viVN locale?
- App entry point flow?

##### 2. **Layout & Navigation** ⭐⭐⭐
**Files phụ trách:**
- `frontend/src/components/Layout.js` - Main layout component

**Kiến thức cần nắm:**
- Ant Design Layout (Sider, Header, Content)
- Menu component và navigation
- Outlet component từ React Router
- Responsive sidebar
- User info display
- Logout functionality
- Active menu highlighting

**Câu hỏi có thể gặp:**
- Layout structure gồm những phần nào?
- Menu items được config như thế nào?
- Làm sao highlight menu item đang active?
- Logout flow hoạt động ra sao?
- Responsive design cho mobile?

##### 3. **Authentication Pages & Service** ⭐⭐⭐
**Files phụ trách:**
- `frontend/src/pages/Login.js` - Login page
- `frontend/src/pages/Register.js` - Register page
- `frontend/src/pages/Profile.js` - User profile page
- `frontend/src/services/authService.js` - Auth service layer

**Kiến thức cần nắm:**
- Ant Design Form component
- Form validation rules
- Token storage (localStorage)
- JWT decode
- Axios interceptors cho authentication
- Login/Register flow
- Protected route authentication check
- User role checking (isOwner())

**Câu hỏi có thể gặp:**
- Token được lưu ở đâu?
- Làm sao check user đã login?
- authService.isAuthenticated() hoạt động thế nào?
- Token hết hạn được xử lý ra sao?
- Form validation rules?
- Register flow từ đầu đến cuối?
- Làm sao decode JWT để lấy user info?

##### 4. **Base API Service** ⭐⭐⭐
**Files phụ trách:**
- `frontend/src/services/api.js` - Base API configuration

**Kiến thức cần nắm:**
- Axios instance configuration
- Request interceptors (thêm token)
- Response interceptors (handle errors)
- Base URL configuration
- Error handling pattern
- Async/await
- HTTP status codes

**Câu hỏi có thể gặp:**
- Axios instance khác axios thường thế nào?
- Request interceptor làm gì?
- Làm sao tự động thêm token vào headers?
- Error 401 được xử lý như thế nào?
- baseURL được set ở đâu?

##### 5. **Dashboard Page** ⭐⭐
**Files phụ trách:**
- `frontend/src/pages/Dashboard.js` - Dashboard overview page

**Kiến thức cần nắm:**
- React hooks (useState, useEffect)
- Ant Design Statistics, Card components
- Data fetching từ multiple endpoints
- Promise.all pattern
- Loading states
- Data visualization basics

**Câu hỏi có thể gặp:**
- Dashboard hiển thị những thống kê gì?
- Làm sao fetch data từ nhiều APIs cùng lúc?
- useEffect dependencies array?
- Loading state management?
- Navigate to detail pages?

---

### 👤 THÀNH VIÊN D - FRONTEND BUSINESS PAGES
**Trách nhiệm:** Business logic pages, Complex forms, Data tables, Service layers

#### 📋 NHIỆM VỤ CHI TIẾT:

##### 1. **Houses Management Page** ⭐⭐⭐
**Files phụ trách:**
- `frontend/src/pages/Houses.js` - Houses management page
- `frontend/src/services/houseService.js` - House API service

**Kiến thức cần nắm:**
- Ant Design Table component
- Modal for Create/Edit forms
- Form handling (create, edit, delete)
- Pagination configuration
- Popconfirm for delete actions
- Search and filter
- CRUD operations UI flow
- Error handling và success messages

**Câu hỏi có thể gặp:**
- Table columns được define như thế nào?
- Modal create vs edit khác nhau gì?
- Pagination options?
- Làm sao fill form khi edit?
- Delete confirmation flow?
- houseService methods nào?

##### 2. **Rooms Management Page** ⭐⭐⭐
**Files phụ trách:**
- `frontend/src/pages/Rooms.js` - Rooms management page
- `frontend/src/services/roomService.js` - Room API service

**Kiến thức cần nắm:**
- Complex table với nested data
- Select component (chọn house)
- Form với multiple input types (text, number, textarea)
- Room availability status display (Tag component)
- Filter rooms by house
- Asset management per room (có thể)

**Câu hỏi có thể gặp:**
- Làm sao hiển thị house name trong room table?
- Filter rooms theo house?
- Room availability được hiển thị như thế nào?
- InputNumber vs Input khác nhau gì?
- Làm sao validate capacity > 0?

##### 3. **Contracts Management Page** ⭐⭐⭐
**Files phụ trách:**
- `frontend/src/pages/Contracts.js` - Contracts/Rented rooms page
- `frontend/src/services/rentedRoomService.js` - Contract API service

**Kiến thức cần nắm:**
- DatePicker component (dayjs)
- Contract status management (active/inactive)
- Complex form với nhiều fields
- Date validation (end_date > start_date)
- Contract details modal
- Tenant information display
- Monthly rent calculation

**Câu hỏi có thể gặp:**
- Làm sao chọn room available cho contract mới?
- DatePicker format và validation?
- Contract active vs inactive?
- Làm sao hiển thị room và house info?
- Deposit vs monthly rent?
- dayjs library dùng để làm gì?

##### 4. **Invoices Management Page** ⭐⭐⭐
**Files phụ trách:**
- `frontend/src/pages/Invoices.js` - Invoices management page
- `frontend/src/services/invoiceService.js` - Invoice API service

**Kiến thức cần nắm:**
- Complex invoice form (nhiều loại phí)
- Payment status tracking (paid/unpaid)
- Date filtering (due_date, payment_date)
- Filter by contract/room/house
- Mark as paid functionality
- Invoice calculation display
- Tag component cho status
- Search and advanced filters

**Câu hỏi có thể gặp:**
- Invoice gồm những loại phí nào?
- Làm sao calculate tổng tiền?
- Mark as paid hoạt động thế nào?
- Filter invoices theo paid/pending?
- Due date vs payment date?
- Làm sao hiển thị tenant và room info?
- useSearchParams để làm gì?

##### 5. **Reports & AI Chatbot Page** ⭐⭐⭐
**Files phụ trách:**
- `frontend/src/pages/Reports.js` - Reports & AI page
- `frontend/src/services/reportsService.js` - Reports API service
- `frontend/src/services/aiService.js` - AI chatbot service

**Kiến thức cần nắm:**
- Date range picker
- Chart/Statistics display (có thể dùng Chart.js/Recharts)
- Revenue calculation display
- AI chatbot UI (chat messages, input)
- Real-time chat rendering
- Markdown rendering (có thể)
- Report generation flow
- AI query processing

**Câu hỏi có thể gặp:**
- Reports hiển thị những gì?
- Làm sao generate revenue report?
- RangePicker để chọn date range?
- AI chatbot hoạt động như thế nào?
- Làm sao hiển thị AI response?
- Chat history được lưu ở đâu?
- Markdown content được render ra sao?

##### 6. **Asset Service** ⭐⭐
**Files phụ trách:**
- `frontend/src/services/assetService.js` - Asset API service

**Kiến thức cần nắm:**
- Asset CRUD operations
- API calls cho assets
- Integration với Rooms page (nếu có asset management)

**Câu hỏi có thể gặp:**
- Asset service có những methods gì?
- Làm sao lấy assets của một room?
- Asset được quản lý ở page nào?

---

## 📊 BẢNG TỔNG HỢP PHÂN CÔNG

| Thành viên | Vai trò | Số lượng files | Độ phức tạp | Kiến thức chính |
|------------|---------|----------------|-------------|-----------------|
| **A** | Backend Core & Auth | ~15 files | ⭐⭐⭐ | FastAPI, SQLAlchemy, JWT, Security, Database |
| **B** | Backend Business | ~20 files | ⭐⭐⭐ | CRUD, Complex queries, AI, Reports |
| **C** | Frontend Core & Auth | ~8 files | ⭐⭐⭐ | React, Routing, Auth UI, Layout |
| **D** | Frontend Business | ~11 files | ⭐⭐⭐ | Complex forms, Tables, Data visualization |

---

## 🎯 CÁCH HỌC VÀ NẮM BẮT PROJECT

### Cho Backend (A & B):

1. **Đọc code theo flow:**
   - Start: `backend/main.py` → `backend/app/main.py`
   - Auth flow: `auth.py` → `security.py` → `user.py` (model/schema/crud)
   - Business flow: `houses.py` → `house.py` (model/schema/crud)

2. **Test API với Swagger:**
   - Chạy backend: `cd backend && uvicorn app.main:app --reload`
   - Truy cập: `http://localhost:8000/docs`
   - Test từng endpoint

3. **Hiểu Database:**
   - Đọc `database_setup.sql` để hiểu triggers
   - Xem relationship trong models
   - Vẽ ERD diagram

4. **Debug và trace:**
   - Thêm print statements
   - Dùng breakpoints
   - Check logs

### Cho Frontend (C & D):

1. **Đọc code theo flow:**
   - Start: `index.js` → `App.js` → `Layout.js`
   - Auth flow: `Login.js` → `authService.js` → `api.js`
   - Page flow: `Houses.js` → `houseService.js` → API

2. **Chạy và test:**
   - `cd frontend && npm start`
   - Test từng chức năng trên UI
   - Dùng Browser DevTools (Network, Console)

3. **Hiểu component flow:**
   - State management (useState, useEffect)
   - Form submission flow
   - API call flow
   - Error handling

4. **Test integration:**
   - Đảm bảo backend đang chạy
   - Test CRUD operations
   - Check API calls trong Network tab

---

## 💡 MẸO HỌC TẬP HIỆU QUẢ

### Cho tất cả thành viên:

1. **Họp nhóm hàng ngày (15 phút):**
   - Mỗi người báo cáo đã làm gì
   - Khó khăn gặp phải
   - Plan cho ngày tiếp theo

2. **Code review lẫn nhau:**
   - A review code của B (backend)
   - C review code của D (frontend)
   - Cross review (backend ↔ frontend)

3. **Tài liệu hoá:**
   - Viết comment trong code
   - Note lại những điểm quan trọng
   - Tạo README cho phần mình phụ trách

4. **Hỏi đáp:**
   - Tạo group chat để hỏi nhanh
   - Không hiểu thì hỏi ngay, đừng ngại
   - Share knowledge với nhau

5. **Thực hành:**
   - Chạy code và xem kết quả
   - Thử sửa và xem thay đổi
   - Break things và fix lại (học từ lỗi)

---

## 📝 CHECKLIST KIẾN THỨC THEO VAI TRÒ

### ✅ Thành viên A (Backend Core) phải biết:
- [ ] FastAPI cơ bản (router, dependency, middleware)
- [ ] SQLAlchemy (models, session, queries)
- [ ] JWT authentication
- [ ] Password hashing
- [ ] CORS
- [ ] Database connections
- [ ] Environment configuration
- [ ] API documentation (Swagger)

### ✅ Thành viên B (Backend Business) phải biết:
- [ ] CRUD operations
- [ ] Complex SQL queries
- [ ] Joins và relationships
- [ ] Date filtering
- [ ] Aggregation functions
- [ ] Google Gemini AI API
- [ ] Prompt engineering
- [ ] Error handling
- [ ] Data validation

### ✅ Thành viên C (Frontend Core) phải biết:
- [ ] React basics (components, hooks)
- [ ] React Router
- [ ] Ant Design components
- [ ] Form handling
- [ ] Authentication flow
- [ ] LocalStorage
- [ ] JWT decode
- [ ] Protected routes
- [ ] Axios configuration

### ✅ Thành viên D (Frontend Business) phải biết:
- [ ] Ant Design Table
- [ ] Complex forms
- [ ] Modal dialogs
- [ ] Date pickers
- [ ] Pagination
- [ ] Filtering và search
- [ ] CRUD UI patterns
- [ ] Error handling
- [ ] Success messages
- [ ] Data formatting

---

## 🚀 TIMELINE ĐỀ XUẤT

### Tuần 1: Làm quen và setup
- Mỗi người đọc hiểu phần của mình
- Setup môi trường development
- Chạy được project locally

### Tuần 2-3: Deep dive
- Đọc kỹ code, hiểu logic
- Test từng chức năng
- Note lại những điểm quan trọng

### Tuần 4: Integration và review
- Test toàn bộ hệ thống
- Fix bugs nếu có
- Prepare cho demo/báo cáo

---

## ❓ CÂU HỎI THƯỜNG GẶP (FAQ)

**Q: Nếu không hiểu một phần code thì làm sao?**
A: Hỏi người cùng nhóm (backend hoặc frontend), search Google, đọc documentation của library, hoặc dùng AI assistant.

**Q: Có cần học hết tất cả công nghệ không?**
A: Không cần master tất cả, chỉ cần hiểu đủ để giải thích được phần mình phụ trách.

**Q: Làm sao để test mà không sợ làm hỏng code?**
A: Dùng Git, tạo branch riêng để test. Nếu hỏng thì checkout lại.

**Q: Backend và Frontend cần phối hợp chỗ nào?**
A: API endpoints, data format, authentication flow. Hai bên cần đảm bảo frontend call đúng API và backend trả đúng format.

**Q: Ai chịu trách nhiệm chính khi demo?**
A: Cả 4 người, nhưng:
- A demo phần authentication & core
- B demo phần business logic & AI
- C demo phần login & layout
- D demo phần quản lý data (houses, rooms, invoices)

---

## 📞 HỖ TRỢ

**Khi gặp khó khăn:**
1. Đọc lại code và comment
2. Google search error message
3. Check documentation (FastAPI, React, Ant Design)
4. Hỏi người trong nhóm
5. Hỏi nhóm trưởng

**Resources hữu ích:**
- FastAPI docs: https://fastapi.tiangolo.com/
- React docs: https://react.dev/
- Ant Design: https://ant.design/
- SQLAlchemy: https://docs.sqlalchemy.org/

---

## ✨ LỜI KẾT

Mỗi người có vai trò quan trọng và bổ sung cho nhau. Backend không có Frontend thì vô dụng, Frontend không có Backend thì không có data. Hãy hợp tác chặt chẽ, học hỏi lẫn nhau, và cùng nhau hoàn thành tốt project!

**Chúc các bạn học tốt và thành công! 🎉**

