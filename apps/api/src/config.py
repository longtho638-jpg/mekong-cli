from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgencyOS Money Layer"
    API_V1_STR: str = "/v1"

    # Database
    DATABASE_URL: str

    # Stripe
    STRIPE_SECRET_KEY: str
    STRIPE_WEBHOOK_SECRET: str

    # Security
    SECRET_KEY: str = "unsafe-secret-key-for-dev"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore" # Allow extra fields in .env
    )

settings = Settings()
