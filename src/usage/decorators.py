"""
Usage Tracking Decorators — ROIaaS Phase 4

Decorator pattern for automatic command/feature tracking.
"""

import functools
import os
from typing import Optional, Callable, Any

from src.config.logging_config import get_logger
from src.usage.usage_tracker import get_tracker, UsageTracker


logger = get_logger(__name__)


def track_usage(
    event_type: str = "command",
    feature_tag: Optional[str] = None,
    tracker: Optional[UsageTracker] = None,
) -> Callable:
    """
    Decorator to track command or feature usage.

    Args:
        event_type: 'command' or 'feature'
        feature_tag: Feature identifier (required if event_type='feature')
        tracker: UsageTracker instance (defaults to global)

    Returns:
        Decorated function with tracking

    Example:
        @track_usage()
        async def cook(recipe: str):
            ...

        @track_usage(event_type='feature', feature_tag='bmc')
        async def binh_phap_analysis():
            ...
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Extract license key from environment
            license_key = os.getenv("RAAS_LICENSE_KEY")
            license_key_id = os.getenv("RAAS_LICENSE_KEY_ID")

            # Get tracker
            tracker_instance = tracker or get_tracker()

            # Determine what to track
            if event_type == "command":
                command_name = func.__name__
                if license_key_id:
                    try:
                        await tracker_instance.track_command(
                            key_id=license_key_id,
                            command=command_name,
                            license_key=license_key,
                            metadata={
                                "function": f"{func.__module__}.{func.__name__}",
                            },
                        )
                    except Exception as e:
                        logger.warning(
                            "usage.track_command.error",
                            error=str(e),
                            command=command_name,
                        )
            elif event_type == "feature":
                if not feature_tag:
                    raise ValueError("feature_tag required for event_type='feature'")
                if license_key_id:
                    try:
                        await tracker_instance.track_feature(
                            key_id=license_key_id,
                            feature_tag=feature_tag,
                            license_key=license_key,
                            metadata={
                                "function": f"{func.__module__}.{func.__name__}",
                            },
                        )
                    except Exception as e:
                        logger.warning(
                            "usage.track_feature.error",
                            error=str(e),
                            feature_tag=feature_tag,
                        )

            # Execute original function
            return await func(*args, **kwargs)

        return wrapper
    return decorator


def track_command(
    tracker: Optional[UsageTracker] = None,
) -> Callable:
    """
    Convenience decorator for command tracking.

    Args:
        tracker: UsageTracker instance (optional)

    Returns:
        Decorated function

    Example:
        @track_command()
        async def plan(goal: str):
            ...
    """
    return track_usage(event_type="command", tracker=tracker)


def track_feature(
    feature_tag: str,
    tracker: Optional[UsageTracker] = None,
) -> Callable:
    """
    Convenience decorator for feature tracking.

    Args:
        feature_tag: Feature identifier
        tracker: UsageTracker instance (optional)

    Returns:
        Decorated function

    Example:
        @track_feature('bmc')
        async def binh_phap_menu():
            ...
    """
    return track_usage(event_type="feature", feature_tag=feature_tag, tracker=tracker)


__all__ = [
    "track_usage",
    "track_command",
    "track_feature",
]
