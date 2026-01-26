from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "AI Chatbot Starter Kit"
    APP_ENV: str = "development"
    API_V1_STR: str = "/api/v1"

    # LLM API Keys
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None

    # Vector DB
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_db"

    # Redis (Memory/Caching)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/chatbot"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
