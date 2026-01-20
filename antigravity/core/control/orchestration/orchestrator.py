import logging
import os
from antigravity.core.mixins import StatsMixin
from typing import Dict, Optional

from .analytics import AnalyticsTracker
from .circuit_breaker import CircuitBreaker
from .feature_flags import FeatureFlag, FeatureFlagManager
from .redis_client import REDIS_AVAILABLE, RedisClient

logger = logging.getLogger(__name__)

class EnhancedControlCenter(StatsMixin):
    """Enhanced control center orchestrating all control subsystems."""

    def __init__(self, redis_url: Optional[str] = None):
        """
        Initialize enhanced control center.
        """
        self.redis_client: Optional[RedisClient] = None
        self.redis_available = False

        if REDIS_AVAILABLE:
            try:
                url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379")
                self.redis_client = RedisClient(url)
                self.redis_available = self.redis_client.health_check()
                logger.info("Redis connection established")
            except Exception as e:
                logger.error(f"Redis initialization failed: {e}")

        # Initialize subsystems
        self.feature_flags = FeatureFlagManager(self.redis_client)
        self.analytics = AnalyticsTracker(self.redis_client)
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}

        logger.info("EnhancedControlCenter initialized")

    def set_feature_flag(
        self,
        flag_name: str,
        enabled: bool,
        rollout_percentage: int = 100,
        user_whitelist: Optional[list] = None,
        metadata: Optional[Dict] = None,
    ) -> FeatureFlag:
        """Set feature flag with advanced targeting."""
        return self.feature_flags.set_flag(
            name=flag_name,
            enabled=enabled,
            rollout_percentage=rollout_percentage,
            user_whitelist=user_whitelist,
            metadata=metadata,
        )

    def is_feature_enabled(self, flag_name: str, user_id: Optional[str] = None) -> bool:
        """Check if feature is enabled for user."""
        is_enabled = self.feature_flags.is_enabled(flag_name, user_id)

        # Track usage
        if user_id:
            self.analytics.track(
                event_name=f"feature_{flag_name}",
                user_id=user_id,
                properties={"enabled": is_enabled},
            )

        return is_enabled

    def track_event(
        self, event_name: str, user_id: str, properties: Optional[Dict[str, object]] = None
    ):
        """Track an analytics event."""
        return self.analytics.track(event_name, user_id, properties)

    def get_circuit_breaker(
        self,
        name: str,
        failure_threshold: int = 5,
        timeout: int = 60,
        success_threshold: int = 2,
    ) -> CircuitBreaker:
        """Get or create a circuit breaker."""
        if name not in self.circuit_breakers:
            self.circuit_breakers[name] = CircuitBreaker(
                failure_threshold=failure_threshold,
                timeout=timeout,
                success_threshold=success_threshold,
            )
            logger.info(f"Created circuit breaker: {name}")

        return self.circuit_breakers[name]

    def _collect_stats(self) -> Dict[str, object]:
        """Get comprehensive control center statistics."""
        stats = {
            "redis_available": self.redis_available,
            "feature_flags": {
                "total": len(self.feature_flags.list_flags()),
                "flags": {
                    name: {"enabled": flag.enabled, "rollout": flag.rollout_percentage}
                    for name, flag in self.feature_flags.list_flags().items()
                },
            },
            "analytics": self.analytics.get_summary(),
            "circuit_breakers": {
                name: breaker.get_stats() for name, breaker in self.circuit_breakers.items()
            },
        }
        return stats

    def close(self):
        """Cleanup resources."""
        self.analytics.flush()
        if self.redis_client:
            self.redis_client.close()
        logger.info("EnhancedControlCenter closed")
