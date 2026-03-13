"""License Checker — RAAS Gate Integration for PEV Engine.

Enforces tier-based feature gating before pipeline execution.
- Free: only 'simple' task profiles, sequential only
- Pro: all profiles + parallel execution
- Enterprise: custom agents + priority queue

Reference: HIEN_PHAP_ROIAAS — RAAS Gate Integration
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from enum import Enum
from typing import Optional

logger = logging.getLogger(__name__)


class LicenseTier(str, Enum):
    """License tiers with increasing capabilities."""

    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


# Task profiles allowed per tier
TIER_ALLOWED_PROFILES: dict[LicenseTier, set[str]] = {
    LicenseTier.FREE: {"simple"},
    LicenseTier.PRO: {"simple", "standard", "complex", "parallel", "dag"},
    LicenseTier.ENTERPRISE: {
        "simple", "standard", "complex", "parallel", "dag",
        "custom_agent", "priority", "swarm",
    },
}

# Feature flags per tier
TIER_FEATURES: dict[LicenseTier, dict[str, bool]] = {
    LicenseTier.FREE: {
        "parallel_execution": False,
        "dag_scheduling": False,
        "custom_agents": False,
        "priority_queue": False,
        "self_healing": False,
        "swarm_mode": False,
    },
    LicenseTier.PRO: {
        "parallel_execution": True,
        "dag_scheduling": True,
        "custom_agents": False,
        "priority_queue": False,
        "self_healing": True,
        "swarm_mode": False,
    },
    LicenseTier.ENTERPRISE: {
        "parallel_execution": True,
        "dag_scheduling": True,
        "custom_agents": True,
        "priority_queue": True,
        "self_healing": True,
        "swarm_mode": True,
    },
}

# Max concurrent steps per tier
TIER_MAX_CONCURRENT: dict[LicenseTier, int] = {
    LicenseTier.FREE: 1,
    LicenseTier.PRO: 4,
    LicenseTier.ENTERPRISE: 16,
}


@dataclass
class LicenseCheckResult:
    """Result of a license check."""

    allowed: bool
    tier: LicenseTier
    reason: str = ""
    upgrade_hint: str = ""


class LicenseChecker:
    """Checks RAAS license tier and enforces feature gates.

    Usage:
        checker = LicenseChecker()
        result = checker.check_pipeline_access(profile="parallel")
        if not result.allowed:
            print(result.reason)
    """

    def __init__(self, tier_override: Optional[str] = None) -> None:
        """Initialize with optional tier override for testing.

        Args:
            tier_override: Force a specific tier (bypasses license lookup).
        """
        self._tier_override = tier_override
        self._cached_tier: Optional[LicenseTier] = None

    def get_tier(self) -> LicenseTier:
        """Resolve current license tier.

        Priority: tier_override > RAAS_LICENSE_KEY env validation > free.
        """
        if self._cached_tier is not None:
            return self._cached_tier

        # Override for testing
        if self._tier_override:
            try:
                self._cached_tier = LicenseTier(self._tier_override.lower())
                return self._cached_tier
            except ValueError:
                self._cached_tier = LicenseTier.FREE
                return self._cached_tier

        # Check env for license key
        license_key = os.getenv("RAAS_LICENSE_KEY", "")
        if not license_key:
            self._cached_tier = LicenseTier.FREE
            return self._cached_tier

        # Determine tier from key prefix (fast local check)
        tier = self._resolve_tier_from_key(license_key)
        self._cached_tier = tier
        return tier

    @staticmethod
    def _resolve_tier_from_key(key: str) -> LicenseTier:
        """Resolve tier from license key prefix.

        Enterprise: raas_ent_* or REP-*
        Pro: raas_pro_* or RPP-* or mk_*
        Free: everything else
        """
        if key.startswith("raas_ent_") or key.startswith("REP-"):
            return LicenseTier.ENTERPRISE
        if key.startswith("raas_pro_") or key.startswith("RPP-"):
            return LicenseTier.PRO
        if key.startswith("mk_") and len(key) >= 8:
            return LicenseTier.PRO
        return LicenseTier.FREE

    def check_pipeline_access(
        self,
        profile: str = "simple",
    ) -> LicenseCheckResult:
        """Check if current tier allows a given task profile.

        Args:
            profile: Task profile name (simple, standard, complex, parallel, etc.)

        Returns:
            LicenseCheckResult with allowed status and reason.
        """
        tier = self.get_tier()
        allowed_profiles = TIER_ALLOWED_PROFILES.get(tier, set())

        if profile.lower() in allowed_profiles:
            return LicenseCheckResult(allowed=True, tier=tier)

        return LicenseCheckResult(
            allowed=False,
            tier=tier,
            reason=f"Profile '{profile}' requires a higher tier. Current: {tier.value}.",
            upgrade_hint=self._get_upgrade_hint(tier, profile),
        )

    def check_feature(self, feature: str) -> LicenseCheckResult:
        """Check if a specific feature is available for current tier.

        Args:
            feature: Feature name (parallel_execution, custom_agents, etc.)

        Returns:
            LicenseCheckResult with allowed status.
        """
        tier = self.get_tier()
        features = TIER_FEATURES.get(tier, {})
        allowed = features.get(feature, False)

        if allowed:
            return LicenseCheckResult(allowed=True, tier=tier)

        return LicenseCheckResult(
            allowed=False,
            tier=tier,
            reason=f"Feature '{feature}' not available on {tier.value} tier.",
            upgrade_hint=self._get_upgrade_hint(tier, feature),
        )

    def get_max_concurrent_steps(self) -> int:
        """Get max concurrent steps for current tier."""
        tier = self.get_tier()
        return TIER_MAX_CONCURRENT.get(tier, 1)

    def reset_cache(self) -> None:
        """Reset cached tier (for testing or after key change)."""
        self._cached_tier = None

    @staticmethod
    def _get_upgrade_hint(current_tier: LicenseTier, feature: str) -> str:
        """Generate upgrade hint based on current tier and desired feature."""
        if current_tier == LicenseTier.FREE:
            return "Upgrade to Pro for parallel execution and all task profiles: https://agencyos.network/pricing"
        if current_tier == LicenseTier.PRO:
            return "Upgrade to Enterprise for custom agents and priority queue: https://agencyos.network/pricing"
        return ""


# Singleton
_checker: Optional[LicenseChecker] = None


def get_license_checker(tier_override: Optional[str] = None) -> LicenseChecker:
    """Get or create the singleton license checker."""
    global _checker
    if _checker is None or tier_override is not None:
        _checker = LicenseChecker(tier_override=tier_override)
    return _checker


def reset_license_checker() -> None:
    """Reset singleton (for testing)."""
    global _checker
    _checker = None


def check_pipeline_access(profile: str = "simple") -> LicenseCheckResult:
    """Convenience: check pipeline access for a profile."""
    return get_license_checker().check_pipeline_access(profile)


def check_feature(feature: str) -> LicenseCheckResult:
    """Convenience: check if a feature is available."""
    return get_license_checker().check_feature(feature)


__all__ = [
    "LicenseChecker",
    "LicenseCheckResult",
    "LicenseTier",
    "TIER_ALLOWED_PROFILES",
    "TIER_FEATURES",
    "TIER_MAX_CONCURRENT",
    "check_feature",
    "check_pipeline_access",
    "get_license_checker",
    "reset_license_checker",
]
