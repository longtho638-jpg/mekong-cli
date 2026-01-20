"""
Enhanced Control Center - Remote Config & Analytics orchestration layer (Proxy)
==============================================================================

This file is now a facade for the modularized control orchestration logic.
Please import from .orchestration.orchestrator instead.
"""
import warnings
from typing import Optional

from .orchestration.orchestrator import EnhancedControlCenter, get_control_center
from .helpers import is_feature_enabled, set_feature_flag
from .analytics import AnalyticsEvent, AnalyticsTracker
from .circuit_breaker import CircuitBreaker
from .feature_flags import FeatureFlag, FeatureFlagManager
from .redis_client import REDIS_AVAILABLE, RedisClient

# Issue a deprecation warning
warnings.warn(
    "antigravity.core.control.enhanced is deprecated. "
    "Use antigravity.core.control.orchestration.orchestrator instead.",
    DeprecationWarning,
    stacklevel=2
)
