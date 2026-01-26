from pydantic_settings import BaseSettings
from pydantic import PostgresDsn

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/search_db"
    API_PREFIX: str = "/api"
    PROJECT_NAME: str = "Search Index Kit"

    class Config:
        env_file = ".env"

settings = Settings()
