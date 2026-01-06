from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    """
    Application Settings via Pydantic.
    Reads from .env file automatically.
    """
    APP_NAME: str = "Mekong Agency OS"
    ENV: str = "development"
    VERSION: str = "2.0.0"
    
    # Database (Supabase)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    
    # AI Providers
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    ELEVENLABS_API_KEY: Optional[str] = None
    
    # Integrations
    STRIPE_SECRET_KEY: Optional[str] = None
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_CHAT_ID: Optional[str] = None

    # Templates
    TEMPLATE_REPO_STARTER: str = "https://github.com/longtho638-jpg/hybrid-agent-template.git"
    TEMPLATE_REPO_PRO: str = "https://github.com/longtho638-jpg/mekong-template-pro.git"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache
def get_settings():
    return Settings()
