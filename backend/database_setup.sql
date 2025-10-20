USE room_management_db;

-- ============================================
-- STORED PROCEDURES (đang dùng)
-- ============================================

-- Procedure để tìm phòng trống phù hợp (được gọi trong AIService.get_room_recommendations)
DELIMITER //
CREATE PROCEDURE FindAvailableRooms(
    IN min_price DECIMAL(10,2),
    IN max_price DECIMAL(10,2),
    IN min_capacity INT,
    IN max_capacity INT,
    IN district_name VARCHAR(100)
)
BEGIN
    SELECT 
        r.room_id,
        r.name as room_name,
        r.capacity,
        r.price,
        r.description,
        h.name as house_name,
        h.district,
        h.address_line,
        COUNT(a.asset_id) as asset_count
    FROM rooms r
    JOIN houses h ON r.house_id = h.house_id
    LEFT JOIN assets a ON r.room_id = a.room_id
    WHERE r.is_available = TRUE
    AND r.price BETWEEN min_price AND max_price
    AND r.capacity BETWEEN min_capacity AND max_capacity
    AND (district_name IS NULL OR h.district LIKE CONCAT('%', district_name, '%'))
    GROUP BY r.room_id, r.name, r.capacity, r.price, r.description, h.name, h.district, h.address_line
    ORDER BY r.price ASC;
END //
DELIMITER ;

-- ============================================
-- TRIGGERS (giữ để đảm bảo toàn vẹn dữ liệu và tự động hoá)
-- ============================================

-- 1. Trigger tự động cập nhật trạng thái phòng khi tạo hợp đồng thuê
DELIMITER //
CREATE TRIGGER tr_after_insert_rented_room
AFTER INSERT ON rented_rooms
FOR EACH ROW
BEGIN
    UPDATE rooms 
    SET is_available = FALSE 
    WHERE room_id = NEW.room_id;
END //
DELIMITER ;

-- 2. Trigger tự động cập nhật trạng thái phòng khi chấm dứt hợp đồng
DELIMITER //
CREATE TRIGGER tr_after_update_rented_room
AFTER UPDATE ON rented_rooms
FOR EACH ROW
BEGIN
    IF NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
        UPDATE rooms 
        SET is_available = TRUE 
        WHERE room_id = NEW.room_id;
    END IF;
END //
DELIMITER ;

-- 3. Trigger tự động cập nhật ngày thanh toán khi đánh dấu hóa đơn đã thanh toán
DELIMITER //
CREATE TRIGGER tr_after_update_invoice_paid
AFTER UPDATE ON invoices
FOR EACH ROW
BEGIN
    IF NEW.is_paid = TRUE AND OLD.is_paid = FALSE AND NEW.payment_date IS NULL THEN
        UPDATE invoices 
        SET payment_date = NOW() 
        WHERE invoice_id = NEW.invoice_id;
    END IF;
END //
DELIMITER ;

-- 4. Trigger tự động tạo hóa đơn tiền cọc cho hợp đồng mới
DELIMITER //
CREATE TRIGGER tr_after_insert_rented_room_invoice
AFTER INSERT ON rented_rooms
FOR EACH ROW
BEGIN
    INSERT INTO invoices (
        price,
        water_price,
        internet_price,
        general_price,
        electricity_price,
        electricity_num,
        water_num,
        due_date,
        rr_id,
        is_paid,
        created_at
    ) VALUES (
        NEW.deposit,
        0,  -- Tiền nước mặc định
        0,  -- Tiền internet mặc định
        0,   -- Phí dịch vụ chung mặc định
        0,  -- Tiền điện mặc định
        0,       -- Số điện
        0,       -- Số nước
        DATE_ADD(NEW.start_date, INTERVAL 30 DAY),  -- Ngày đến hạn sau 30 ngày từ ngày bắt đầu
        NEW.rr_id,
        FALSE,
        NOW()
    );
END //
DELIMITER ;

-- 5. Trigger kiểm tra tính hợp lệ của dữ liệu phòng
DELIMITER //
CREATE TRIGGER tr_before_insert_room
BEFORE INSERT ON rooms
FOR EACH ROW
BEGIN
    IF NEW.capacity <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sức chứa phòng phải lớn hơn 0';
    END IF;
    
    IF NEW.price < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Giá thuê phòng không được âm';
    END IF;
END //
DELIMITER ;

-- 6. Trigger kiểm tra tính hợp lệ của hợp đồng thuê
DELIMITER //
CREATE TRIGGER tr_before_insert_rented_room
BEFORE INSERT ON rented_rooms
FOR EACH ROW
BEGIN
    IF NEW.end_date <= NEW.start_date THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ngày kết thúc phải sau ngày bắt đầu';
    END IF;
    
    IF NEW.number_of_tenants <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Số người thuê phải lớn hơn 0';
    END IF;
    
    IF NEW.monthly_rent < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tiền thuê hàng tháng không được âm';
    END IF;
END //
DELIMITER ;

-- ============================================
-- INDEXES để tối ưu hiệu suất
-- ============================================

CREATE INDEX idx_rooms_house_id ON rooms(house_id);
CREATE INDEX idx_rooms_is_available ON rooms(is_available);
CREATE INDEX idx_rented_rooms_room_id ON rented_rooms(room_id);
CREATE INDEX idx_rented_rooms_is_active ON rented_rooms(is_active);
CREATE INDEX idx_invoices_rr_id ON invoices(rr_id);
CREATE INDEX idx_invoices_is_paid ON invoices(is_paid);
CREATE INDEX idx_invoices_payment_date ON invoices(payment_date);
CREATE INDEX idx_assets_room_id ON assets(room_id);
CREATE INDEX idx_houses_owner_id ON houses(owner_id);
