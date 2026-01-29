import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from backend.core.infrastructure.redis import redis_client
from backend.db.session import SessionLocal
from backend.models.rate_limit import IpBlocklist

logger = logging.getLogger(__name__)


class IpBlocker:
    """
    Manages IP blocklist using Redis for high performance and PostgreSQL for persistence.
    """

    REDIS_PREFIX = "rate_limit:blocked_ip:"
    CACHE_TTL = 3600  # 1 hour cache in Redis

    def __init__(self):
        self.redis = redis_client

    async def is_blocked(self, ip_address: str) -> bool:
        """
        Check if an IP is blocked.
        """
        key = f"{self.REDIS_PREFIX}{ip_address}"

        # 1. Check Redis
        blocked = await self.redis.get(key)
        if blocked:
            return True

        # 2. Check Database (if not in Redis but might be persistent)
        # Note: Ideally we pre-warm Redis or assume Redis is source of truth for active blocks.
        # Checking DB on every request is expensive. We rely on Redis for active blocking.
        # But if Redis flush happens, we might lose blocks.
        # Strategy: We assume Redis is sync'd. If we want robustness, we can check DB if Redis misses,
        # but that opens DoS vector (cache miss attack).
        # Solution: We load active blocks to Redis on startup or have a background syncer.
        # For this implementation, we will trust Redis for "fast path" blocking.

        return False

    async def block_ip(
        self,
        ip_address: str,
        reason: str = None,
        duration_seconds: int = 3600,
        created_by: str = "system",
    ):
        """
        Block an IP address.
        """
        key = f"{self.REDIS_PREFIX}{ip_address}"

        # 1. Block in Redis
        await self.redis.setex(key, duration_seconds, "1")

        # 2. Persist to DB
        expires_at = datetime.utcnow() + timedelta(seconds=duration_seconds)

        try:
            # We use a synchronous DB session here, or async if available.
            # Assuming sync session for now based on project structure.
            with SessionLocal() as db:
                # Check if already exists
                existing = db.execute(
                    select(IpBlocklist).where(IpBlocklist.ip_address == ip_address)
                ).scalar_one_or_none()

                if existing:
                    existing.expires_at = expires_at
                    existing.reason = reason
                    existing.is_active = True
                else:
                    block = IpBlocklist(
                        ip_address=ip_address,
                        reason=reason,
                        expires_at=expires_at,
                        is_active=True,
                        created_by=created_by,
                    )
                    db.add(block)

                db.commit()
                logger.info(f"Blocked IP {ip_address} for {duration_seconds}s. Reason: {reason}")

        except Exception as e:
            logger.error(f"Failed to persist IP block for {ip_address}: {e}")

    async def unblock_ip(self, ip_address: str):
        """
        Unblock an IP address.
        """
        key = f"{self.REDIS_PREFIX}{ip_address}"

        # 1. Remove from Redis
        await self.redis.delete(key)

        # 2. Update DB
        try:
            with SessionLocal() as db:
                existing = db.execute(
                    select(IpBlocklist).where(IpBlocklist.ip_address == ip_address)
                ).scalar_one_or_none()
                if existing:
                    existing.is_active = False
                    db.commit()
                    logger.info(f"Unblocked IP {ip_address}")
        except Exception as e:
            logger.error(f"Failed to update DB for unblock IP {ip_address}: {e}")

    async def get_blocked_ips(self) -> List[Dict]:
        """
        Get all currently active blocked IPs from DB.
        """
        try:
            with SessionLocal() as db:
                stmt = select(IpBlocklist).where(
                    and_(
                        IpBlocklist.is_active.is_(True),
                        (IpBlocklist.expires_at.is_(None))
                        | (IpBlocklist.expires_at > datetime.utcnow()),
                    )
                )
                results = db.execute(stmt).scalars().all()
                return [
                    {
                        "ip_address": ip.ip_address,
                        "reason": ip.reason,
                        "blocked_at": ip.blocked_at,
                        "expires_at": ip.expires_at,
                    }
                    for ip in results
                ]
        except Exception as e:
            logger.error(f"Failed to fetch blocked IPs: {e}")
            return []


ip_blocker = IpBlocker()
