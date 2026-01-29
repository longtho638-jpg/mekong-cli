import logging
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import desc, func, select

from backend.core.infrastructure.redis import redis_client
from backend.db.session import SessionLocal
from backend.models.rate_limit import RateLimitViolation

logger = logging.getLogger(__name__)


class RateLimitMonitor:
    """
    Monitors rate limit violations, logs them, and detects DDoS patterns.
    """

    def __init__(self):
        self.redis = redis_client

    async def log_violation(
        self,
        ip_address: str,
        violation_type: str,
        endpoint: str,
        user_id: Optional[str] = None,
        headers: Optional[Dict[str, Any]] = None,
    ):
        """
        Log a rate limit violation to DB and check for blocking triggers.
        """
        try:
            # 1. Persist violation
            with SessionLocal() as db:
                violation = RateLimitViolation(
                    ip_address=ip_address,
                    user_id=user_id,
                    endpoint=endpoint,
                    violation_type=violation_type,
                    request_headers=headers,
                )
                db.add(violation)
                db.commit()

            # 2. Check for auto-block trigger (DDoS protection)
            # Logic: If > N violations in X minutes, block IP
            await self._check_ddos_threshold(ip_address)

        except Exception as e:
            logger.error(f"Failed to log rate limit violation: {e}")

    async def _check_ddos_threshold(self, ip_address: str):
        """
        Check if IP should be auto-blocked.
        """
        # We use Redis for fast counting
        key = f"rate_limit:violations:{ip_address}"

        # Increment violation count
        count = await self.redis.incr(key)

        # Set expiry on first increment (e.g., 5 minutes window)
        if count == 1:
            await self.redis.expire(key, 300)  # 5 minutes

        # Thresholds
        BLOCK_THRESHOLD = 50  # 50 violations in 5 minutes

        if count >= BLOCK_THRESHOLD:
            from backend.services.ip_blocker import ip_blocker

            # Check if already blocked to avoid redundant DB writes
            if not await ip_blocker.is_blocked(ip_address):
                logger.warning(
                    f"AUTO-BLOCKING IP {ip_address} due to excessive rate limit violations ({count})."
                )
                await ip_blocker.block_ip(
                    ip_address=ip_address,
                    reason="Excessive rate limit violations (DDoS protection)",
                    duration_seconds=3600,  # Block for 1 hour
                    created_by="system_monitor",
                )

    async def get_recent_violations(self, limit: int = 100):
        """
        Get recent violations for admin dashboard.
        """
        try:
            with SessionLocal() as db:
                stmt = (
                    select(RateLimitViolation)
                    .order_by(desc(RateLimitViolation.timestamp))
                    .limit(limit)
                )
                results = db.execute(stmt).scalars().all()
                return results
        except Exception as e:
            logger.error(f"Failed to fetch violations: {e}")
            return []


rate_limit_monitor = RateLimitMonitor()
