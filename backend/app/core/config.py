from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # database_url: str = "mysql+pymysql://root:Tien3859%40@localhost:3306/room_management_db"
    database_url: str = "mysql+pymysql://Jellalaz:Qn6starz%40@127.0.0.1:3306/room_management_db"
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    # Gemini AI API

    # -------->  Bỏ comment dòng dưới ra ( nếu bị comment ) để kích hoạt api_key ._.   <-------
    gemini_api_key: str = "AIzaSyCev4E5F6IT5OaOAXKwhk2xqtO-309WFB4"

    class Config:
        env_file = ".env"

settings = Settings()
