import os
from typing import List


class Settings:
    PROJECT_NAME: str = "Agency OS"
    VERSION: str = "2.1.0"
    API_V1_STR: str = "/api"

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # CORS
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        env_origins = os.getenv("ALLOWED_ORIGINS", "")
        if env_origins:
            return [origin.strip() for origin in env_origins.split(",") if origin.strip()]

        env = os.getenv("ENVIRONMENT", "development")
        if env == "production":
            return ["https://agencyos.network", "https://www.agencyos.network"]
        elif env == "staging":
            return ["https://staging.agencyos.network"]
        else:
            return ["http://localhost:3000", "http://localhost:8000", "http://localhost:8080"]


settings = Settings()
