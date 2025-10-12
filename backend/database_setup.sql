-- Database setup cho Room Management System
-- Chạy file này trong MySQL để tạo triggers và stored procedures

USE room_management_db;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- 1. Procedure để tạo hóa đơn tự động cho tháng mới
DELIMITER //
CREATE PROCEDURE CreateMonthlyInvoices()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE rr_id_var INT;
    DECLARE monthly_rent_var DECIMAL(10,2);
    DECLARE room_id_var INT;
    DECLARE cur CURSOR FOR 
        SELECT rr_id, monthly_rent, room_id 
        FROM rented_rooms 
        WHERE is_active = TRUE;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO rr_id_var, monthly_rent_var, room_id_var;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Tạo hóa đơn mới cho tháng tiếp theo
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
            created_at
        ) VALUES (
            monthly_rent_var,
            100000,  -- Tiền nước mặc định
            200000,  -- Tiền internet mặc định
            50000,   -- Phí dịch vụ chung mặc định
            150000,  -- Tiền điện mặc định
            0,       -- Số điện (sẽ cập nhật sau)
            0,       -- Số nước (sẽ cập nhật sau)
            DATE_ADD(CURDATE(), INTERVAL 30 DAY),  -- Ngày đến hạn sau 30 ngày
            rr_id_var,
            NOW()
        );
    END LOOP;
    CLOSE cur;
END //
DELIMITER ;

-- 2. Procedure để tính toán thống kê doanh thu
DELIMITER //
CREATE PROCEDURE GetRevenueStats(
    IN start_date DATE,
    IN end_date DATE,
    OUT total_revenue DECIMAL(15,2),
    OUT paid_invoices INT,
    OUT pending_invoices INT,
    OUT avg_monthly_revenue DECIMAL(15,2)
)
BEGIN
    -- Tổng doanh thu trong khoảng thời gian
    SELECT COALESCE(SUM(price + water_price + internet_price + general_price + electricity_price), 0)
    INTO total_revenue
    FROM invoices 
    WHERE is_paid = TRUE 
    AND payment_date BETWEEN start_date AND end_date;
    
    -- Số hóa đơn đã thanh toán
    SELECT COUNT(*)
    INTO paid_invoices
    FROM invoices 
    WHERE is_paid = TRUE 
    AND payment_date BETWEEN start_date AND end_date;
    
    -- Số hóa đơn chưa thanh toán
    SELECT COUNT(*)
    INTO pending_invoices
    FROM invoices 
    WHERE is_paid = FALSE 
    AND due_date BETWEEN start_date AND end_date;
    
    -- Doanh thu trung bình hàng tháng
    SELECT COALESCE(AVG(monthly_revenue), 0)
    INTO avg_monthly_revenue
    FROM (
        SELECT 
            DATE_FORMAT(payment_date, '%Y-%m') as month,
            SUM(price + water_price + internet_price + general_price + electricity_price) as monthly_revenue
        FROM invoices 
        WHERE is_paid = TRUE 
        AND payment_date BETWEEN start_date AND end_date
        GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
    ) as monthly_stats;
END //
DELIMITER ;

-- 3. Procedure để tìm phòng trống phù hợp
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

-- 4. Procedure để tạo báo cáo chi tiết
DELIMITER //
CREATE PROCEDURE GenerateDetailedReport(
    IN report_type VARCHAR(50),
    IN start_date DATE,
    IN end_date DATE
)
BEGIN
    IF report_type = 'revenue' THEN
        SELECT 
            DATE_FORMAT(payment_date, '%Y-%m') as month,
            COUNT(*) as total_invoices,
            SUM(price) as room_revenue,
            SUM(water_price) as water_revenue,
            SUM(internet_price) as internet_revenue,
            SUM(electricity_price) as electricity_revenue,
            SUM(general_price) as service_revenue,
            SUM(price + water_price + internet_price + electricity_price + general_price) as total_revenue
        FROM invoices 
        WHERE is_paid = TRUE 
        AND payment_date BETWEEN start_date AND end_date
        GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
        ORDER BY month DESC;
        
    ELSEIF report_type = 'occupancy' THEN
        SELECT 
            h.name as house_name,
            COUNT(r.room_id) as total_rooms,
            SUM(CASE WHEN r.is_available = FALSE THEN 1 ELSE 0 END) as occupied_rooms,
            ROUND(
                (SUM(CASE WHEN r.is_available = FALSE THEN 1 ELSE 0 END) * 100.0 / COUNT(r.room_id)), 2
            ) as occupancy_rate
        FROM houses h
        LEFT JOIN rooms r ON h.house_id = r.house_id
        GROUP BY h.house_id, h.name
        ORDER BY occupancy_rate DESC;
        
    ELSEIF report_type = 'tenant' THEN
        SELECT 
            rr.tenant_name,
            rr.tenant_phone,
            rr.number_of_tenants,
            r.name as room_name,
            h.name as house_name,
            rr.start_date,
            rr.end_date,
            DATEDIFF(rr.end_date, CURDATE()) as days_remaining,
            rr.monthly_rent
        FROM rented_rooms rr
        JOIN rooms r ON rr.room_id = r.room_id
        JOIN houses h ON r.house_id = h.house_id
        WHERE rr.is_active = TRUE
        AND rr.start_date <= end_date
        AND rr.end_date >= start_date
        ORDER BY days_remaining ASC;
    END IF;
