from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Webhook Manager Kit"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite:///./sql_app.db"

    # Security
    SECRET_KEY: str = "your-secret-key-here"  # Change in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Webhook
    WEBHOOK_SECRET: str = "webhook-secret-key"
    MAX_RETRIES: int = 3

    # Provider Secrets (for receiving webhooks)
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    GITHUB_WEBHOOK_SECRET: Optional[str] = None
    GUMROAD_WEBHOOK_SECRET: Optional[str] = None
    SHOPIFY_WEBHOOK_SECRET: Optional[str] = None

    # Redis / Queue
    REDIS_URL: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"

settings = Settings()
