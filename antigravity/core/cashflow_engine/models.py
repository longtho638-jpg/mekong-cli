"""
💰 Cashflow Models
==================

Data models and constants for the Cashflow Engine.
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional

# ============================================
# TARGETS & CONFIGURATION
# ============================================

ARR_TARGET_2026 = 1_000_000  # $1M ARR goal
# 2026 standard rates
EXCHANGE_RATES = {"USD": 1.0, "VND": 25000.0, "THB": 35.0}


class RevenueStream(Enum):
    """Core revenue buckets for Agency OS."""

    WELLNEXUS = "wellnexus"  # Social Commerce Platform
    AGENCY = "agency"  # Agency Services (Retainer + Equity)
    SAAS = "saas"  # AI / SaaS Products
    CONSULTING = "consulting"  # High-ticket Strategy
    AFFILIATE = "affiliate"  # Partner Revenue
    EXIT = "exit"  # Liquidity Events


@dataclass
class Revenue:
    """A single revenue transaction or commitment."""

    id: str
    stream: RevenueStream
    amount_usd: float
    currency: str
    amount_original: float
    date: datetime
    recurring: bool
    client: Optional[str] = None
    description: str = ""


@dataclass
class RevenueGoal:
    """Target allocation per revenue stream."""

    stream: RevenueStream
    target_arr: float
    current_arr: float = 0.0

    @property
    def progress_percent(self) -> float:
        """Percentage of target achieved."""
        return (self.current_arr / self.target_arr * 100) if self.target_arr > 0 else 0.0

    @property
    def gap_usd(self) -> float:
        """Remaining USD to hit target."""
        return max(0.0, self.target_arr - self.current_arr)
