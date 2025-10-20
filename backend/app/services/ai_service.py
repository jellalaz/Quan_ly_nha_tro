import google.generativeai as genai
from typing import Dict, Optional
from app.core.config import settings
from app.core.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import text
import re

class AIService:
    def __init__(self):
        # Cấu hình Gemini AI (dùng key từ config, không hardcode)
        genai.configure(api_key=settings.gemini_api_key)
        # Dùng model ổn định, phổ biến
        self.model = genai.GenerativeModel('gemini-2.5-pro')

    def _sanitize_markdown(self, content: str) -> str:
        """Chuẩn hoá Markdown: chỉ dùng '-' cho bullet, bỏ ký tự lạ/emoji/fences, gọn dòng."""
        if not content:
            return content
        lines = content.splitlines()
        out = []
        for raw in lines:
            line = raw.strip()
            # Bỏ code fences
            if line in ("```", "```markdown", "```md"):
                continue
            # Thay bullet lạ ở đầu dòng thành '- '
            if re.match(r"^[•—–]+\s*", line):
                line = re.sub(r"^[•—–]+\s*", "- ", line)
            # Thay '•', '—', '–' xuất hiện đầu dòng sau khoảng trắng
            line = re.sub(r"^\s*[•—–]\s*", "- ", line)
            # Chuẩn hoá bullet '-'
            line = re.sub(r"^\s*-\s*", "- ", line)
            # Loại bỏ dòng chỉ gồm gạch trang trí
            if re.fullmatch(r"[-–—\s]+", line):
                continue
            # Bỏ emoji phổ biến ở đầu dòng tiêu đề
            line = re.sub(r"^(##\s*)[\u2600-\u27BF\U0001F300-\U0001FAFF]\s*", r"\1", line)
            # Bỏ emoji đầu dòng bullet
            line = re.sub(r"^(-\s*)[\u2600-\u27BF\U0001F300-\U0001FAFF]\s*", r"\1", line)
            out.append(line)
        # Ghép lại và rút gọn nhiều dòng trống liên tiếp
        text_out = "\n".join(out)
        text_out = re.sub(r"\n{3,}", "\n\n", text_out).strip()
        return text_out

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
            
            return self._sanitize_markdown(response.text)
            
        except Exception as e:
            return f"Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn: {str(e)}"
    
    def _create_prompt(self, question: str, db_context: str) -> str:
        """
        Tạo prompt cho AI với context từ database
        """
        prompt = f"""
        Bạn là trợ lý AI cho hệ thống quản lý nhà trọ.
        Hãy trả lời NGẮN GỌN bằng Markdown, tuân thủ nghiêm ngặt các quy tắc:
        - Chỉ dùng dấu gạch đầu dòng '-' cho bullet (không dùng '•', '—', '–' hay ký tự đặc biệt khác).
        - Có thể dùng tiêu đề dạng '## Tiêu đề' nếu cần.
        - Dùng in đậm với **text** cho thông tin quan trọng.
        - Không chèn ký tự trang trí, đường kẻ, emoji, hoặc khoảng trắng/dòng trống thừa.
        - Mỗi bullet tối đa 1-2 câu, rõ ràng, súc tích.
        - Không viết câu mở đầu/kết luận; trả lời trực tiếp.
        
        Ngữ cảnh hệ thống (nếu có):
        {db_context}
        
        Câu hỏi của người dùng: {question}
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

            # Prompt chuẩn Markdown, KHÔNG emoji/ký tự lạ, KHÔNG câu mở đầu/kết luận
            prompt = f"""
            Bạn là chuyên gia phân tích doanh thu. Hãy trả lời bằng Markdown, đúng định dạng sau và KHÔNG thêm ký tự trang trí/emoji:

            ## PHÂN TÍCH DOANH THU
            - **Kỳ báo cáo:** {start_date} - {end_date}

            ## CHỈ SỐ CHÍNH
            - **Tổng doanh thu:** {total_revenue:,.0f} VNĐ
            - **Tỷ lệ thanh toán:** {payment_rate:.1f}%
            - **Số lượng hóa đơn:** {total_invoices}
            - **Giá trị trung bình/hóa đơn:** {(total_revenue / total_invoices if total_invoices > 0 else 0):,.0f} VNĐ

            ## ĐIỂM MẠNH
            - Nêu tối đa 3 ý ngắn gọn dựa trên dữ liệu trên.

            ## VẤN ĐỀ CẦN LƯU Ý
            - Nêu tối đa 3 ý ngắn gọn, tập trung rủi ro/điểm yếu.

            ## KHUYẾN NGHỊ
            - Đưa ra 3-4 gợi ý cụ thể, dễ hành động.

            YÊU CẦU ĐỊNH DẠNG:
            - Chỉ dùng dấu '-' cho bullet (không dùng '•', '—', '–' hay ký tự khác).
            - Không có dòng trống thừa, không bọc trong ```.
            - Không viết câu mở đầu/kết luận.
            - Mỗi bullet tối đa 1-2 câu, ≤ 120 ký tự.
            """

            response = self.model.generate_content(prompt)
            return self._sanitize_markdown(response.text)

        except Exception as e:
            return f"Không thể tạo báo cáo doanh thu: {str(e)}"

# Khởi tạo service
ai_service = AIService()
