"""
Violation Tracker — ROIaaS Phase 6

Tracks quota exceeded events and license violations for analytics dashboard.
Stores to PostgreSQL violation_events table for reporting and enforcement.
"""

from typing import Optional, Dict, Any
from datetime import datetime, timezone
from dataclasses import dataclass
import json

from src.db.repository import LicenseRepository, get_repository
from src.db.database import get_database, DatabaseConnection


@dataclass
class ViolationEvent:
    """Represents a quota/license violation event.

    Attributes:
        key_id: License key ID
        tier: License tier at time of violation
        command: Command that triggered violation
        violation_type: Type of violation (quota_exceeded, rate_limit, invalid_license, revoked)
        daily_used: Daily usage count at violation time
        daily_limit: Daily limit for the tier
        monthly_used: Monthly usage count at violation time
        monthly_limit: Monthly limit for the tier
        retry_after_seconds: Seconds until quota resets (if applicable)
        metadata: Additional context (IP, user agent, etc.)
    """
    key_id: str
    tier: str
    violation_type: str
    command: str
    daily_used: int = 0
    daily_limit: int = 0
    monthly_used: int = 0
    monthly_limit: int = 0
    retry_after_seconds: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class ViolationTracker:
    """Track and store license/quota violations for analytics."""

    def __init__(
        self,
        repository: Optional[LicenseRepository] = None,
        db: Optional[DatabaseConnection] = None
    ) -> None:
        self._repo = repository or get_repository()
        self._db = db or get_database()

    async def record_violation(self, violation: ViolationEvent) -> Dict[str, Any]:
        """
        Record a violation event to PostgreSQL.

        Args:
            violation: ViolationEvent dataclass

        Returns:
            Created violation record
        """
        query = """
            INSERT INTO violation_events (
                key_id, tier, violation_type, command,
                daily_used, daily_limit, monthly_used, monthly_limit,
                retry_after_seconds, metadata, occurred_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            ) RETURNING id, created_at
        """

        metadata_json = json.dumps(violation.metadata or {})

        result = await self._db.fetch_one(
            query,
            (
                violation.key_id,
                violation.tier,
                violation.violation_type,
                violation.command,
                violation.daily_used,
                violation.daily_limit,
                violation.monthly_used,
                violation.monthly_limit,
                violation.retry_after_seconds,
                metadata_json,
                datetime.now(timezone.utc),
            )
        )

        return dict(result) if result else {}

    async def get_violations_by_key(
        self,
        key_id: str,
        days: int = 30,
        limit: int = 100
    ) -> list[Dict[str, Any]]:
        """
        Get violation history for a specific key.

        Args:
            key_id: License key ID
            days: Number of days to look back
            limit: Max records to return

        Returns:
            List of violation records
        """
        # Validate days parameter to prevent SQL injection
        if not isinstance(days, int) or days < 0 or days > 365:
            raise ValueError("days must be an integer between 0 and 365")

        query = f"""
            SELECT * FROM violation_events
            WHERE key_id = $1
              AND occurred_at >= CURRENT_TIMESTAMP - INTERVAL '{days} days'
            ORDER BY occurred_at DESC
            LIMIT $2
        """

        results = await self._db.fetch_all(query, (key_id, limit))
        return [dict(row) for row in results]

    async def get_violation_summary(
        self,
        key_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get violation summary for analytics dashboard.

        Args:
            key_id: License key ID
            days: Number of days to analyze

        Returns:
            Summary statistics
        """
        # Validate days parameter to prevent SQL injection
        if not isinstance(days, int) or days < 0 or days > 365:
            raise ValueError("days must be an integer between 0 and 365")

        # Count by violation type
        type_query = f"""
            SELECT violation_type, COUNT(*) as count
            FROM violation_events
            WHERE key_id = $1
              AND occurred_at >= CURRENT_TIMESTAMP - INTERVAL '{days} days'
            GROUP BY violation_type
        """

        type_results = await self._db.fetch_all(type_query, (key_id,))
        violations_by_type = {row["violation_type"]: row["count"] for row in type_results}

        # Total count
        total_query = f"""
            SELECT COUNT(*) as total
            FROM violation_events
            WHERE key_id = $1
              AND occurred_at >= CURRENT_TIMESTAMP - INTERVAL '{days} days'
        """

        total_result = await self._db.fetch_one(total_query, (key_id,))
        total = total_result["total"] if total_result else 0

        # Last violation
        last_query = """
            SELECT * FROM violation_events
            WHERE key_id = $1
            ORDER BY occurred_at DESC
            LIMIT 1
        """

        last_result = await self._db.fetch_one(last_query, (key_id,))
        last_violation = dict(last_result) if last_result else None

        return {
            "key_id": key_id,
            "total_violations": total,
            "violations_by_type": violations_by_type,
            "last_violation": last_violation,
            "period_days": days,
        }

    async def get_all_violations(
        self,
        days: int = 7,
        limit: int = 500
    ) -> list[Dict[str, Any]]:
        """
        Get all recent violations for admin dashboard.

        Args:
            days: Number of days to look back
            limit: Max records to return

        Returns:
            List of violation records
        """
        query = f"""
            SELECT * FROM violation_events
            WHERE occurred_at >= CURRENT_TIMESTAMP - INTERVAL '{days} days'
            ORDER BY occurred_at DESC
            LIMIT $1
        """

        results = await self._db.fetch_all(query, (limit,))
        return [dict(row) for row in results]


# Singleton instance
_tracker: Optional[ViolationTracker] = None


def get_tracker() -> ViolationTracker:
    """Get global violation tracker instance."""
    global _tracker
    if _tracker is None:
        _tracker = ViolationTracker()
    return _tracker


async def record_violation(violation: ViolationEvent) -> Dict[str, Any]:
    """Record a violation event."""
    return await get_tracker().record_violation(violation)


__all__ = [
    "ViolationTracker",
    "ViolationEvent",
    "get_tracker",
    "record_violation",
]