END //
DELIMITER ;

-- ============================================
-- TRIGGERS
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

-- 4. Trigger tự động tạo hóa đơn cho hợp đồng mới
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
        NEW.monthly_rent,
        100000,  -- Tiền nước mặc định
        200000,  -- Tiền internet mặc định
        50000,   -- Phí dịch vụ chung mặc định
        150000,  -- Tiền điện mặc định
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
-- VIEWS
-- ============================================

-- View tổng hợp thông tin phòng và trạng thái
CREATE VIEW v_room_status AS
SELECT 
    r.room_id,
    r.name as room_name,
    r.capacity,
    r.price,
    r.is_available,
    h.name as house_name,
    h.district,
    rr.tenant_name,
    rr.start_date,
    rr.end_date,
    DATEDIFF(rr.end_date, CURDATE()) as days_remaining,
    COUNT(a.asset_id) as asset_count
FROM rooms r
JOIN houses h ON r.house_id = h.house_id
LEFT JOIN rented_rooms rr ON r.room_id = rr.room_id AND rr.is_active = TRUE
LEFT JOIN assets a ON r.room_id = a.room_id
GROUP BY r.room_id, r.name, r.capacity, r.price, r.is_available, h.name, h.district, rr.tenant_name, rr.start_date, rr.end_date;

-- View thống kê doanh thu theo tháng
CREATE VIEW v_monthly_revenue AS
SELECT 
    DATE_FORMAT(payment_date, '%Y-%m') as month,
    COUNT(*) as total_paid_invoices,
    SUM(price + water_price + internet_price + general_price + electricity_price) as total_revenue,
    AVG(price + water_price + internet_price + general_price + electricity_price) as avg_invoice_amount
FROM invoices 
WHERE is_paid = TRUE 
GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
ORDER BY month DESC;

-- ============================================
-- EVENTS (Scheduled Tasks)
-- ============================================

-- Event tự động tạo hóa đơn hàng tháng (chạy vào ngày 1 hàng tháng)
DELIMITER //
CREATE EVENT ev_monthly_invoice_generation
ON SCHEDULE EVERY 1 MONTH
STARTS '2024-01-01 00:00:00'
DO
BEGIN
    CALL CreateMonthlyInvoices();
END //
DELIMITER ;

-- Event kiểm tra hợp đồng sắp hết hạn (chạy hàng ngày)
DELIMITER //
CREATE EVENT ev_check_expiring_contracts
ON SCHEDULE EVERY 1 DAY
STARTS '2024-01-01 00:00:00'
DO
BEGIN
    -- Có thể gửi email thông báo hoặc cập nhật trạng thái
    SELECT 
        rr.rr_id,
        rr.tenant_name,
        rr.tenant_phone,
        r.name as room_name,
        DATEDIFF(rr.end_date, CURDATE()) as days_remaining
    FROM rented_rooms rr
    JOIN rooms r ON rr.room_id = r.room_id
    WHERE rr.is_active = TRUE
    AND DATEDIFF(rr.end_date, CURDATE()) <= 30
    AND DATEDIFF(rr.end_date, CURDATE()) > 0;
END //
DELIMITER ;

-- Bật event scheduler
SET GLOBAL event_scheduler = ON;

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

-- ============================================
-- GRANT PERMISSIONS (nếu cần)
-- ============================================

-- Tạo user cho ứng dụng (tùy chọn)
-- CREATE USER 'room_app'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON room_management_db.* TO 'room_app'@'localhost';
-- FLUSH PRIVILEGES;
