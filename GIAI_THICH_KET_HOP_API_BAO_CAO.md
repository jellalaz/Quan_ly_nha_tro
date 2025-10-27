# GIẢI THÍCH CÁCH KẾT HỢP AI API VÀ REPORTS API ĐỂ HIỂN THỊ BÁO CÁO

## TỔNG QUAN HỆ THỐNG

Hệ thống có **3 API báo cáo** hoạt động độc lập nhưng bổ sung cho nhau:

### 1. AI API (1 endpoint):
- **Endpoint:** `POST /api/v2/ai/generate-revenue-report`
- **Chức năng:** Tạo báo cáo phân tích doanh thu bằng AI (Gemini)
- **Input:** `start_date`, `end_date`
- **Output:** Báo cáo dạng Markdown với phân tích, điểm mạnh, vấn đề và khuyến nghị

### 2. Reports API (2 endpoints):
#### a) **Thống kê doanh thu:**
- **Endpoint:** `POST /api/v2/reports/revenue-stats`
- **Chức năng:** Lấy số liệu doanh thu thô (raw data)
- **Input:** `start_date`, `end_date`
- **Output:** 
  - `total_revenue`: Tổng doanh thu
  - `paid_invoices`: Số hóa đơn đã thanh toán
  - `pending_invoices`: Số hóa đơn chưa thanh toán
  - `avg_monthly_revenue`: Doanh thu trung bình/tháng

#### b) **Tổng quan hệ thống:**
- **Endpoint:** `GET /api/v2/reports/system-overview`
- **Chức năng:** Lấy thống kê tổng quan (không cần thời gian)
- **Output:**
  - `total_houses`: Tổng nhà trọ
  - `total_rooms`: Tổng phòng
  - `occupancy_rate`: Tỷ lệ lấp đầy
  - `active_contracts`: Hợp đồng đang hoạt động
  - `current_month_revenue`: Doanh thu tháng hiện tại

---

## CÁCH KẾT HỢP 3 API ĐỂ TẠO BÁO CÁO ĐẦY ĐỦ

### Luồng hoạt động trên Frontend:

```
┌─────────────────────────────────────────────────────────────┐
│                    Trang Reports.js                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   Khi component load (useEffect):       │
        │   1. fetchSystemOverview()              │
        │   2. fetchRevenueStats()                │
        └─────────────────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
┌──────────────────────┐              ┌──────────────────────┐
│ GET /system-overview │              │ POST /revenue-stats  │
│ (Không cần params)   │              │ (start_date, end_date)│
└──────────────────────┘              └──────────────────────┘
          │                                       │
          ▼                                       ▼
   Hiển thị 4 cards:                    Hiển thị 4 thống kê:
   - Tổng nhà trọ                       - Tổng doanh thu
   - Tỷ lệ lấp đầy                      - Hóa đơn đã thanh toán
   - Hợp đồng hoạt động                 - Hóa đơn chưa thanh toán
   - Doanh thu tháng này                - Doanh thu TB/tháng

                              │
          ┌───────────────────┴───────────────────┐
          │ User nhấn nút "Phân tích AI"         │
          └───────────────────┬───────────────────┘
                              ▼
                ┌──────────────────────────────────┐
                │ POST /ai/generate-revenue-report │
                │ (start_date, end_date)           │
                └──────────────────────────────────┘
                              │
                              ▼
                   Hiển thị báo cáo AI Markdown:
                   - Phân tích doanh thu
                   - Chỉ số chính
                   - Điểm mạnh
                   - Vấn đề cần lưu ý
                   - Khuyến nghị
```

---

## CÁCH GỌI API TỪ FRONTEND

### 1. **Gọi System Overview (Tự động khi load trang)**

```javascript
const fetchSystemOverview = async () => {
  try {
    const data = await reportsService.getSystemOverview();
    setSystemOverview(data);
    // Hiển thị: total_houses, occupancy_rate, active_contracts, current_month_revenue
  } catch (error) {
    message.error('Lỗi khi tải tổng quan hệ thống!');
  }
};

useEffect(() => {
  fetchSystemOverview();
}, []);
```

### 2. **Gọi Revenue Stats (Tự động khi load hoặc khi user thay đổi thời gian)**

```javascript
const fetchRevenueStats = async () => {
  try {
    const start = startDate?.format('YYYY-MM-DD'); // VD: '2024-10-01'
    const end = endDate?.format('YYYY-MM-DD');     // VD: '2024-10-31'
    
    const data = await reportsService.getRevenueStats(start, end);
    setRevenueStats(data);
    // Hiển thị: total_revenue, paid_invoices, pending_invoices, avg_monthly_revenue
  } catch (error) {
    message.error('Lỗi khi tải thống kê doanh thu!');
  }
};

// Gọi khi load trang
useEffect(() => {
  fetchRevenueStats();
}, []);

// Hoặc gọi khi user nhấn nút "Cập nhật"
<Button onClick={fetchRevenueStats}>Cập nhật</Button>
```

