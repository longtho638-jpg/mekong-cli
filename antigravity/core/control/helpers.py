"""
Control Center Helper Functions
===============================

Convenience functions for backward compatibility and simplified access
to feature flags and control center functionality.
"""

from typing import Optional

from .feature_flags import FeatureFlag


def get_control_center_instance():
    """Get the global control center instance (lazy import to avoid circular dependencies)."""
    from .enhanced import get_control_center
    return get_control_center()


def set_feature_flag(
    flag_name: str,
    enabled: bool,
    rollout_percentage: int = 100,
    user_whitelist: Optional[list] = None,
) -> FeatureFlag:
    """
    Set feature flag (convenience function).

    Args:
        flag_name: Flag identifier
        enabled: Whether feature is enabled
        rollout_percentage: Percentage of users to enable (0-100)
        user_whitelist: List of user IDs to always enable

    Returns:
        Created/updated FeatureFlag
    """
    return get_control_center_instance().set_feature_flag(
        flag_name, enabled, rollout_percentage, user_whitelist
    )


def is_feature_enabled(flag_name: str, user_id: Optional[str] = None) -> bool:
    """
    Check if feature is enabled (convenience function).

    Args:
        flag_name: Flag identifier
        user_id: Optional user ID for targeting

    Returns:
        True if feature is enabled
    """
    return get_control_center_instance().is_feature_enabled(flag_name, user_id)
