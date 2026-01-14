"""
Configuration constants for AntigravityKit.

Centralized configuration for all modules.

🏯 "Cấu hình thống nhất" - Unified configuration
"""

from enum import Enum
from typing import Dict, Any


# ============================================================
# EXCHANGE RATES
# ============================================================

class Currency(Enum):
    """Supported currencies."""
    USD = "USD"
    VND = "VND"
    THB = "THB"  # Thailand expansion 2026


EXCHANGE_RATES: Dict[Currency, float] = {
    Currency.USD: 1.0,
    Currency.VND: 24500,
    Currency.THB: 35,
}


# ============================================================
# REVENUE TARGETS
# ============================================================

ARR_TARGET_2026 = 1_000_000  # $1M ARR goal
ARR_TARGET_2030 = 10_000_000  # $10M ARR goal


# ============================================================
# TIER PRICING (Binh Pháp Structure)
# ============================================================

class DealTier(Enum):
    """Agency tier levels."""
    WARRIOR = "warrior"      # Pre-Seed/Seed
    GENERAL = "general"      # Series A
    TUONG_QUAN = "tuong_quan"  # Venture Studio


TIER_PRICING: Dict[DealTier, Dict[str, Any]] = {
    DealTier.WARRIOR: {
        "retainer": 2000,
        "equity_range": (5, 8),
        "success_fee": 2.0,
        "description": "Pre-Seed/Seed Stage"
    },
    DealTier.GENERAL: {
        "retainer": 5000,
        "equity_range": (3, 5),
        "success_fee": 1.5,
        "description": "Series A Support"
    },
    DealTier.TUONG_QUAN: {
        "retainer": 0,  # Deferred
        "equity_range": (15, 30),
        "success_fee": 0,  # Shared exit
        "description": "Venture Studio Co-Founder"
    }
}


# ============================================================
# DEVELOPMENT STANDARDS
# ============================================================

MAX_FILE_LINES = 200  # YAGNI/KISS standard
DEFAULT_GROWTH_RATE = 0.10  # 10% monthly growth


# ============================================================
# WORKFLOWS
# ============================================================

WORKFLOW_STEPS = [
    "plan_detection",
    "analysis",
    "implementation",
    "testing",
    "code_review",
    "finalize"
]


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_tier_pricing(tier: DealTier) -> Dict[str, Any]:
    """Get pricing details for a tier."""
    return TIER_PRICING.get(tier, TIER_PRICING[DealTier.WARRIOR])


def usd_to_vnd(amount: float) -> int:
    """Convert USD to VND."""
    return int(amount * EXCHANGE_RATES[Currency.VND])


def vnd_to_usd(amount: float) -> float:
    """Convert VND to USD."""
    return amount / EXCHANGE_RATES[Currency.VND]
