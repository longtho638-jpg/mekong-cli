"""
☁️ Rate Limiter - API Rate Limiting Service
===========================================

Service for managing API rate limits per user.
Basic in-memory implementation with room for Redis upgrade.
"""

import logging
import time
from collections import defaultdict
from typing import Dict

logger = logging.getLogger(__name__)


class RateLimiter:
    """Rate limiting service for API endpoints."""

    def __init__(self):
        # Simple in-memory rate limiting (in production, use Redis)
        self._rate_limits: Dict[str, list] = defaultdict(list)
        self._rate_limits_config = {
            "api_call": {"window_size": 60, "max_requests": 100},  # 100 requests/minute
            "command_exec": {"window_size": 60, "max_requests": 30},  # 30 commands/minute
            "video_gen": {"window_size": 3600, "max_requests": 10},  # 10 videos/hour
        }

    def check_rate_limit(self, user_id: str, action: str) -> bool:
        """Check if user is within rate limits for action."""
        config = self._rate_limits_config.get(action, self._rate_limits_config["api_call"])
        window_size = config["window_size"]
        max_requests = config["max_requests"]

        now = time.time()
        user_limits = self._rate_limits[user_id]

        # Clean old entries outside the window
        user_limits[:] = [t for t in user_limits if now - t < window_size]

        # Check if user exceeded limit
        if len(user_limits) >= max_requests:
            logger.warning(f"Rate limit exceeded for user {user_id}, action {action}")
            return False

        # Add current request timestamp
        user_limits.append(now)
        return True

    def get_remaining_requests(self, user_id: str, action: str) -> Dict:
        """Get remaining requests for user in current window."""
        config = self._rate_limits_config.get(action, self._rate_limits_config["api_call"])
        window_size = config["window_size"]
        max_requests = config["max_requests"]

        now = time.time()
        user_limits = self._rate_limits.get(user_id, [])

        # Clean old entries
        user_limits[:] = [t for t in user_limits if now - t < window_size]

        remaining = max(0, max_requests - len(user_limits))
        reset_time = max(user_limits + [now - window_size + 1]) if user_limits else now

        return {
            "remaining": remaining,
            "limit": max_requests,
            "reset_time": int(reset_time),
            "window_size": window_size,
        }

    def reset_user_limits(self, user_id: str) -> None:
        """Reset rate limits for a specific user."""
        self._rate_limits[user_id] = []

    def update_config(self, action: str, window_size: int, max_requests: int) -> None:
        """Update rate limiting configuration for an action."""
        self._rate_limits_config[action] = {
            "window_size": window_size,
            "max_requests": max_requests,
        }

    def get_config(self) -> Dict:
        """Get current rate limiting configuration."""
        return self._rate_limits_config.copy()

    def cleanup_expired_entries(self) -> None:
        """Clean up expired entries across all users."""
        now = time.time()
        max_window = max(config["window_size"] for config in self._rate_limits_config.values())

        for user_id, timestamps in self._rate_limits.items():
            self._rate_limits[user_id] = [t for t in timestamps if now - t < max_window]
