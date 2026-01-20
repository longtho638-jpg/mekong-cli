"""
Viral Defense Package.

Protect the platform when traffic goes viral.
Auto-scale, degrade gracefully, never crash.
"""

import logging
from typing import Callable, Dict, List, Any

from .models import DefenseLevel, ScaleAction, ScaleTrigger, DegradationRule
from .core import ViralDefense

logger = logging.getLogger(__name__)

# Re-export classes
__all__ = [
    "ViralDefense",
    "DefenseLevel",
    "ScaleAction",
    "ScaleTrigger",
    "DegradationRule",
    "get_defense",
    "check_triggers",
    "is_feature_enabled",
    "get_defense_status",
    "degradable",
]

# Global singleton
_defense = ViralDefense()


def get_defense() -> ViralDefense:
    """Get global viral defense instance."""
    return _defense


# Convenience functions
def check_triggers(metrics: Dict) -> List[ScaleAction]:
    return _defense.check_triggers(metrics)


def is_feature_enabled(feature: str) -> bool:
    return _defense.is_feature_enabled(feature)


def get_defense_status() -> Dict:
    return _defense.get_status()


# Decorator for protected features
def degradable(feature: str):
    """Decorator for features that can be degraded."""

    def decorator(func: Callable):
        def wrapper(*args, **kwargs):
            if not _defense.is_feature_enabled(feature):
                fallback = _defense.get_fallback(feature)
                logger.info(f"Feature {feature} degraded, returning fallback")
                return fallback
            return func(*args, **kwargs)

        return wrapper

    return decorator
