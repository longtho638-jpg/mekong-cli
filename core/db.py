"""
Supabase Client - Core Database Connection
==========================================

Centralized connection manager for agency infrastructure.
"""

import logging
from typing import Optional
from supabase import create_client, Client

try:
    from .config import get_settings
except ImportError:
    from config import get_settings

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Database:
    """
    Supabase Database Singleton Manager.
    
    Ensures a single active connection across the agency OS modules.
    """
    _instance: Optional[Client] = None
    
    @classmethod
    def get_client(cls) -> Optional[Client]:
        """Fetch or initialize the Supabase client singleton."""
        if cls._instance:
            return cls._instance
            
        settings = get_settings()
        
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                cls._instance = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                logger.info("Successfully connected to Supabase.")
                return cls._instance
            except Exception as e:
                logger.error(f"Failed to connect to Supabase: {e}")
                return None
        else:
            logger.debug("Database credentials missing. DB features disabled.")
        
        return None

def get_db() -> Optional[Client]:
    """Helper function to obtain the database client."""
    return Database.get_client()

if __name__ == "__main__":
    db = get_db()
    if db:
        print("✅ DB connection ready.")
    else:
        print("⚠️ DB disconnected.")
