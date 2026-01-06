"""
Supabase Client - Core Database Connection
==========================================
"""

from typing import Optional
from supabase import create_client, Client
try:
    from .config import get_settings
except ImportError:
    from config import get_settings

class Database:
    _instance: Optional[Client] = None
    
    @classmethod
    def get_client(cls) -> Optional[Client]:
        """Get or create Supabase client singleton."""
        if cls._instance:
            return cls._instance
            
        settings = get_settings()
        
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            try:
                cls._instance = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                return cls._instance
            except Exception as e:
                print(f"⚠️ Failed to connect to Supabase: {e}")
                return None
        
        return None

def get_db() -> Optional[Client]:
    return Database.get_client()