### 3. **Gọi AI Report (Chỉ khi user nhấn nút "Phân tích AI")**

```javascript
const generateAIReport = async () => {
  try {
    setAiLoading(true);
    const start = startDate?.format('YYYY-MM-DD');
    const end = endDate?.format('YYYY-MM-DD');
    
    const data = await aiService.generateRevenueReport(start, end);
    setAiReport(data?.report || '');
    // Hiển thị báo cáo Markdown với phân tích AI
  } catch (error) {
    message.error('Lỗi khi tạo báo cáo AI!');
  } finally {
    setAiLoading(false);
  }
};

<Button 
  type="primary" 
  icon={<RobotOutlined />} 
  loading={aiLoading}
  onClick={generateAIReport}
>
  Phân tích AI
</Button>
```

---

## CÁCH HIỂN THỊ DỮ LIỆU TRÊN FRONTEND

### Bố cục trang Reports (Layout):

```
┌─────────────────────────────────────────────────────────────────┐
│                    BÁO CÁO & PHÂN TÍCH                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Tổng nhà │  │ Tỷ lệ lấp│  │ Hợp đồng │  │ Doanh thu│      │
│  │ trọ: 5   │  │ đầy: 85% │  │ hoạt đ: 8│  │ tháng này│      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│  (System Overview - Gọi API 1 lần khi load)                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────┐  ┌────────────────────────┐  │
│  │ THỐNG KÊ DOANH THU          │  │ AI PHÂN TÍCH DOANH THU │  │
│  │ [DatePicker] đến [DatePicker│  │                        │  │
│  │ [Cập nhật]                  │  │  [Phân tích AI]        │  │
│  │ ─────────────────────────── │  │ ────────────────────── │  │
│  │ Tổng doanh thu: 50,000,000  │  │ ## PHÂN TÍCH DOANH THU │  │
│  │ Hóa đơn đã TT: 15           │  │ - Kỳ báo cáo: ...     │  │
│  │ Hóa đơn chưa TT: 3          │  │                        │  │
│  │ Doanh thu TB/tháng: 25M     │  │ ## CHỈ SỐ CHÍNH       │  │
│  └─────────────────────────────┘  │ - Tổng doanh thu: ... │  │
│  (Revenue Stats - Gọi khi thay   │ - Tỷ lệ thanh toán: .. │  │
│   đổi thời gian)                  │                        │  │
│                                   │ ## ĐIỂM MẠNH           │  │
│                                   │ - ...                  │  │
│                                   │                        │  │
│                                   │ ## VẤN ĐỀ CẦN LƯU Ý   │  │
│                                   │ - ...                  │  │
│                                   │                        │  │
│                                   │ ## KHUYẾN NGHỊ         │  │
│                                   │ - ...                  │  │
│                                   └────────────────────────┘  │
│                                   (AI Report - Gọi khi user   │
│                                    nhấn nút)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## TẠI SAO CẦN 3 API RIÊNG BIỆT?

### 1. **System Overview (GET /system-overview)**
- **Mục đích:** Thống kê tổng quan KHÔNG phụ thuộc thời gian
- **Dữ liệu:** Tổng nhà trọ, phòng, tỷ lệ lấp đầy hiện tại
- **Gọi:** 1 lần khi load trang, không cần params

### 2. **Revenue Stats (POST /revenue-stats)**
- **Mục đích:** Số liệu doanh thu THỰC TẾ theo khoảng thời gian
- **Dữ liệu:** Con số cụ thể (total_revenue, paid_invoices, ...)
- **Gọi:** Khi user chọn thời gian khác nhau
- **Đặc điểm:** Nhanh, chỉ query database, trả về JSON

### 3. **AI Report (POST /ai/generate-revenue-report)**
- **Mục đích:** PHÂN TÍCH và ĐƯA RA KHUYẾN NGHỊ dựa trên dữ liệu
- **Dữ liệu:** Báo cáo dạng văn bản Markdown với insights
- **Gọi:** Khi user muốn có phân tích sâu (nhấn nút "Phân tích AI")
- **Đặc điểm:** Chậm hơn (gọi Gemini AI), tốn chi phí, nội dung động

---

## LUỒNG DỮ LIỆU CHI TIẾT

### Kịch bản: User vào trang Reports

```
Step 1: Load trang
  └─> Component mount
      └─> useEffect chạy
          ├─> fetchSystemOverview()
          │   └─> GET /system-overview
          │       └─> Hiển thị 4 cards ở trên cùng
          │
          └─> fetchRevenueStats()
              └─> POST /revenue-stats {start_date: '2024-10-01', end_date: '2024-10-31'}
                  └─> Hiển thị 4 thống kê doanh thu (card bên trái)

