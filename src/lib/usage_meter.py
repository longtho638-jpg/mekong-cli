"""
Usage Metering — ROIaaS Phase 2

Tracks and enforces usage limits per license key.
"""

import os
import json
from datetime import datetime, date
from typing import Optional, Dict
from dataclasses import dataclass, asdict
from pathlib import Path

from src.lib.license_generator import get_tier_limits, TIER_LIMITS


@dataclass
class UsageRecord:
    """Usage record for a license key."""
    key_id: str
    tier: str
    commands_today: int = 0
    last_reset: str = ""  # ISO date
    total_commands: int = 0
    created_at: str = ""

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "UsageRecord":
        return cls(**data)


class UsageMeter:
    """Track and enforce usage limits."""

    def __init__(self, storage_path: Optional[str] = None) -> None:
        """
        Initialize usage meter.

        Args:
            storage_path: Path to usage data JSON file.
                         Defaults to ~/.mekong/usage.json
        """
        if storage_path:
            self._storage_path = Path(storage_path)
        else:
            self._storage_path = Path.home() / ".mekong" / "usage.json"

        self._storage_path.parent.mkdir(parents=True, exist_ok=True)
        self._records: Dict[str, UsageRecord] = {}
        self._load()

    def _load(self) -> None:
        """Load usage records from disk."""
        if self._storage_path.exists():
            with open(self._storage_path, "r") as f:
                data = json.load(f)
                self._records = {
                    k: UsageRecord.from_dict(v) for k, v in data.items()
                }

    def _save(self) -> None:
        """Save usage records to disk."""
        with open(self._storage_path, "w") as f:
            json.dump(
                {k: v.to_dict() for k, v in self._records.items()},
                f,
                indent=2,
            )

    def _get_today(self) -> str:
        """Get today's date as ISO string."""
        return date.today().isoformat()

    def _reset_if_new_day(self, record: UsageRecord) -> None:
        """Reset daily counter if it's a new day."""
        today = self._get_today()
        if record.last_reset != today:
            record.commands_today = 0
            record.last_reset = today

    def record_usage(self, key_id: str, tier: str) -> tuple[bool, str]:
        """
        Record a command usage.

        Args:
            key_id: License key ID
            tier: License tier

        Returns:
            Tuple of (allowed, error_message)
        """
        # Get or create record
        if key_id not in self._records:
            self._records[key_id] = UsageRecord(
                key_id=key_id,
                tier=tier,
                commands_today=0,
                last_reset=self._get_today(),
                total_commands=0,
                created_at=datetime.utcnow().isoformat(),
            )

        record = self._records[key_id]
        self._reset_if_new_day(record)

        # Check limits
        limits = get_tier_limits(tier)
        max_commands = limits["commands_per_day"]

        if max_commands >= 0 and record.commands_today >= max_commands:
            return False, f"Daily limit reached: {record.commands_today}/{max_commands}"

        # Record usage
        record.commands_today += 1
        record.total_commands += 1
        self._save()

        return True, ""

    def get_usage(self, key_id: str) -> Optional[UsageRecord]:
        """Get usage record for a key."""
        return self._records.get(key_id)

    def get_usage_summary(self, key_id: str) -> dict:
        """
        Get usage summary for a key.

        Returns:
            Summary dict with today's usage, limit, and remaining
        """
        record = self._records.get(key_id)
        if not record:
            return {"error": "Key not found"}

        limits = get_tier_limits(record.tier)
        max_commands = limits["commands_per_day"]
        remaining = (
            max_commands - record.commands_today
            if max_commands >= 0
            else "unlimited"
        )

        return {
            "key_id": key_id,
            "tier": record.tier,
            "commands_today": record.commands_today,
            "daily_limit": max_commands if max_commands >= 0 else "unlimited",
            "remaining": remaining,
            "total_commands": record.total_commands,
            "last_reset": record.last_reset,
        }

    def reset_usage(self, key_id: str) -> bool:
        """Reset usage for a key."""
        if key_id in self._records:
            record = self._records[key_id]
            record.commands_today = 0
            record.total_commands = 0
            self._save()
            return True
        return False


# Global instance
_meter: Optional[UsageMeter] = None


def get_meter() -> UsageMeter:
    """Get global meter instance."""
    global _meter
    if _meter is None:
        _meter = UsageMeter()
    return _meter


def record_usage(key_id: str, tier: str) -> tuple[bool, str]:
    """Record command usage."""
    return get_meter().record_usage(key_id, tier)


def get_usage_summary(key_id: str) -> dict:
    """Get usage summary for a key."""
    return get_meter().get_usage_summary(key_id)


__all__ = [
    "UsageMeter",
    "UsageRecord",
    "get_meter",
    "record_usage",
    "get_usage_summary",
]
