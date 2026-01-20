"""
Feature Flags - A/B Testing & Rollout Management
=================================================

Provides feature flag management with:
- User targeting and whitelisting
- Gradual rollout (percentage-based)
- Redis-backed persistence
- In-memory caching
"""

import logging
from typing import Dict, List, Optional

from .flag_evaluation import FeatureFlag, is_user_in_rollout
from .redis_client import RedisClient

logger = logging.getLogger(__name__)


class FeatureFlagManager:
    """Feature flag management with Redis backend."""

    def __init__(self, redis_client: Optional[RedisClient] = None):
        """
        Initialize feature flag manager.

        Args:
            redis_client: Optional Redis client for persistence
        """
        self.redis = redis_client
        self.cache: Dict[str, FeatureFlag] = {}
        logger.info("FeatureFlagManager initialized")

    def set_flag(
        self,
        name: str,
        enabled: bool,
        rollout_percentage: int = 100,
        user_whitelist: Optional[List[str]] = None,
        metadata: Optional[Dict] = None,
    ) -> FeatureFlag:
        """
        Create or update a feature flag.

        Args:
            name: Flag identifier
            enabled: Whether feature is enabled
            rollout_percentage: Percentage of users to enable (0-100)
            user_whitelist: List of user IDs to always enable
            metadata: Additional configuration

        Returns:
            Created/updated FeatureFlag
        """
        flag = FeatureFlag(
            name=name,
            enabled=enabled,
            rollout_percentage=rollout_percentage,
            user_whitelist=user_whitelist or [],
            metadata=metadata or {},
        )

        # Update cache
        self.cache[name] = flag

        # Persist to Redis if available
        if self.redis:
            flag_data = {
                "enabled": flag.enabled,
                "rollout_percentage": flag.rollout_percentage,
                "user_whitelist": flag.user_whitelist,
                "metadata": flag.metadata,
            }
            self.redis.set(f"feature_flag:{name}", flag_data, ttl=3600)

        logger.info(f"Feature flag set: {name} (enabled={enabled}, rollout={rollout_percentage}%)")
        return flag

    def is_enabled(self, flag_name: str, user_id: Optional[str] = None) -> bool:
        """
        Check if feature is enabled for user.

        Args:
            flag_name: Flag identifier
            user_id: Optional user ID for targeting

        Returns:
            True if feature is enabled for this user
        """
        flag = self._get_flag(flag_name)
        if not flag:
            logger.debug(f"Feature flag not found: {flag_name}")
            return False

        # Check if globally disabled
        if not flag.enabled:
            return False

        # Check whitelist first (highest priority)
        if user_id and flag.user_whitelist and user_id in flag.user_whitelist:
            logger.debug(f"Feature {flag_name} enabled for whitelisted user: {user_id}")
            return True

        # Check rollout percentage
        if flag.rollout_percentage < 100:
            if not user_id:
                return False
            return is_user_in_rollout(user_id, flag.rollout_percentage)

        return True

    def get_flag(self, flag_name: str) -> Optional[FeatureFlag]:
        """Get feature flag configuration."""
        return self._get_flag(flag_name)

    def delete_flag(self, flag_name: str) -> bool:
        """Delete a feature flag."""
        if flag_name in self.cache:
            del self.cache[flag_name]
        if self.redis:
            self.redis.delete(f"feature_flag:{flag_name}")
        logger.info(f"Feature flag deleted: {flag_name}")
        return True

    def list_flags(self) -> Dict[str, FeatureFlag]:
        """Get all feature flags."""
        return self.cache.copy()

    def _get_flag(self, name: str) -> Optional[FeatureFlag]:
        """Get flag from cache or Redis."""
        if name in self.cache:
            return self.cache[name]

        if self.redis:
            data = self.redis.get(f"feature_flag:{name}")
            if data:
                try:
                    flag = FeatureFlag(
                        name=name,
                        enabled=data.get("enabled", False),
                        rollout_percentage=data.get("rollout_percentage", 100),
                        user_whitelist=data.get("user_whitelist", []),
                        metadata=data.get("metadata", {}),
                    )
                    self.cache[name] = flag
                    return flag
                except (KeyError, TypeError, ValueError) as e:
                    logger.error(f"Invalid flag data for {name}: {e}")

        return None


__all__ = ["FeatureFlag", "FeatureFlagManager"]
