"""
⚙️ AntigravityKit - Core Configuration
======================================

Centralized registry for global constants, financial targets, and
operational standards across the Agency OS ecosystem.

Topics:
- 💸 Financial: Exchange rates, revenue targets.
- 🏢 Commercial: Tiered pricing (Binh Pháp structure).
- 🛠️ Technical: Development standards, limits.
- ⚡ Orchestration: Workflow step definitions.

Binh Pháp: 📋 Pháp (Process) - Maintaining order through standards.
"""

from enum import Enum
from typing import Any, Dict, List, Union

# ============================================================
# 💸 EXCHANGE RATES (2026 Projections)
# ============================================================


class Currency(Enum):
    """Supported transaction currencies."""

    USD = "USD"
    VND = "VND"  # Primary
    THB = "THB"  # Regional Expansion


# Live rates (Static snapshot for simulation)
EXCHANGE_RATES: Dict[Currency, float] = {
    Currency.USD: 1.0,
    Currency.VND: 25000.0,  # Updated rate
    Currency.THB: 35.0,
}


# ============================================================
# 🎯 REVENUE MILESTONES
# ============================================================

ARR_TARGET_2026 = 1_000_000  # $1M ARR (The Unicorn Goal)
ARR_TARGET_2030 = 10_000_000  # $10M ARR (Scale Stage)


# ============================================================
# 🏢 COMMERCIAL TIERS (Binh Pháp Revenue Model)
# ============================================================


class DealTier(Enum):
    """Client engagement levels based on strategic depth."""

    WARRIOR = "warrior"  # Tier 1: Pre-Seed/Seed
    GENERAL = "general"  # Tier 2: Series A
    TUONG_QUAN = "tuong_quan"  # Tier 3: Venture Studio / Co-Founder


TIER_PRICING: Dict[DealTier, Dict[str, Any]] = {
    DealTier.WARRIOR: {
        "label": "WARRIOR (Startups)",
        "retainer_usd": 2000,
        "equity_range": (5.0, 8.0),
        "success_fee_percent": 2.0,
        "description": "Foundational support for early-stage teams.",
    },
    DealTier.GENERAL: {
        "label": "GENERAL (Scaling)",
        "retainer_usd": 5000,
        "equity_range": (3.0, 5.0),
        "success_fee_percent": 1.5,
        "description": "Strategic advisory and growth acceleration.",
    },
    DealTier.TUONG_QUAN: {
        "label": "TƯỚNG QUÂN (Venture Studio)",
        "retainer_usd": 0,  # Deferred until funding/revenue
        "equity_range": (15.0, 30.0),
        "success_fee_percent": 0.0,  # Focused on shared exit
        "description": "Full co-founder partnership and resource sharing.",
    },
}


# ============================================================
# 🛠️ DEVELOPMENT & QUALITY STANDARDS
# ============================================================

MAX_FILE_LINES = 250  # Encourage modularity (KISS)
MAX_METHOD_COMPLEXITY = 15  # Cyclomatic threshold
DEFAULT_GROWTH_RATE = 0.15  # 15% Monthly target


# ============================================================
# ⚡ WORKFLOW ORCHESTRATION
# ============================================================

# The 'Manus Pattern' 6-step core workflow
WORKFLOW_STEPS: List[str] = [
    "detect_intent",
    "strategic_analysis",
    "parallel_implementation",
    "verification_testing",
    "peer_code_review",
    "final_deployment",
]


# ============================================================
# 🔮 QUANTUM & MODEL CONFIGURATION
# ============================================================

# Model Routing (Quota Engine defaults)
DEFAULT_MODEL = "gemini-3-flash"
PREMIUM_MODEL = "gemini-3-pro-high"

# Proxy Configuration
AI_PROXY_URL = "http://localhost:8080"
AI_PROXY_ENABLED = True
AI_PROXY_TIMEOUT = 30


# ============================================================
# 🔍 HELPERS
# ============================================================


def get_tier_pricing(tier: Union[DealTier, str]) -> Dict[str, Any]:
    """Retrieves commercial terms for a specific deal tier."""
    if isinstance(tier, str):
        try:
            tier = DealTier(tier.lower())
        except ValueError:
            tier = DealTier.WARRIOR

    return TIER_PRICING.get(tier, TIER_PRICING[DealTier.WARRIOR])


def usd_to_vnd(amount: float) -> int:
    """Converts USD amount to VND using internal projected rates."""
    return int(amount * EXCHANGE_RATES[Currency.VND])


def vnd_to_usd(amount: float) -> float:
    """Converts VND amount to USD."""
    return amount / EXCHANGE_RATES[Currency.VND]


def format_currency(amount: float, currency: Currency = Currency.USD) -> str:
    """Pretty prints currency based on locale conventions."""
    if currency == Currency.VND:
        return f"{int(amount):,} VND"
    return f"${amount:,.2f} USD"
