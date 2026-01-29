import logging
import time
from datetime import datetime
from typing import Optional

from fastapi import Request, Response
from starlette.background import BackgroundTasks

from core.infrastructure.database import get_db

logger = logging.getLogger(__name__)


class ApiUsageTracker:
    """
    Service to track API usage statistics.
    Records every API call made with a valid API Key.
    """

    def __init__(self):
        self.db = get_db()

    def track_request(
        self,
        api_key_id: str,
        endpoint: str,
        method: str,
        status_code: int,
        response_time_ms: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ):
        """
        Record an API request in the database.
        Designed to be called as a background task.
        """
        try:
            data = {
                "api_key_id": api_key_id,
                "endpoint": endpoint,
                "method": method,
                "status_code": status_code,
                "response_time_ms": response_time_ms,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "created_at": datetime.utcnow().isoformat(),
            }

            # Fire and forget insert
            self.db.table("api_usage").insert(data).execute()

        except Exception as e:
            # We don't want usage tracking to fail the request if possible,
            # but we definitely want to know if it's failing.
            logger.error(f"Failed to track API usage: {e}")


# Global instance
usage_tracker = ApiUsageTracker()
