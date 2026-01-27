from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Background Jobs Kit"
    REDIS_URL: str = "redis://localhost:6379/0"
    MONGO_URL: str = "mongodb://localhost:27017"
    MONGO_DB: str = "background_jobs"
    QUEUE_NAME: str = "default"
    QUEUE_BACKEND: str = "redis"  # redis or mongo

    class Config:
        env_file = ".env"

settings = Settings()
