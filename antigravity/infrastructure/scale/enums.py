"""
Scale Infrastructure - Enums.
=============================

Scaling mode enumeration.
"""

from enum import Enum


class ScaleMode(Enum):
    """Scaling modes."""

    NORMAL = "normal"  # Standard operation
    BURST = "burst"  # Handle traffic spikes
    VIRAL = "viral"  # Maximum scale mode
    MAINTENANCE = "maintenance"  # Reduced capacity
