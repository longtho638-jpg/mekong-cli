"""
💰 MoneyMaker - Revenue Autopilot Engine (REFACTORED)
======================================================

Enhanced with Pydantic validation for security and data integrity.

Features:
- 📖 13-Chapter Strategic Pricing: Value-based services
- 💂 Tiered Service Levels: Warrior, General, Tướng Quân
- ⚖️ WIN-WIN-WIN Gatekeeper: Governance check for every deal
- 📊 Sales Intelligence: Automatic lead qualification (BANT)
- 🛡️ Input Validation: Pydantic models for all financial data

Binh Pháp: 💰 Tài (Wealth) - Generating and managing resources

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.money_maker package.
"""

from antigravity.core.money_maker import (
    BINH_PHAP_SERVICES,
    TIER_PROFILES,
    MoneyMaker,
    Quote,
    ServiceTier,
    Win3Result,
)

__all__ = [
    "MoneyMaker",
    "Quote",
    "Win3Result",
    "ServiceTier",
    "BINH_PHAP_SERVICES",
    "TIER_PROFILES",
]
