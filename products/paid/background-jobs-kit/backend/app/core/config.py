from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Background Jobs Kit"
    REDIS_URL: str = "redis://localhost:6379/0"
    QUEUE_NAME: str = "default"

    class Config:
        env_file = ".env"

settings = Settings()
