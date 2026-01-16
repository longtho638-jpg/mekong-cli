"""
🏗️ Supabase Client - Core Database Connection
=============================================

Centralized connection manager for the Agency OS cloud infrastructure. 
Provides a singleton instance of the Supabase client for all core modules.

Usage:
    from core.db import get_db
    db = get_db()
    if db:
        db.from_('table').select('*').execute()

Binh Pháp: 🏰 Nền Tảng (Foundation) - Ensuring reliable access to the data fortress.
"""

import logging
from typing import Optional
from supabase import create_client, Client

try:
    from .config import get_settings
except (ImportError, ValueError):
    # Fallback for direct execution
    try:
        from config import get_settings
    except ImportError:
        def get_settings(): return None

# Configure logging
logger = logging.getLogger(__name__)


class Database:
    """
    🏗️ Supabase Database Manager
    
    Ensures a single active connection across the agency OS modules (Singleton).
    """
    _instance: Optional[Client] = None

    @classmethod
    def get_client(cls) -> Optional[Client]:
        """
        Initializes and returns the Supabase client singleton.
        Returns None if credentials are missing or connection fails.
        """
        if cls._instance:
            return cls._instance

        settings = get_settings()
        if not settings:
            logger.debug("Settings not available. DB connection skipped.")
            return None

        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                cls._instance = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                logger.info("✅ Successfully connected to Supabase.")
                return cls._instance
            except Exception as e:
                logger.error(f"❌ Failed to connect to Supabase: {e}")
                return None
        else:
            logger.debug("Database credentials missing in environment. DB features disabled.")

        return None


def get_db() -> Optional[Client]:
    """Helper function to obtain the shared database client."""
    return Database.get_client()


if __name__ == "__main__":
    # Manual verification
    logging.basicConfig(level=logging.INFO)
    db = get_db()
    if db:
        print("✅ DB connection ready.")
    else:
        print("⚠️ DB disconnected or credentials missing.")
