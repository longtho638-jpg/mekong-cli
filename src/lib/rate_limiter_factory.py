"""
Rate Limiter Factory — ROIaaS Phase 6

Factory pattern for creating tier-based rate limiters with caching.
"""

import time
from dataclasses import dataclass
from typing import Optional, Dict
from threading import Lock

from src.lib.tier_config import Tier, RateLimitConfig, get_tier_config, get_preset_config


@dataclass
class CachedConfig:
    """Cached configuration with TTL."""
    config: RateLimitConfig
    expires_at: float  # Unix timestamp


class RateLimiterFactory:
    """
    Factory for creating and caching tier-based rate limiters.

    Uses in-memory cache with configurable TTL to reduce database lookups.
    """

    DEFAULT_CACHE_TTL_SECONDS = 300  # 5 minutes

    def __init__(self, cache_ttl: Optional[int] = None):
        """
        Initialize the rate limiter factory.

        Args:
            cache_ttl: Cache TTL in seconds (default: 300)
        """
        self._cache: Dict[str, CachedConfig] = {}
        self._cache_lock = Lock()
        self._cache_ttl = cache_ttl or self.DEFAULT_CACHE_TTL_SECONDS

    def _get_cache_key(self, tier: str, preset: str) -> str:
        """Generate cache key from tier and preset."""
        return f"{tier.lower()}:{preset.lower()}"

    def _is_cached(self, key: str) -> bool:
        """Check if key is cached and not expired."""
        if key not in self._cache:
            return False

        cached = self._cache[key]
        if time.time() > cached.expires_at:
            # Remove expired entry
            del self._cache[key]
            return False

        return True

    def get_config_for_tier(self, tier: str, preset: str) -> RateLimitConfig:
        """
        Get rate limit config for tier and preset.

        Uses cache if available, otherwise fetches from tier_config module.

        Args:
            tier: Tier name (free, trial, pro, enterprise)
            preset: Preset name (auth_login, auth_callback, auth_refresh, api_default)

        Returns:
            RateLimitConfig for the tier/preset combination
        """
        cache_key = self._get_cache_key(tier, preset)

        with self._cache_lock:
            if self._is_cached(cache_key):
                return self._cache[cache_key].config

            # Fetch fresh config
            config = get_preset_config(tier, preset)

            # Cache it
            self._cache[cache_key] = CachedConfig(
                config=config,
                expires_at=time.time() + self._cache_ttl,
            )

            return config

    def invalidate_cache(self, tier: Optional[str] = None) -> None:
        """
        Invalidate cache entries.

        Args:
            tier: If provided, only invalidate cache for this tier.
                  If None, invalidate entire cache.
        """
        with self._cache_lock:
            if tier is None:
                self._cache.clear()
            else:
                # Remove only entries for this tier
                keys_to_remove = [
                    key for key in self._cache
                    if key.startswith(f"{tier.lower()}:")
                ]
                for key in keys_to_remove:
                    del self._cache[key]

    def get_rate_limiter(self, tier: str, preset: str = "api_default") -> "TierRateLimiter":
        """
        Get a configured rate limiter for a tier.

        Args:
            tier: Tier name
            preset: Preset name (default: api_default)

        Returns:
            Configured TierRateLimiter instance
        """
        config = self.get_config_for_tier(tier, preset)
        return TierRateLimiter(config)

    def get_all_tier_configs(self) -> Dict[str, Dict[str, RateLimitConfig]]:
        """
        Get all configurations for all tiers.

        Returns:
            Dict mapping tier names to their preset configs
        """
        result = {}
        for tier in Tier:
            tier_name = tier.value
            result[tier_name] = {
                "auth_login": get_preset_config(tier_name, "auth_login"),
                "auth_callback": get_preset_config(tier_name, "auth_callback"),
                "auth_refresh": get_preset_config(tier_name, "auth_refresh"),
                "api_default": get_preset_config(tier_name, "api_default"),
            }
        return result


class TierRateLimiter:
    """
    Token bucket rate limiter for a specific tier/preset.

    Simple in-memory implementation. For production, consider
    Redis-backed limiting for multi-instance deployments.
    """

    def __init__(self, config: RateLimitConfig):
        """
        Initialize rate limiter.

        Args:
            config: Rate limit configuration
        """
        self.config = config
        self._tokens = float(config.burst_size)
        self._last_update = time.time()
        self._lock = Lock()

    def _refill(self) -> None:
        """Refill tokens based on elapsed time."""
        now = time.time()
        elapsed = now - self._last_update

        # Add tokens based on elapsed time
        tokens_to_add = elapsed * (self.config.requests_per_minute / 60.0)
        self._tokens = min(self._tokens + tokens_to_add, self.config.burst_size)
        self._last_update = now

    def acquire(self, tokens: int = 1) -> bool:
        """
        Try to acquire tokens.

        Args:
            tokens: Number of tokens to acquire (default: 1)

        Returns:
            True if tokens acquired, False if rate limited
        """
        with self._lock:
            self._refill()

            if self._tokens >= tokens:
                self._tokens -= tokens
                return True
            return False

    def get_wait_time(self, tokens: int = 1) -> float:
        """
        Get time to wait until tokens are available.

        Args:
            tokens: Number of tokens needed

        Returns:
            Wait time in seconds (0 if tokens available)
        """
        with self._lock:
            self._refill()

            if self._tokens >= tokens:
                return 0.0

            tokens_needed = tokens - self._tokens
            tokens_per_second = self.config.requests_per_minute / 60.0
            return tokens_needed / tokens_per_second

    def reset(self) -> None:
        """Reset the rate limiter to full capacity."""
        with self._lock:
            self._tokens = float(self.config.burst_size)
            self._last_update = time.time()


# Global factory instance
_factory: Optional[RateLimiterFactory] = None
_factory_lock = Lock()


def get_factory(cache_ttl: Optional[int] = None) -> RateLimiterFactory:
    """
    Get or create the global rate limiter factory.

    Args:
        cache_ttl: Optional custom cache TTL

    Returns:
        Global RateLimiterFactory instance
    """
    global _factory

    with _factory_lock:
        if _factory is None:
            _factory = RateLimiterFactory(cache_ttl)
        return _factory


def get_rate_limiter(tier: str, preset: str = "api_default") -> TierRateLimiter:
    """
    Convenience function to get a rate limiter.

    Args:
        tier: Tier name
        preset: Preset name

    Returns:
        Configured TierRateLimiter
    """
    factory = get_factory()
    return factory.get_rate_limiter(tier, preset)


def invalidate_cache(tier: Optional[str] = None) -> None:
    """
    Invalidate the global factory cache.

    Args:
        tier: Optional tier to invalidate
    """
    factory = get_factory()
    factory.invalidate_cache(tier)


__all__ = [
    "RateLimiterFactory",
    "TierRateLimiter",
    "get_factory",
    "get_rate_limiter",
    "invalidate_cache",
]
