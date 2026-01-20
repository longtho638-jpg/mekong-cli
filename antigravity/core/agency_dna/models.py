"""
🧬 Agency DNA Models
====================

Data models and enumerations for the Agency DNA system.
"""

from dataclasses import dataclass
from enum import Enum


class Tone(Enum):
    """Regional and professional brand voice archetypes."""

    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    MIEN_TAY = "mien_tay"  # Southern: Warm, sincere, humble
    MIEN_BAC = "mien_bac"  # Northern: Formal, precise, elegant
    MIEN_TRUNG = "mien_trung"  # Central: Hardworking, resilient, simple


class PricingTier(Enum):
    """Standardized service pricing brackets."""

    STARTER = "starter"  # Solo project focus
    GROWTH = "growth"  # Scaling agency focus
    PROFESSIONAL = "professional"  # High-ticket boutique
    ENTERPRISE = "enterprise"  # Venture-backed / Corporate


@dataclass
class Service:
    """Represents a specific product or service offering."""

    name: str
    description: str
    price_usd: float
    price_vnd: int = 0
    duration_days: int = 7

    def __post_init__(self):
        """Auto-conversion of USD to VND using updated rates."""
        # Standard rate: 1 USD ≈ 25,000 VND (2026 approximation)
        if self.price_vnd == 0:
            self.price_vnd = int(self.price_usd * 25000)
