"""
Loyalty Tiers - Tier Definitions and Registry
==============================================

Contains tier dataclass and global tier registry.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class LoyaltyTier:
    """Definition of a specific loyalty bracket and its associated perks."""

    id: str
    name: str
    emoji: str
    min_months: int
    discount_rate: float
    benefits: List[str]


# Global Tier Registry
TIERS: Dict[str, LoyaltyTier] = {
    "bronze": LoyaltyTier(
        id="bronze",
        name="Bronze Agent",
        emoji="[BRONZE]",
        min_months=0,
        discount_rate=0.0,
        benefits=["Basic email support", "Agency OS community access"],
    ),
    "silver": LoyaltyTier(
        id="silver",
        name="Silver Agent",
        emoji="[SILVER]",
        min_months=12,
        discount_rate=0.05,
        benefits=["5% service discount", "Priority support", "Early feature access"],
    ),
    "gold": LoyaltyTier(
        id="gold",
        name="Gold Agent",
        emoji="[GOLD]",
        min_months=24,
        discount_rate=0.10,
        benefits=[
            "10% service discount",
            "VIP support 24/7",
            "Beta access",
            "Brand promotion",
        ],
    ),
    "platinum": LoyaltyTier(
        id="platinum",
        name="Platinum Agent",
        emoji="[PLATINUM]",
        min_months=36,
        discount_rate=0.15,
        benefits=["15% service discount", "1-1 strategic advisory", "Custom feature requests"],
    ),
    "diamond": LoyaltyTier(
        id="diamond",
        name="Diamond Agent",
        emoji="[DIAMOND]",
        min_months=60,
        discount_rate=0.20,
        benefits=[
            "20% service discount",
            "Revenue sharing",
            "Strategic advisory board",
            "Maximum module customization",
        ],
    ),
}


def get_tier_by_tenure(months: int) -> LoyaltyTier:
    """
    Get the highest eligible tier based on tenure months.

    Args:
        months: Number of months in the program

    Returns:
        Highest qualifying LoyaltyTier
    """
    current = TIERS["bronze"]
    for tier in TIERS.values():
        if months >= tier.min_months:
            if tier.min_months >= current.min_months:
                current = tier
    return current


def get_next_tier(months: int) -> Optional[LoyaltyTier]:
    """
    Get the next milestone tier.

    Args:
        months: Current tenure months

    Returns:
        Next tier or None if at max
    """
    sorted_tiers = sorted(TIERS.values(), key=lambda t: t.min_months)
    for tier in sorted_tiers:
        if tier.min_months > months:
            return tier
    return None
