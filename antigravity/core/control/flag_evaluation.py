"""
Feature Flag Evaluation - Targeting and Rollout Logic
======================================================

Contains feature flag dataclass and rollout evaluation utilities.
"""

import hashlib
from dataclasses import dataclass, field
from typing import Dict, List


@dataclass
class FeatureFlag:
    """
    Feature flag configuration.

    Attributes:
        name: Unique flag identifier
        enabled: Whether feature is globally enabled
        rollout_percentage: Percentage of users to enable (0-100)
        user_whitelist: List of user IDs to always enable
        metadata: Additional configuration data
    """

    name: str
    enabled: bool
    rollout_percentage: int = 100
    user_whitelist: List[str] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)

    def __post_init__(self):
        """Validate rollout percentage."""
        if not 0 <= self.rollout_percentage <= 100:
            raise ValueError("rollout_percentage must be between 0 and 100")


def is_user_in_rollout(user_id: str, percentage: int) -> bool:
    """
    Deterministic rollout based on user_id hash.

    Args:
        user_id: User identifier
        percentage: Rollout percentage (0-100)

    Returns:
        True if user is in rollout group
    """
    if not user_id:
        return False

    # Use consistent hashing for deterministic results
    hash_val = int(hashlib.md5(user_id.encode()).hexdigest(), 16) % 100
    return hash_val < percentage
