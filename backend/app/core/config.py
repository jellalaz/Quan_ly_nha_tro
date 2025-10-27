from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Cấu hình ứng dụng - Tất cả giá trị được load từ file .env
    """

    database_url: str

    secret_key: str
    algorithm: str
    access_token_expire_minutes: int

    gemini_api_key: str

    model_config = SettingsConfigDict( env_file=".env", case_sensitive=False)

settings = Settings()
