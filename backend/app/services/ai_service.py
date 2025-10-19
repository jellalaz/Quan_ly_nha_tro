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
        Lấy thông tin từ database để làm context cho AI, phạm vi theo chủ nhà (owner_id)
        """
        context_info = []
        owner_id = context.get('owner_id')

        try:
            db = next(get_db())
            
            # Lấy thống kê tổng quan
            if context.get('include_stats', False):
                stats = self._get_system_stats(db, owner_id)
                context_info.append(f"Thống kê hệ thống (tài khoản bạn): {stats}")

            # Lấy thông tin phòng trống
            if context.get('include_available_rooms', False):
                rooms = self._get_available_rooms(db, owner_id)
                context_info.append(f"Phòng trống hiện tại: {rooms}")
            
            # Lấy thông tin hóa đơn chưa thanh toán
            if context.get('include_pending_invoices', False):
                invoices = self._get_pending_invoices(db, owner_id)
                context_info.append(f"Hóa đơn chưa thanh toán: {invoices}")
            
            db.close()
            
        except Exception as e:
            context_info.append(f"Lỗi khi lấy thông tin từ database: {str(e)}")
        
        return "\n".join(context_info)
    
    def _get_system_stats(self, db: Session, owner_id: int) -> str:
        """
        Lấy thống kê tổng quan của hệ thống theo chủ nhà
        """
        try:
            # Tổng số nhà trọ của owner
            total_houses = db.execute(text(
                "SELECT COUNT(*) FROM houses WHERE owner_id = :owner_id"
            ), { 'owner_id': owner_id }).scalar()

            # Tổng số phòng thuộc các nhà của owner
            total_rooms = db.execute(text(
                """
                SELECT COUNT(*) 
                FROM rooms r 
                JOIN houses h ON r.house_id = h.house_id 
                WHERE h.owner_id = :owner_id
                """
            ), { 'owner_id': owner_id }).scalar()

            # Số phòng đang thuê (không còn available)
            occupied_rooms = db.execute(text(
                """
                SELECT COUNT(*) 
                FROM rooms r 
                JOIN houses h ON r.house_id = h.house_id 
                WHERE h.owner_id = :owner_id AND r.is_available = FALSE
                """
            ), { 'owner_id': owner_id }).scalar()

            # Số phòng trống
            available_rooms = (total_rooms or 0) - (occupied_rooms or 0)

            # Tỷ lệ lấp đầy
            occupancy_rate = ((occupied_rooms or 0) / (total_rooms or 1) * 100) if (total_rooms or 0) > 0 else 0

            return f"Tổng {total_houses} nhà trọ, {total_rooms} phòng ({occupied_rooms} đang thuê, {available_rooms} trống). Tỷ lệ lấp đầy: {occupancy_rate:.1f}%"
            
        except Exception as e:
            return f"Không thể lấy thống kê: {str(e)}"
    
    def _get_available_rooms(self, db: Session, owner_id: int) -> str:
        """
        Lấy thông tin phòng trống theo chủ nhà
        """
        try:
            rooms = db.execute(text(
                """
                SELECT r.name, r.price, h.name as house_name 
                FROM rooms r 
                JOIN houses h ON r.house_id = h.house_id 
                WHERE r.is_available = TRUE 
                AND h.owner_id = :owner_id
                ORDER BY r.price 
                LIMIT 5
                """
            ), { 'owner_id': owner_id }).fetchall()

            if not rooms:
                return "Hiện tại không có phòng trống nào."
            
            room_list = []
            for room in rooms:
                room_list.append(f"{room.name} ({room.house_name}) - {room.price:,.0f} VNĐ")
            
            return "Phòng trống: " + ", ".join(room_list)
            
        except Exception as e:
            return f"Không thể lấy thông tin phòng trống: {str(e)}"
    
    def _get_pending_invoices(self, db: Session, owner_id: int) -> str:
        """
        Lấy thông tin hóa đơn chưa thanh toán theo chủ nhà
        """
        try:
            invoices = db.execute(text(
                """
                SELECT COUNT(*) as count, 
                       SUM(i.price + i.water_price + i.internet_price + i.general_price + i.electricity_price) as total
                FROM invoices i
                JOIN rented_rooms rr ON i.rr_id = rr.rr_id
                JOIN rooms r ON rr.room_id = r.room_id
                JOIN houses h ON r.house_id = h.house_id
                WHERE i.is_paid = FALSE
                  AND h.owner_id = :owner_id
                """
            ), { 'owner_id': owner_id }).fetchone()

            count = invoices.count or 0
            total = invoices.total or 0

            if count == 0:
                return "Không có hóa đơn chưa thanh toán nào."
            
            return f"Có {count} hóa đơn chưa thanh toán, tổng tiền: {total:,.0f} VNĐ"

        except Exception as e:
            return f"Không thể lấy thông tin hóa đơn: {str(e)}"
    
    def get_room_recommendations(self, budget: float, capacity: int, district: str = None) -> str:
        """
        Đưa ra gợi ý phòng phù hợp dựa trên ngân sách và yêu cầu
        """
        try:
            db = next(get_db())
            
            # Gọi stored procedure để tìm phòng phù hợp
            result = db.execute(text(
                """
                CALL FindAvailableRooms(:min_price, :max_price, :min_capacity, :max_capacity, :district)
                """
            ), {
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
    
    def generate_revenue_report(self, start_date: str, end_date: str, owner_id: int) -> str:
        """
        Tạo báo cáo doanh thu bằng AI (phạm vi theo chủ nhà đăng nhập)
        """
        try:
            db = next(get_db())

            # Tổng doanh thu (đã thanh toán) trong khoảng thời gian, theo owner
            total_revenue_row = db.execute(text(
                """
                SELECT COALESCE(SUM(i.price + i.water_price + i.internet_price + i.general_price + i.electricity_price), 0) as total
                FROM invoices i
                JOIN rented_rooms rr ON i.rr_id = rr.rr_id
                JOIN rooms r ON rr.room_id = r.room_id
                JOIN houses h ON r.house_id = h.house_id
                WHERE i.is_paid = TRUE 
                  AND i.payment_date BETWEEN :start_date AND :end_date
                  AND h.owner_id = :owner_id
                """
            ), { 'start_date': start_date, 'end_date': end_date, 'owner_id': owner_id }).fetchone()
            total_revenue = float(total_revenue_row.total or 0)

            # Số hóa đơn đã thanh toán trong khoảng thời gian, theo owner
            paid_invoices_row = db.execute(text(
                """
                SELECT COUNT(*) as cnt
                FROM invoices i
                JOIN rented_rooms rr ON i.rr_id = rr.rr_id
                JOIN rooms r ON rr.room_id = r.room_id
                JOIN houses h ON r.house_id = h.house_id
                WHERE i.is_paid = TRUE 
                  AND i.payment_date BETWEEN :start_date AND :end_date
                  AND h.owner_id = :owner_id
                """
            ), { 'start_date': start_date, 'end_date': end_date, 'owner_id': owner_id }).fetchone()
            paid_invoices = int(paid_invoices_row.cnt or 0)

            # Số hóa đơn chưa thanh toán theo due_date trong khoảng thời gian, theo owner
            pending_invoices_row = db.execute(text(
                """
                SELECT COUNT(*) as cnt
                FROM invoices i
                JOIN rented_rooms rr ON i.rr_id = rr.rr_id
                JOIN rooms r ON rr.room_id = r.room_id
                JOIN houses h ON r.house_id = h.house_id
                WHERE i.is_paid = FALSE 
                  AND i.due_date BETWEEN :start_date AND :end_date
                  AND h.owner_id = :owner_id
                """
            ), { 'start_date': start_date, 'end_date': end_date, 'owner_id': owner_id }).fetchone()
            pending_invoices = int(pending_invoices_row.cnt or 0)

            # Doanh thu trung bình theo tháng (trong khoảng thời gian), theo owner
            avg_month_row = db.execute(text(
                """
                SELECT COALESCE(AVG(monthly_revenue), 0) as avg_rev
                FROM (
                    SELECT DATE_FORMAT(i.payment_date, '%Y-%m') as month,
                           SUM(i.price + i.water_price + i.internet_price + i.general_price + i.electricity_price) as monthly_revenue
                    FROM invoices i
                    JOIN rented_rooms rr ON i.rr_id = rr.rr_id
                    JOIN rooms r ON rr.room_id = r.room_id
                    JOIN houses h ON r.house_id = h.house_id
                    WHERE i.is_paid = TRUE 
                      AND i.payment_date BETWEEN :start_date AND :end_date
                      AND h.owner_id = :owner_id
                    GROUP BY DATE_FORMAT(i.payment_date, '%Y-%m')
                ) t
                """
            ), { 'start_date': start_date, 'end_date': end_date, 'owner_id': owner_id }).fetchone()
            avg_monthly_revenue = float(avg_month_row.avg_rev or 0)

            db.close()
            
            # Tính bổ sung
            total_invoices = paid_invoices + pending_invoices
            payment_rate = (paid_invoices / total_invoices * 100) if total_invoices > 0 else 0

            # Tạo prompt yêu cầu format cụ thể
            prompt = f"""
            Bạn là chuyên gia phân tích doanh thu. Hãy tạo báo cáo phân tích ngắn gọn, có cấu trúc với dữ liệu sau (phạm vi tài khoản hiện tại):
            
            DOANH THU: {start_date} đến {end_date}
            - Tổng doanh thu: {total_revenue:,.0f} VNĐ
            - Hóa đơn đã thanh toán: {paid_invoices}
            - Hóa đơn chưa thanh toán: {pending_invoices}
            - Tổng số hóa đơn: {total_invoices}
            - Tỷ lệ thanh toán: {payment_rate:.1f}%
            - Doanh thu TB/tháng: {avg_monthly_revenue:,.0f} VNĐ
            
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
