"""
Config TypedDicts - Typed dictionaries for configuration.
"""

from typing import TypedDict


class TierPricingDict(TypedDict, total=False):
    """Pricing configuration for deal tiers."""

    monthly_retainer: float
    equity_percent: float
    success_fee_percent: float
    min_commitment_months: int


class VariantConfigDict(TypedDict, total=False):
    """Configuration for A/B test variants."""

    name: str
    weight: float
    price_modifier: float
    features: dict
