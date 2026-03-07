"""
Validation Logger — ROIaaS Phase 6e

Logs all license validation attempts for analytics and audit trails.
Stores to PostgreSQL license_validation_logs table.
"""

from typing import Optional, Dict, Any
from datetime import datetime, timezone
from dataclasses import dataclass
import json

from src.db.repository import LicenseRepository, get_repository
from src.db.database import get_database, DatabaseConnection


@dataclass
class ValidationLog:
    """Represents a license validation attempt.

    Attributes:
        key_id: License key ID being validated
        result: Validation result (success, failed, offline_grace, revoked, expired)
        command: Command that triggered the validation
        duration_ms: Validation duration in milliseconds
        error_type: Type of error if failed (format_error, network_error, quota_exceeded, etc.)
        offline_mode: True if validation used offline cache
        grace_period_remaining: Seconds remaining in grace period (if offline mode)
        ip_address: Client IP address (if available)
        user_agent: Client user agent (if available)
        metadata: Additional context
    """
    key_id: str
    result: str  # success, failed, offline_grace, revoked, expired
    command: str
    duration_ms: float = 0.0
    error_type: Optional[str] = None
    offline_mode: bool = False
    grace_period_remaining: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ValidationLogger:
    """Log and retrieve license validation attempts for analytics."""

    def __init__(
        self,
        repository: Optional[LicenseRepository] = None,
        db: Optional[DatabaseConnection] = None
    ) -> None:
        self._repo = repository or get_repository()
        self._db = db or get_database()

    async def log_validation(self, log: ValidationLog) -> Dict[str, Any]:
        """
        Log a validation attempt to PostgreSQL.

        Args:
            log: ValidationLog dataclass

        Returns:
            Created log record
        """
        query = """
            INSERT INTO license_validation_logs (
                key_id, result, command, duration_ms, error_type,
                offline_mode, grace_period_remaining, ip_address,
                user_agent, metadata, validated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            ) RETURNING id, created_at
        """

        metadata_json = json.dumps(log.metadata or {})

        result = await self._db.fetch_one(
            query,
            (
                log.key_id,
                log.result,
                log.command,
                log.duration_ms,
                log.error_type,
                log.offline_mode,
                log.grace_period_remaining,
                log.ip_address,
                log.user_agent,
                metadata_json,
                datetime.now(timezone.utc),
            )
        )

        return dict(result) if result else {}

    async def get_validations_by_key(
        self,
        key_id: str,
        days: int = 30,
        limit: int = 100
    ) -> list[Dict[str, Any]]:
        """
        Get validation history for a specific key.

        Args:
            key_id: License key ID
            days: Number of days to look back
            limit: Max records to return

        Returns:
            List of validation log records
        """
        # Validate days parameter to prevent SQL injection
        if not isinstance(days, int) or days < 0 or days > 365:
            raise ValueError("days must be an integer between 0 and 365")

        query = f"""
            SELECT * FROM license_validation_logs
            WHERE key_id = $1
              AND validated_at >= CURRENT_TIMESTAMP - INTERVAL '{days} days'
            ORDER BY validated_at DESC
            LIMIT $2
        """

        results = await self._db.fetch_all(query, (key_id, limit))
        return [dict(row) for row in results]

    async def get_validation_stats(
        self,
        key_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get validation statistics for analytics dashboard.

        Args:
            key_id: License key ID
            days: Number of days to analyze

        Returns:
            Statistics dictionary
        """
        # Validate days parameter to prevent SQL injection
        if not isinstance(days, int) or days < 0 or days > 365:
            raise ValueError("days must be an integer between 0 and 365")

        # Total validations
        total_query = f"""
            SELECT COUNT(*) as total
            FROM license_validation_logs
            WHERE key_id = $1
              AND validated_at >= CURRENT_TIMESTAMP - INTERVAL '{days} days'
        """
        total_result = await self._db.fetch_one(total_query, (key_id,))
        total = total_result["total"] if total_result else 0

        # Success rate
        success_query = f"""
            SELECT COUNT(*) as success_count
            FROM license_validation_logs
            WHERE key_id = $1
              AND result = 'success'
              AND validated_at >= CURRENT_TIMESTAMP - INTERVAL '{days} days'
        """
        success_result = await self._db.fetch_one(success_query, (key_id,))
        success_count = success_result["success_count"] if success_result else 0

        success_rate = (success_count / total * 100) if total > 0 else 0

        # Offline mode usage
        offline_query = f"""
            SELECT COUNT(*) as offline_count
            FROM license_validation_logs
            WHERE key_id = $1
              AND offline_mode = true
              AND validated_at >= CURRENT_TIMESTAMP - INTERVAL '{days} days'
        """
        offline_result = await self._db.fetch_one(offline_query, (key_id,))
        offline_count = offline_result["offline_count"] if offline_result else 0

        # By result type
        result_query = f"""
            SELECT result, COUNT(*) as count
            FROM license_validation_logs
            WHERE key_id = $1
              AND validated_at >= CURRENT_TIMESTAMP - INTERVAL '{days} days'
            GROUP BY result
            ORDER BY count DESC
        """
        result_results = await self._db.fetch_all(result_query, (key_id,))
        by_result = {row["result"]: row["count"] for row in result_results}

        # By error type
        error_query = f"""
            SELECT error_type, COUNT(*) as count
            FROM license_validation_logs
            WHERE key_id = $1
              AND error_type IS NOT NULL
              AND validated_at >= CURRENT_TIMESTAMP - INTERVAL '{days} days'
            GROUP BY error_type
            ORDER BY count DESC
        """
        error_results = await self._db.fetch_all(error_query, (key_id,))
        by_error = {row["error_type"]: row["count"] for row in error_results}

        # Last validation
        last_query = """
            SELECT * FROM license_validation_logs
            WHERE key_id = $1
            ORDER BY validated_at DESC
            LIMIT 1
        """
        last_result = await self._db.fetch_one(last_query, (key_id,))
        last_validation = dict(last_result) if last_result else None

        # Average duration
        avg_duration_query = f"""
            SELECT AVG(duration_ms) as avg_duration
            FROM license_validation_logs
            WHERE key_id = $1
              AND validated_at >= CURRENT_TIMESTAMP - INTERVAL '{days} days'
        """
        avg_result = await self._db.fetch_one(avg_duration_query, (key_id,))
        avg_duration = avg_result["avg_duration"] if avg_result else 0

        return {
            "key_id": key_id,
            "total_validations": total,
            "success_count": success_count,
            "success_rate": round(success_rate, 2),
            "offline_count": offline_count,
            "offline_percentage": round((offline_count / total * 100) if total > 0 else 0, 2),
            "by_result": by_result,
            "by_error": by_error,
            "last_validation": last_validation,
            "avg_duration_ms": round(avg_duration, 2),
            "period_days": days,
        }

    async def get_recent_validations(
        self,
        limit: int = 500,
        hours: int = 24
    ) -> list[Dict[str, Any]]:
        """
        Get recent validations across all keys for admin dashboard.

        Args:
            limit: Max records to return
            hours: Number of hours to look back

        Returns:
            List of recent validation logs
        """
        query = f"""
            SELECT * FROM license_validation_logs
            WHERE validated_at >= CURRENT_TIMESTAMP - INTERVAL '{hours} hours'
            ORDER BY validated_at DESC
            LIMIT $1
        """

        results = await self._db.fetch_all(query, (limit,))
        return [dict(row) for row in results]

    async def get_failed_validations(
        self,
        key_id: str,
        days: int = 7,
        limit: int = 50
    ) -> list[Dict[str, Any]]:
        """
        Get failed validations for a specific key.

        Args:
            key_id: License key ID
            days: Number of days to look back
            limit: Max records to return

        Returns:
            List of failed validation logs
        """
        query = f"""
            SELECT * FROM license_validation_logs
            WHERE key_id = $1
              AND result != 'success'
              AND validated_at >= CURRENT_TIMESTAMP - INTERVAL '{days} days'
            ORDER BY validated_at DESC
            LIMIT $2
        """

        results = await self._db.fetch_all(query, (key_id, limit))
        return [dict(row) for row in results]


# Singleton instance
_logger: Optional[ValidationLogger] = None


def get_logger() -> ValidationLogger:
    """Get global validation logger instance."""
    global _logger
    if _logger is None:
        _logger = ValidationLogger()
    return _logger


async def log_validation(log: ValidationLog) -> Dict[str, Any]:
    """Log a validation attempt."""
    return await get_logger().log_validation(log)


async def get_validation_stats(key_id: str, days: int = 30) -> Dict[str, Any]:
    """Get validation statistics for a key."""
    return await get_logger().get_validation_stats(key_id, days)


__all__ = [
    "ValidationLogger",
    "ValidationLog",
    "get_logger",
    "log_validation",
    "get_validation_stats",
]
