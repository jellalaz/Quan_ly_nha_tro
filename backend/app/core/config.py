from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Cấu hình cho XAMPP MySQL (root user không có password)
    # database_url: str = "mysql+pymysql://root:@localhost:3306/room_management_db"
    database_url: str = "mysql+pymysql://Jellalaz:Qn6starz%40@127.0.0.1:3306/room_management_db"
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    # Gemini AI API
    gemini_api_key: str = "your-gemini-api-key-here"
    
    class Config:
        env_file = ".env"

settings = Settings()
