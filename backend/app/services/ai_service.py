import google.generativeai as genai
from typing import Dict, List, Optional
from app.core.config import settings
from app.core.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import text

class AIService:
    def __init__(self):
        # Cấu hình Gemini AI
        genai.configure(api_key="AIzaSyCIEnHLUvhcB_fO1vnMQQ7w9BR72qhNLPo")
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
    def generate_response(self, user_question: str, context: Optional[Dict] = None) -> str:
        """
        Tạo phản hồi từ AI dựa trên câu hỏi của người dùng và context từ database
        """
        try:
            # Lấy context từ database nếu có
            db_context = ""
            if context:
                db_context = self._get_database_context(context)
            
            # Tạo prompt cho AI
            prompt = self._create_prompt(user_question, db_context)
            
            # Gọi Gemini AI
            response = self.model.generate_content(prompt)
            
            return response.text
            
        except Exception as e:
            return f"Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn: {str(e)}"
    
    def _create_prompt(self, question: str, db_context: str) -> str:
        """
        Tạo prompt cho AI với context từ database
        """
        prompt = f"""
        Bạn là một trợ lý AI chuyên về quản lý nhà trọ và phòng cho thuê. 
        
        Thông tin hiện tại từ hệ thống:
        {db_context}
        
        Câu hỏi của người dùng: {question}
        
        YÊU CẦU TRẢ LỜI:
        - Trả lời bằng tiếng Việt, ngắn gọn, có cấu trúc rõ ràng
        - Sử dụng bullet points (-) cho danh sách
        - Sử dụng ## cho tiêu đề phần (nếu cần)
        - Sử dụng **text** để làm nổi bật thông tin quan trọng ( in đậm nó )
        - Đưa ra số liệu cụ thể từ dữ liệu hệ thống
        - Nếu là câu hỏi phức tạp, chia thành các phần: Tình hình hiện tại, Phân tích, Khuyến nghị
        - Mỗi ý chính không quá 2 dòng
        - Sử dụng emoji phù hợp để dễ đọc hơn
        """
        return prompt
    
    def _get_database_context(self, context: Dict) -> str:
        """
        Lấy thông tin từ database để làm context cho AI
        """
        context_info = []
        
        try:
            db = next(get_db())
            
            # Lấy thống kê tổng quan
            if context.get('include_stats', False):
                stats = self._get_system_stats(db)
                context_info.append(f"Thống kê hệ thống: {stats}")
            
            # Lấy thông tin phòng trống
            if context.get('include_available_rooms', False):
                rooms = self._get_available_rooms(db)
                context_info.append(f"Phòng trống hiện tại: {rooms}")
            
            # Lấy thông tin hóa đơn chưa thanh toán
            if context.get('include_pending_invoices', False):
                invoices = self._get_pending_invoices(db)
                context_info.append(f"Hóa đơn chưa thanh toán: {invoices}")
            
            db.close()
            
        except Exception as e:
            context_info.append(f"Lỗi khi lấy thông tin từ database: {str(e)}")
        
        return "\n".join(context_info)
    
    def _get_system_stats(self, db: Session) -> str:
        """
        Lấy thống kê tổng quan của hệ thống
        """
        try:
            # Tổng số nhà trọ
            total_houses = db.execute(text("SELECT COUNT(*) FROM houses")).scalar()
            
            # Tổng số phòng
            total_rooms = db.execute(text("SELECT COUNT(*) FROM rooms")).scalar()
            
            # Số phòng đang thuê
            occupied_rooms = db.execute(text("SELECT COUNT(*) FROM rooms WHERE is_available = FALSE")).scalar()
            
            # Số phòng trống
            available_rooms = total_rooms - occupied_rooms
            
            # Tỷ lệ lấp đầy
            occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
            
            return f"Tổng {total_houses} nhà trọ, {total_rooms} phòng ({occupied_rooms} đang thuê, {available_rooms} trống). Tỷ lệ lấp đầy: {occupancy_rate:.1f}%"
            
        except Exception as e:
            return f"Không thể lấy thống kê: {str(e)}"
    
    def _get_available_rooms(self, db: Session) -> str:
        """
        Lấy thông tin phòng trống
        """
        try:
            rooms = db.execute(text("""
                SELECT r.name, r.price, h.name as house_name 
                FROM rooms r 
                JOIN houses h ON r.house_id = h.house_id 
                WHERE r.is_available = TRUE 
                ORDER BY r.price 
                LIMIT 5
            """)).fetchall()
            
            if not rooms:
                return "Hiện tại không có phòng trống nào."
            
            room_list = []
            for room in rooms:
                room_list.append(f"{room.name} ({room.house_name}) - {room.price:,.0f} VNĐ")
            
            return "Phòng trống: " + ", ".join(room_list)
            
        except Exception as e:
            return f"Không thể lấy thông tin phòng trống: {str(e)}"
    
    def _get_pending_invoices(self, db: Session) -> str:
        """
        Lấy thông tin hóa đơn chưa thanh toán
        """
        try:
            invoices = db.execute(text("""
                SELECT COUNT(*) as count, SUM(price + water_price + internet_price + general_price + electricity_price) as total
                FROM invoices 
                WHERE is_paid = FALSE
            """)).fetchone()
            
            if invoices.count == 0:
                return "Không có hóa đơn chưa thanh toán nào."
            
            return f"Có {invoices.count} hóa đơn chưa thanh toán, tổng tiền: {invoices.total:,.0f} VNĐ"
            
        except Exception as e:
            return f"Không thể lấy thông tin hóa đơn: {str(e)}"
    
    def get_room_recommendations(self, budget: float, capacity: int, district: str = None) -> str:
        """
        Đưa ra gợi ý phòng phù hợp dựa trên ngân sách và yêu cầu
        """
        try:
            db = next(get_db())
            
            # Gọi stored procedure để tìm phòng phù hợp
            result = db.execute(text("""
                CALL FindAvailableRooms(:min_price, :max_price, :min_capacity, :max_capacity, :district)
            """), {
                'min_price': budget * 0.8,  # 80% ngân sách
                'max_price': budget * 1.2,  # 120% ngân sách
                'min_capacity': capacity,
                'max_capacity': capacity + 1,
                'district': district
            }).fetchall()
            
            if not result:
                return f"Không tìm thấy phòng phù hợp với ngân sách {budget:,.0f} VNĐ và {capacity} người ở {district or 'tất cả khu vực'}."
            
            recommendations = []
            for room in result[:3]:  # Lấy top 3 phòng
                recommendations.append(
                    f"🏠 {room.room_name} tại {room.house_name} - "
                    f"{room.capacity} người, {room.price:,.0f} VNĐ/tháng, "
                    f"{room.asset_count} tài sản"
                )
            
            db.close()
            
            return "Gợi ý phòng phù hợp:\n" + "\n".join(recommendations)
            
        except Exception as e:
            return f"Không thể tìm phòng phù hợp: {str(e)}"
    
    def generate_revenue_report(self, start_date: str, end_date: str) -> str:
        """
        Tạo báo cáo doanh thu bằng AI
        """
        try:
            db = next(get_db())
            
            # Gọi stored procedure để lấy thống kê doanh thu
            result = db.execute(text("""
                CALL GetRevenueStats(:start_date, :end_date, @total_revenue, @paid_invoices, @pending_invoices, @avg_monthly_revenue)
            """), {
                'start_date': start_date,
                'end_date': end_date
            })
            
            # Lấy kết quả từ output variables
            stats = db.execute(text("""
                SELECT @total_revenue as total_revenue, 
                       @paid_invoices as paid_invoices, 
                       @pending_invoices as pending_invoices, 
                       @avg_monthly_revenue as avg_monthly_revenue
            """)).fetchone()
            
            db.close()
            
            # Tạo báo cáo có cấu trúc với số liệu rõ ràng
            total_invoices = stats.paid_invoices + stats.pending_invoices
            payment_rate = (stats.paid_invoices / total_invoices * 100) if total_invoices > 0 else 0
            
            # Tạo prompt yêu cầu format cụ thể
            prompt = f"""
            Bạn là chuyên gia phân tích doanh thu. Hãy tạo báo cáo phân tích ngắn gọn, có cấu trúc với dữ liệu sau:
            
            DOANH THU: {start_date} đến {end_date}
            - Tổng doanh thu: {stats.total_revenue:,.0f} VNĐ
            - Hóa đơn đã thanh toán: {stats.paid_invoices}
            - Hóa đơn chưa thanh toán: {stats.pending_invoices}
            - Tổng số hóa đơn: {total_invoices}
            - Tỷ lệ thanh toán: {payment_rate:.1f}%
            - Doanh thu TB/tháng: {stats.avg_monthly_revenue:,.0f} VNĐ
            
            YÊU CẦU FORMAT:
            1. Bắt đầu với "## 📊 PHÂN TÍCH DOANH THU"
            2. Phần "## 📈 CHỈ SỐ CHÍNH" - liệt kê 3-4 chỉ số quan trọng nhất dạng bullet point
            3. Phần "## ✅ ĐIỂM MẠNH" - 2-3 điểm tích cực (nếu có)
            4. Phần "## ⚠️ VẤN ĐỀ CẦN LƯU Ý" - 2-3 vấn đề cần cải thiện (nếu có)
            5. Phần "## 💡 KHUYẾN NGHỊ" - 3-4 gợi ý cải thiện cụ thể, ngắn gọn
            
            LƯU Ý:
            - Mỗi bullet point PHẢI ngắn gọn (1-2 dòng)
            - Sử dụng số liệu cụ thể từ dữ liệu trên
            - Không viết văn xuôi dài
            - Tập trung vào insights quan trọng
            - Sử dụng emoji phù hợp cho mỗi phần
            """
            
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            return f"Không thể tạo báo cáo doanh thu: {str(e)}"

# Khởi tạo service
ai_service = AIService()
