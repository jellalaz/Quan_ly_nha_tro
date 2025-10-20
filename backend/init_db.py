from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models import user, house, room, asset, rented_room, invoice
from app.core.security import get_password_hash
from datetime import datetime, timedelta

# Tạo toàn bộ bảng theo model, dữ liệu trắng
user.Base.metadata.create_all(bind=engine)


#Chèn dữ liệu mẫu ban đầu

def init_db():
    db = SessionLocal()

    try:
        # Tạo role owner
        owner_role = user.Role(authority="owner")
        db.add(owner_role)
        db.commit()

        # Tạo user owner
        owner_user = user.User(
            fullname="House Owner",
            phone="0987654321",
            email="owner@example.com",
            password=get_password_hash("owner123"),
            role_id=owner_role.id
        )
        db.add(owner_user)
        db.commit()

        # Tạo sample house
        sample_house = house.House(
            name="Nhà trọ ABC",
            floor_count=3,
            ward="Phường 1",
            district="Quận 1",
            address_line="123 Đường ABC, Phường 1, Quận 1, TP.HCM",
            owner_id=owner_user.owner_id
        )
        db.add(sample_house)
        db.commit()

        # Create sample rooms
        rooms_data = [
            {"name": "P101", "capacity": 2, "price": 2500000, "description": "Phòng 2 người, có điều hòa"},
            {"name": "P102", "capacity": 1, "price": 2000000, "description": "Phòng 1 người, có quạt"},
            {"name": "P201", "capacity": 3, "price": 3000000, "description": "Phòng 3 người, có điều hòa và tủ lạnh"},
            {"name": "P202", "capacity": 2, "price": 2500000, "description": "Phòng 2 người, có điều hòa"},
        ]

        for room_data in rooms_data:
            room_obj = room.Room(
                name=room_data["name"],
                capacity=room_data["capacity"],
                description=room_data["description"],
                price=room_data["price"],
                house_id=sample_house.house_id
            )
            db.add(room_obj)
        db.commit()

        # Create sample assets for rooms
        assets_data = [
            {"name": "Điều hòa", "room_id": 1},
            {"name": "Tủ lạnh", "room_id": 1},
            {"name": "Giường đôi", "room_id": 1},
            {"name": "Quạt điện", "room_id": 2},
            {"name": "Giường đơn", "room_id": 2},
            {"name": "Điều hòa", "room_id": 3},
            {"name": "Tủ lạnh", "room_id": 3},
            {"name": "Giường tầng", "room_id": 3},
            {"name": "Điều hòa", "room_id": 4},
            {"name": "Giường đôi", "room_id": 4},
        ]

        for asset_data in assets_data:
            asset_obj = asset.Asset(
                name=asset_data["name"],
                room_id=asset_data["room_id"]
            )
            db.add(asset_obj)
        db.commit()

        # Create sample rented room
        rented_room_obj = rented_room.RentedRoom(
            tenant_name="Nguyễn Văn A",
            tenant_phone="0123456789",
            number_of_tenants=2,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=365),
            deposit=5000000,
            monthly_rent=2500000,
            initial_electricity_num=400,  # Số điện ban đầu khi ký hợp đồng
            room_id=1
        )
        db.add(rented_room_obj)
        db.commit()

        # Update room availability
        room_obj = db.query(room.Room).filter(room.Room.room_id == 1).first()
        room_obj.is_available = False
        db.commit()

        # Create sample invoice
        invoice_obj = invoice.Invoice(
            price=3500000,  # Giá thuê
            #Dịch vụ
            water_price=100000, # Giá nước
            internet_price=200000, # Giá internet
            general_price=50000, # Giá dịch vụ chung
            electricity_price=150000, # Giá điện
            electricity_num=150,
            water_num=10,
            due_date=datetime.now() + timedelta(days=30),
            rr_id=rented_room_obj.rr_id
        )
        db.add(invoice_obj)
        db.commit()

        print("Database initialized successfully!")
        print("Owner user: owner@example.com / owner123")

    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()