Step 2: User thay đổi khoảng thời gian
  └─> DatePicker onChange
      └─> setStartDate() / setEndDate()
          └─> User nhấn "Cập nhật"
              └─> fetchRevenueStats()
                  └─> POST /revenue-stats {start_date: '2024-09-01', end_date: '2024-09-30'}
                      └─> Cập nhật lại 4 thống kê doanh thu

Step 3: User muốn phân tích AI
  └─> Nhấn nút "Phân tích AI"
      └─> generateAIReport()
          └─> POST /ai/generate-revenue-report {start_date: '2024-09-01', end_date: '2024-09-30'}
              └─> Backend gọi Gemini AI với dữ liệu doanh thu
                  └─> Trả về báo cáo Markdown
                      └─> Hiển thị trong card bên phải với format đẹp
```

---

## CODE THAM KHẢO ĐẦY ĐỦ

### Frontend Service Calls:

```javascript
// File: frontend/src/services/reportsService.js
import api from './api';

export const reportsService = {
  // API 1: System Overview
  getSystemOverview: async () => {
    const response = await api.get('/reports/system-overview');
    return response.data;
  },

  // API 2: Revenue Stats
  getRevenueStats: async (startDate, endDate) => {
    const response = await api.post('/reports/revenue-stats', {
      start_date: startDate,  // Format: 'YYYY-MM-DD'
      end_date: endDate       // Format: 'YYYY-MM-DD'
    });
    return response.data;
  }
};

// File: frontend/src/services/aiService.js
import api from './api';

export const aiService = {
  // API 3: AI Report
  generateRevenueReport: async (startDate, endDate) => {
    const response = await api.post('/ai/generate-revenue-report', {
      start_date: startDate,  // Format: 'YYYY-MM-DD'
      end_date: endDate       // Format: 'YYYY-MM-DD'
    });
    return response.data; // { report: "...", period: "...", timestamp: "..." }
  }
};
```

### Component Logic:

```javascript
// File: frontend/src/pages/Reports.js
import React, { useState, useEffect } from 'react';
import { reportsService } from '../services/reportsService';
import { aiService } from '../services/aiService';

