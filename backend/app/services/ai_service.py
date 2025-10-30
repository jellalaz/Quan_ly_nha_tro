import google.generativeai as genai
from ..core.config import settings
from ..core.database import get_db
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
            - Đưa ra 3-4 gợi ý cụ thể, dễ hành động về vấn đề đã nêu, không lan man sang các lĩnh vực khác như bán hàng .v.v.

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
