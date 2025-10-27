from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

#Tạo kết nối đến cơ sở dữ liệu
engine = create_engine(settings.database_url)
#Tạo một lớp session để tương tác với cơ sở dữ liệu
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
#Tạo lớp cơ sở cho các mô hình ORM
Base = declarative_base()

#Tạo hàm phụ thuộc để lấy phiên làm việc cơ sở dữ liệu
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
