"""
⚙️ Agency OS - Core Configuration
=================================

Centralized configuration management using Pydantic V2. 
Loads and validates settings from environment variables and .env files.

Modules:
- 🏗️ Infrastructure: Supabase credentials.
- 🤖 AI Providers: OpenAI, Gemini, Anthropic, OpenRouter.
- 💰 Finance: Stripe keys.
- 💬 Comms: Telegram bot tokens.

Binh Pháp: 📋 Pháp (Process) - Maintaining the order through validated settings.
"""

import logging
from functools import lru_cache
from typing import Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    """
    ⚙️ System Configuration
    
    The single source of truth for all operational parameters.
    Supports auto-validation and environment variable mapping.
    """
    # --- Base Metadata ---
    APP_NAME: str = Field(default="Mekong Agency OS", description="Official agency name")
    ENV: str = Field(default="development", description="Execution environment (dev/prod)")
    VERSION: str = Field(default="2.5.0", description="System version")

    # --- Cloud Infrastructure (Supabase) ---
    SUPABASE_URL: Optional[str] = Field(default=None, description="Supabase project URL")
    SUPABASE_KEY: Optional[str] = Field(default=None, description="Supabase service role or anon key")

    # --- AI Intelligence Providers ---
    OPENAI_API_KEY: Optional[str] = Field(default=None, description="OpenAI API access key")
    GEMINI_API_KEY: Optional[str] = Field(default=None, description="Google Gemini API access key")
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None, description="Anthropic API access key")
    OPENROUTER_API_KEY: Optional[str] = Field(default=None, description="OpenRouter API access key")
    ELEVENLABS_API_KEY: Optional[str] = Field(default=None, description="ElevenLabs voice synthesis key")

    # --- Finance & Notifications ---
    STRIPE_SECRET_KEY: Optional[str] = Field(default=None, description="Stripe secret key for billing")
    TELEGRAM_BOT_TOKEN: Optional[str] = Field(default=None, description="Telegram bot API token")
    TELEGRAM_CHAT_ID: Optional[str] = Field(default=None, description="Default notification chat ID")

    # --- Template Repositories ---
    TEMPLATE_REPO_STARTER: str = "https://github.com/longtho638-jpg/hybrid-agent-template.git"
    TEMPLATE_REPO_PRO: str = "https://github.com/longtho638-jpg/mekong-template-pro.git"

    # Pydantic V2 Settings
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @field_validator("SUPABASE_URL", mode="before")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        """Ensures the Supabase URL is properly formatted."""
        if v and not v.startswith("http"):
            logger.error(f"Invalid SUPABASE_URL: {v}")
            raise ValueError("URL must start with http/https")
        return v


@lru_cache
def get_settings() -> Settings:
    """
    Initializes and returns a cached singleton Settings instance.
    Logs critical warnings if core infrastructure is unconfigured.
    """
    settings = Settings()

    # Connectivity Checks
    if not settings.SUPABASE_URL:
        logger.warning("⚠️ SUPABASE_URL not configured. Database features may be disabled.")
    if not settings.GEMINI_API_KEY:
        logger.info("ℹ️ GEMINI_API_KEY missing. AI features will default to mock data.")

    return settings


if __name__ == "__main__":
    # Manual verification
    s = get_settings()
    print(f"🚀 {s.APP_NAME} v{s.VERSION} configured in {s.ENV} mode.")
