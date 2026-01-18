"""
☁️ Usage Models - Usage Tracking Data
====================================

Data models for usage tracking and analytics.
Clean data structures with proper validation.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Optional


@dataclass
class UsageEvent:
    """Single usage event record."""

    user_id: str
    action: str
    timestamp: datetime
    agency_id: Optional[str] = None
    tokens_used: int = 0
    cost_cents: int = 0
    command: Optional[str] = None
    metadata: Optional[Dict] = None


@dataclass
class MonthlyUsage:
    """Monthly usage statistics."""

    api_calls: int = 0
    commands: int = 0
    tokens_used: int = 0
    cost_cents: int = 0


@dataclass
class UsageWarning:
    """Usage warning notification."""

    tier: str
    warnings: list
    is_critical: bool
    has_warning: bool
