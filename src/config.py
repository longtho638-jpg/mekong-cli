"""Configuration loader for Mekong CLI environment variables."""

import logging
import os

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

TELEGRAM_API_TOKEN: str = os.getenv("TELEGRAM_API_TOKEN", "")

if not TELEGRAM_API_TOKEN:
    logger.warning(
        "TELEGRAM_API_TOKEN is not set. "
        "Telegram bot features will be unavailable. "
        "Add it to your .env file. See .env.example for reference."
    )
