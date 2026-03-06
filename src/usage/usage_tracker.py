"""
Usage Tracker — ROIaaS Phase 4

Feature-level tracking with command/feature events, deduplication, and analytics.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import hashlib

from src.config.logging_config import get_logger
from src.db.repository import get_repository, LicenseRepository


@dataclass
class UsageEvent:
    """Represents a usage event."""
    key_id: str
    event_type: str  # 'command' or 'feature'
    event_data: Dict[str, Any]
    idempotency_key: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: Optional[datetime] = None
    license_key_hash: Optional[str] = None

    def __post_init__(self) -> None:
        """Validate and set defaults."""
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)
        if self.event_type not in ('command', 'feature'):
            raise ValueError(f"Invalid event_type: {self.event_type}. Must be 'command' or 'feature'")


class UsageTracker:
    """
    Track and analyze feature-level usage with PostgreSQL backend.

    Features:
    - Command and feature tracking
    - Deduplication via idempotency keys (24h TTL)
    - Async operations for non-blocking performance
    - Structured logging integration
    """

    def __init__(self, repository: Optional[LicenseRepository] = None) -> None:
        """
        Initialize usage tracker.

        Args:
            repository: LicenseRepository instance.
                       Defaults to global repository instance.
        """
        self._repo = repository or get_repository()
        self._logger = get_logger(__name__)

    def _generate_idempotency_key(
        self,
        key_id: str,
        event_type: str,
        event_data: Dict[str, Any],
        timestamp: Optional[datetime] = None,
    ) -> str:
        """
        Generate unique idempotency key for deduplication.

        Format: sha256(key_id + event_type + event_data_json + date)
        TTL: 24 hours (date-based)

        Args:
            key_id: License key ID
            event_type: 'command' or 'feature'
            event_data: Event-specific data
            timestamp: Event timestamp (defaults to now)

        Returns:
            SHA256 hash string (64 characters)
        """
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)

        # Use date for 24h TTL window
        date_str = timestamp.strftime("%Y-%m-%d")

        # Create deterministic string
        data_str = f"{key_id}:{event_type}:{str(event_data)}:{date_str}"

        # Generate SHA256 hash
        return hashlib.sha256(data_str.encode()).hexdigest()

    def _hash_license_key(self, license_key: str) -> str:
        """
        Hash license key for privacy.

        Args:
            license_key: Raw license key

        Returns:
            SHA256 hash string
        """
        return hashlib.sha256(license_key.encode()).hexdigest()

    async def _check_duplicate(
        self,
        idempotency_key: str,
        ttl_hours: int = 24,
    ) -> bool:
        """
        Check if event is a duplicate within TTL window.

        Args:
            idempotency_key: Key to check
            ttl_hours: Time-to-live in hours

        Returns:
            True if duplicate, False if new
        """
        return await self._repo.check_idempotency_key(idempotency_key, ttl_hours)

    async def track_command(
        self,
        key_id: str,
        command: str,
        license_key: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
    ) -> tuple[bool, str]:
        """
        Track command execution.

        Args:
            key_id: License key ID
            command: Command name (e.g., 'cook', 'plan', 'gateway')
            license_key: Raw license key for hashing (optional)
            metadata: Additional metadata (exit_code, duration, etc.)
            timestamp: When the event occurred (defaults to now)

        Returns:
            Tuple of (success, message)
        """
        # Hash license key if provided
        license_key_hash = ""
        if license_key:
            license_key_hash = self._hash_license_key(license_key)
        elif metadata and metadata.get("license_key_hash"):
            license_key_hash = metadata["license_key_hash"]

        # Build event data
        event_data = {
            "command": command,
        }

        # Add metadata
        event_metadata = metadata or {}
        event_metadata["source"] = "command"

        # Generate idempotency key
        idempotency_key = self._generate_idempotency_key(
            key_id, "command", event_data, timestamp
        )

        # Check for duplicate
        is_duplicate = await self._check_duplicate(idempotency_key)
        if is_duplicate:
            self._logger.debug(
                "usage.duplicate",
                key_id=key_id,
                command=command,
                idempotency_key=idempotency_key[:16],
            )
            return True, "Duplicate ignored"

        # Create event
        result = await self._repo.create_usage_event(
            key_id=key_id,
            license_key_hash=license_key_hash,
            event_type="command",
            event_data=event_data,
            idempotency_key=idempotency_key,
            metadata=event_metadata,
        )

        if result:
            self._logger.info(
                "usage.command_tracked",
                key_id=key_id,
                command=command,
                event_id=result.get("id"),
            )
            return True, "Command tracked"
        else:
            # Duplicate in database (ON CONFLICT)
            self._logger.debug(
                "usage.duplicate_db",
                key_id=key_id,
                command=command,
            )
            return True, "Duplicate ignored"

    async def track_feature(
        self,
        key_id: str,
        feature_tag: str,
        license_key: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
    ) -> tuple[bool, str]:
        """
        Track feature usage.

        Args:
            key_id: License key ID
            feature_tag: Feature identifier (e.g., 'bmc', 'agent-mode', 'sse')
            license_key: Raw license key for hashing (optional)
            metadata: Additional metadata
            timestamp: When the event occurred (defaults to now)

        Returns:
            Tuple of (success, message)
        """
        # Hash license key if provided
        license_key_hash = ""
        if license_key:
            license_key_hash = self._hash_license_key(license_key)
        elif metadata and metadata.get("license_key_hash"):
            license_key_hash = metadata["license_key_hash"]

        # Build event data
        event_data = {
            "feature_tag": feature_tag,
        }

        # Add metadata
        event_metadata = metadata or {}
        event_metadata["source"] = "feature"

        # Generate idempotency key
        idempotency_key = self._generate_idempotency_key(
            key_id, "feature", event_data, timestamp
        )

        # Check for duplicate
        is_duplicate = await self._check_duplicate(idempotency_key)
        if is_duplicate:
            self._logger.debug(
                "usage.duplicate",
                key_id=key_id,
                feature_tag=feature_tag,
                idempotency_key=idempotency_key[:16],
            )
            return True, "Duplicate ignored"

        # Create event
        result = await self._repo.create_usage_event(
            key_id=key_id,
            license_key_hash=license_key_hash,
            event_type="feature",
            event_data=event_data,
            idempotency_key=idempotency_key,
            metadata=event_metadata,
        )

        if result:
            self._logger.info(
                "usage.feature_tracked",
                key_id=key_id,
                feature_tag=feature_tag,
                event_id=result.get("id"),
            )
            return True, "Feature tracked"
        else:
            self._logger.debug(
                "usage.duplicate_db",
                key_id=key_id,
                feature_tag=feature_tag,
            )
            return True, "Duplicate ignored"

    async def get_usage_summary(
        self,
        key_id: str,
        days: int = 30,
    ) -> Dict[str, Any]:
        """
        Get usage summary for a key.

        Args:
            key_id: License key ID
            days: Number of days to summarize

        Returns:
            Summary dict with command counts, feature usage, etc.
        """
        events = await self._repo.get_usage_events(key_id, days)

        command_count = 0
        feature_count = 0
        commands: Dict[str, int] = {}
        features: Dict[str, int] = {}

        for event in events:
            event_type = event.get("event_type")
            event_data = event.get("event_data", {})

            if event_type == "command":
                command_count += 1
                cmd = event_data.get("command", "unknown")
                commands[cmd] = commands.get(cmd, 0) + 1
            elif event_type == "feature":
                feature_count += 1
                tag = event_data.get("feature_tag", "unknown")
                features[tag] = features.get(tag, 0) + 1

        return {
            "key_id": key_id,
            "period_days": days,
            "total_events": len(events),
            "command_count": command_count,
            "feature_count": feature_count,
            "commands": commands,
            "features": features,
            "top_commands": sorted(commands.items(), key=lambda x: x[1], reverse=True)[:10],
            "top_features": sorted(features.items(), key=lambda x: x[1], reverse=True)[:10],
        }

    async def cleanup_old_events(self, older_than_days: int = 90) -> int:
        """
        Clean up old usage events.

        Args:
            older_than_days: Delete events older than this

        Returns:
            Number of records deleted
        """
        deleted = await self._repo.cleanup_expired_events(older_than_days)
        self._logger.info(
            "usage.cleanup",
            older_than_days=older_than_days,
            deleted_count=deleted,
        )
        return deleted


# Global instance
_tracker: Optional[UsageTracker] = None


def get_tracker() -> UsageTracker:
    """Get global usage tracker instance."""
    global _tracker
    if _tracker is None:
        _tracker = UsageTracker()
    return _tracker


async def track_command(
    key_id: str,
    command: str,
    license_key: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> tuple[bool, str]:
    """Track command execution."""
    return await get_tracker().track_command(key_id, command, license_key, metadata)


async def track_feature(
    key_id: str,
    feature_tag: str,
    license_key: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> tuple[bool, str]:
    """Track feature usage."""
    return await get_tracker().track_feature(key_id, feature_tag, license_key, metadata)


__all__ = [
    "UsageEvent",
    "UsageTracker",
    "get_tracker",
    "track_command",
    "track_feature",
]
