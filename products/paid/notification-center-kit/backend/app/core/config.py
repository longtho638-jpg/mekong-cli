import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Notification Center Kit"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite+aiosqlite:///./notifications.db"
    SECRET_KEY: str = os.getenv("JWT_SECRET", "development_secret_key_change_this")
    # CORS: Restrict origins in production via CORS_ORIGINS env var
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

    class Config:
        env_file = ".env"

settings = Settings()
