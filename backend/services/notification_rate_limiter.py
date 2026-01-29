"""
Notification Rate Limiter
=========================

Prevents notification spam using Token Bucket algorithm.
Per-user and system-wide limits.
"""

import json
import logging
import time
from typing import Dict, Optional, Tuple

from backend.services.redis_client import redis_service

logger = logging.getLogger(__name__)


class NotificationRateLimiter:
    def __init__(self):
        # Configuration
        self.limits = {
            "email": {"rate": 5, "per": 60},  # 5 emails per minute
            "push": {"rate": 10, "per": 60},  # 10 pushes per minute
            "sms": {"rate": 1, "per": 60},  # 1 SMS per minute
        }
        self.redis = redis_service

    async def check_limit(self, user_id: str, channel: str) -> bool:
        """
        Check if user is allowed to send notification on channel.
        Returns True if allowed, False if limited.
        Uses Redis for distributed rate limiting (Token Bucket).
        """
        limit_config = self.limits.get(channel)
        if not limit_config:
            return True  # No limit for this channel

        rate = limit_config["rate"]
        period = limit_config["per"]

        key = f"rate_limit:{user_id}:{channel}"
        now = time.time()

        try:
            # Get current bucket state from Redis
            # Stored as "tokens:last_update_timestamp"
            data = await self.redis.get(key)

            if data:
                tokens, last_update = map(float, data.split(":"))
            else:
                tokens = float(rate)
                last_update = now

            # Refill tokens
            elapsed = now - last_update
            refill = (elapsed / period) * rate
            tokens = min(float(rate), tokens + refill)

            if tokens >= 1.0:
                tokens -= 1.0
                # Update Redis
                await self.redis.set(key, f"{tokens}:{now}", expire=period * 2)
                return True
            else:
                # Update time but keep tokens low to prevent accumulation during spam
                # Actually, standard token bucket doesn't update time on fail usually to allow refill,
                # but updating allows accurate calculation of "current tokens" at next check.
                # We'll just update the state to reflect current reality.
                await self.redis.set(key, f"{tokens}:{now}", expire=period * 2)
                logger.warning(f"Rate limit exceeded for {user_id} on {channel}")
                return False

        except Exception as e:
            logger.error(f"Rate limiter error: {e}")
            # Fail open to ensure critical notifications still go through if Redis fails
            return True


# Global instance
_rate_limiter = NotificationRateLimiter()


def get_notification_rate_limiter():
    return _rate_limiter
