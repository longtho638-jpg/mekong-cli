"""
Tier-Based Rate Limiting Configuration — ROIaaS Phase 6

Unified tier configuration system with preset rate limits for different auth endpoints.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional, Union


class Tier(Enum):
    """License tier enumeration."""
    FREE = "free"
    TRIAL = "trial"
    PRO = "pro"
    ENTERPRISE = "enterprise"


@dataclass
class RateLimitConfig:
    """Rate limit configuration for a single endpoint."""
    requests_per_minute: int
    burst_size: Optional[int] = None  # Token bucket burst size (default = rpm)

    def __post_init__(self):
        if self.burst_size is None:
            self.burst_size = self.requests_per_minute


@dataclass
class TierRateLimitConfig:
    """Complete rate limit configuration for a tier."""
    tier: Tier
    auth_login: RateLimitConfig
    auth_callback: RateLimitConfig
    auth_refresh: RateLimitConfig
    api_default: RateLimitConfig


# Default tier configurations
DEFAULT_TIER_CONFIGS: dict[str, TierRateLimitConfig] = {
    Tier.FREE: TierRateLimitConfig(
        tier=Tier.FREE,
        auth_login=RateLimitConfig(requests_per_minute=5, burst_size=5),
        auth_callback=RateLimitConfig(requests_per_minute=10, burst_size=10),
        auth_refresh=RateLimitConfig(requests_per_minute=10, burst_size=10),
        api_default=RateLimitConfig(requests_per_minute=20, burst_size=30),
    ),
    Tier.TRIAL: TierRateLimitConfig(
        tier=Tier.TRIAL,
        auth_login=RateLimitConfig(requests_per_minute=10, burst_size=10),
        auth_callback=RateLimitConfig(requests_per_minute=20, burst_size=20),
        auth_refresh=RateLimitConfig(requests_per_minute=20, burst_size=20),
        api_default=RateLimitConfig(requests_per_minute=40, burst_size=60),
    ),
    Tier.PRO: TierRateLimitConfig(
        tier=Tier.PRO,
        auth_login=RateLimitConfig(requests_per_minute=30, burst_size=30),
        auth_callback=RateLimitConfig(requests_per_minute=60, burst_size=60),
        auth_refresh=RateLimitConfig(requests_per_minute=60, burst_size=60),
        api_default=RateLimitConfig(requests_per_minute=100, burst_size=150),
    ),
    Tier.ENTERPRISE: TierRateLimitConfig(
        tier=Tier.ENTERPRISE,
        auth_login=RateLimitConfig(requests_per_minute=100, burst_size=100),
        auth_callback=RateLimitConfig(requests_per_minute=200, burst_size=200),
        auth_refresh=RateLimitConfig(requests_per_minute=200, burst_size=200),
        api_default=RateLimitConfig(requests_per_minute=500, burst_size=750),
    ),
}


def get_tier_config(tier: Union[str, Tier]) -> TierRateLimitConfig:
    """
    Get rate limit configuration for a tier.

    Args:
        tier: Tier name or Tier enum value

    Returns:
        TierRateLimitConfig for the specified tier

    Raises:
        ValueError: If tier is not recognized
    """
    if isinstance(tier, str):
        try:
            tier = Tier(tier.lower())
        except ValueError:
            raise ValueError(f"Invalid tier: {tier}. Must be one of: {[t.value for t in Tier]}")

    if tier not in DEFAULT_TIER_CONFIGS:
        raise ValueError(f"Invalid tier: {tier}. Must be one of: {[t.value for t in Tier]}")

    return DEFAULT_TIER_CONFIGS[tier]


def get_preset_config(tier: Union[str, Tier], preset: str) -> RateLimitConfig:
    """
    Get rate limit config for a specific preset endpoint.

    Args:
        tier: Tier name or Tier enum
        preset: Preset name (auth_login, auth_callback, auth_refresh, api_default)

    Returns:
        RateLimitConfig for the preset

    Raises:
        ValueError: If tier or preset is invalid
    """
    tier_config = get_tier_config(tier)

    preset_map = {
        "auth_login": tier_config.auth_login,
        "auth_callback": tier_config.auth_callback,
        "auth_refresh": tier_config.auth_refresh,
        "api_default": tier_config.api_default,
    }

    if preset not in preset_map:
        raise ValueError(
            f"Invalid preset: {preset}. Must be one of: {list(preset_map.keys())}"
        )

    return preset_map[preset]


__all__ = [
    "Tier",
    "RateLimitConfig",
    "TierRateLimitConfig",
    "get_tier_config",
    "get_preset_config",
    "DEFAULT_TIER_CONFIGS",
]
