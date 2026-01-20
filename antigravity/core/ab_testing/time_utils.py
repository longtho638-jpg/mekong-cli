"""
AB Testing Time Utilities - Shared time constants and helpers.

Centralizes time-related calculations to avoid magic numbers
and ensure consistency across the module.
"""

# Time constants
SECONDS_PER_HOUR = 3600
SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR
SECONDS_PER_WEEK = 7 * SECONDS_PER_DAY

# Default thresholds
EARLY_STOP_THRESHOLD_DAYS = 7
MIN_ANALYSIS_DAYS = 1


def seconds_to_days(seconds: float) -> float:
    """Convert seconds to days."""
    return seconds / SECONDS_PER_DAY


def days_to_seconds(days: float) -> float:
    """Convert days to seconds."""
    return days * SECONDS_PER_DAY


def is_early_stopped(start_time: float, end_time: float) -> bool:
    """Check if test was early stopped (less than 7 days)."""
    if end_time is None:
        return False
    duration = end_time - start_time
    return duration < SECONDS_PER_WEEK


__all__ = [
    "SECONDS_PER_HOUR",
    "SECONDS_PER_DAY",
    "SECONDS_PER_WEEK",
    "EARLY_STOP_THRESHOLD_DAYS",
    "MIN_ANALYSIS_DAYS",
    "seconds_to_days",
    "days_to_seconds",
    "is_early_stopped",
]