const Reports = () => {
  // State management
  const [systemOverview, setSystemOverview] = useState({});
  const [revenueStats, setRevenueStats] = useState({});
  const [aiReport, setAiReport] = useState('');
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'days'));
  const [endDate, setEndDate] = useState(dayjs());

  // Load data khi component mount
  useEffect(() => {
    fetchSystemOverview();  // API 1
    fetchRevenueStats();    // API 2
  }, []);

  // Fetch functions
  const fetchSystemOverview = async () => {
    const data = await reportsService.getSystemOverview();
    setSystemOverview(data);
  };

  const fetchRevenueStats = async () => {
    const start = startDate?.format('YYYY-MM-DD');
    const end = endDate?.format('YYYY-MM-DD');
    const data = await reportsService.getRevenueStats(start, end);
    setRevenueStats(data);
  };

  const generateAIReport = async () => {
    setAiLoading(true);
    const start = startDate?.format('YYYY-MM-DD');
    const end = endDate?.format('YYYY-MM-DD');
    const data = await aiService.generateRevenueReport(start, end);
    setAiReport(data?.report || '');
    setAiLoading(false);
  };

  return (
    <div>
      {/* Hiển thị systemOverview */}
      <Row>
        <Card>
          <Statistic title="Tổng nhà trọ" value={systemOverview.total_houses} />
        </Card>
        {/* ... 3 cards khác */}
      </Row>

      {/* Hiển thị revenueStats */}
      <Card title="Thống kê doanh thu">
        <Statistic title="Tổng doanh thu" value={revenueStats.total_revenue} />
        {/* ... 3 statistics khác */}
      </Card>

      {/* Hiển thị aiReport */}
      <Card title="AI Phân tích">
        <Button onClick={generateAIReport}>Phân tích AI</Button>
        <div>{aiReport}</div>
      </Card>
    </div>
  );
};
```

---

## KẾT HỢP 3 API ĐỂ TẠO BÁO CÁO HOÀN CHỈNH

### Báo cáo hoàn chỉnh bao gồm:

1. **Phần tổng quan hệ thống** (từ System Overview API)
   - Tổng nhà trọ: 5
   - Tỷ lệ lấp đầy: 85%
   - Hợp đồng hoạt động: 8
   - Doanh thu tháng này: 30,000,000 VNĐ

2. **Phần số liệu doanh thu** (từ Revenue Stats API)
   - Kỳ: 01/10/2024 - 31/10/2024
   - Tổng doanh thu: 50,000,000 VNĐ
   - Hóa đơn đã thanh toán: 15
   - Hóa đơn chưa thanh toán: 3
   - Doanh thu trung bình/tháng: 25,000,000 VNĐ

3. **Phần phân tích AI** (từ AI Report API)
   ```markdown
   ## PHÂN TÍCH DOANH THU
   - Kỳ báo cáo: 2024-10-01 - 2024-10-31
   
   ## CHỈ SỐ CHÍNH
   - Tổng doanh thu: 50,000,000 VNĐ
   - Tỷ lệ thanh toán: 83.3%
   - Số lượng hóa đơn: 18
   
   ## ĐIỂM MẠNH
   - Tỷ lệ thanh toán cao, cho thấy khách hàng có ý thức tốt
   - Doanh thu ổn định, tăng trưởng so với tháng trước
   
   ## VẤN ĐỀ CẦN LƯU Ý
   - 3 hóa đơn chưa thanh toán cần theo dõi
   - Cần tăng cường nhắc nhở khách hàng
   
   ## KHUYẾN NGHỊ
   - Gửi thông báo nhắc nợ cho 3 hóa đơn chưa thanh toán
   - Xem xét áp dụng ưu đãi cho khách thanh toán đúng hạn
   - Theo dõi xu hướng doanh thu hàng tháng
   ```

---

## TÓM TẮT

### Khi nào gọi API nào?

| API | Endpoint | Khi nào gọi | Mục đích |
|-----|----------|-------------|----------|
| **System Overview** | GET /reports/system-overview | Load trang (1 lần) | Hiển thị tổng quan không phụ thuộc thời gian |
| **Revenue Stats** | POST /reports/revenue-stats | Load trang + khi đổi thời gian | Hiển thị số liệu thực tế theo khoảng thời gian |
| **AI Report** | POST /ai/generate-revenue-report | Khi user nhấn nút "Phân tích AI" | Tạo phân tích và khuyến nghị bằng AI |

### Điểm quan trọng:

✅ **Revenue Stats** cung cấp dữ liệu thô (raw data)
✅ **AI Report** phân tích và đưa ra insights dựa trên dữ liệu đó
✅ Cả 2 API đều dùng cùng khoảng thời gian (start_date, end_date)
✅ AI Report chậm hơn và tốn chi phí hơn, nên chỉ gọi khi cần
✅ Frontend kết hợp hiển thị cả 3 nguồn dữ liệu trong 1 trang

---

## VÍ DỤ THỰC TẾ

### Scenario: User muốn xem báo cáo tháng 10/2024

```
1. User mở trang Reports
   → Frontend tự động gọi:
     • GET /system-overview (hiển thị tổng quan hiện tại)
     • POST /revenue-stats với {start_date: '2024-10-01', end_date: '2024-10-31'}
       → Hiển thị: Tổng doanh thu 50M, 15 hóa đơn đã TT, 3 chưa TT

2. User muốn phân tích sâu
   → User nhấn "Phân tích AI"
   → Frontend gọi:
     • POST /ai/generate-revenue-report với {start_date: '2024-10-01', end_date: '2024-10-31'}
       → AI phân tích dữ liệu và trả về:
         "Doanh thu tháng 10 tăng 20% so với tháng 9. 
          Tỷ lệ thanh toán đúng hạn tốt (83%).
          Khuyến nghị: Theo dõi 3 hóa đơn chưa thanh toán..."

3. User muốn xem tháng 9/2024
   → User đổi DatePicker thành 01/09 - 30/09
   → User nhấn "Cập nhật"
   → Frontend gọi lại:
     • POST /revenue-stats với {start_date: '2024-09-01', end_date: '2024-09-30'}
       → Cập nhật số liệu tháng 9
   
   → Nếu user muốn phân tích AI tháng 9, nhấn lại "Phân tích AI"
     • POST /ai/generate-revenue-report với {start_date: '2024-09-01', end_date: '2024-09-30'}
       → AI phân tích dữ liệu tháng 9
```

---

## KẾT LUẬN

Hệ thống sử dụng **3 API bổ trợ cho nhau**:
1. **System Overview**: Tổng quan tĩnh (không theo thời gian)
2. **Revenue Stats**: Số liệu động (theo thời gian user chọn)
3. **AI Report**: Phân tích thông minh (theo thời gian user chọn)

Frontend kết hợp cả 3 để tạo một trang báo cáo hoàn chỉnh với:
- **Số liệu thực tế** (từ Reports API)
- **Phân tích thông minh** (từ AI API)
- **Giao diện trực quan** (Cards, Charts, Markdown rendering)

