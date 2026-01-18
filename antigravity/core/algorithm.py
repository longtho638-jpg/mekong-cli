"""
🧠 AntigravityAlgorithm - Core Business Logic Brain
=====================================================

THE SINGLE SOURCE OF TRUTH for all business calculations.
Every feature calls this one module - no duplicate logic anywhere.

Binh Pháp: "Tướng" - Central command for all operations
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class PricingStrategy(Enum):
    """Pricing strategies for revenue optimization."""

    PENETRATION = "penetration"  # Low price to gain market
    PREMIUM = "premium"  # High value positioning
    FREEMIUM = "freemium"  # Free tier + paid upgrade
    VIRAL_COEFFICIENT = "viral"  # Optimized for growth
    ENTERPRISE = "enterprise"  # Custom pricing


class WinType(Enum):
    """WIN-WIN-WIN validation types."""

    ANH_WIN = "anh"  # Owner revenue/equity
    AGENCY_WIN = "agency"  # Knowledge/infrastructure
    STARTUP_WIN = "startup"  # Value/protection


@dataclass
class LeadData:
    """Lead qualification data."""

    name: str
    company: str
    budget: int = 0
    authority: int = 0  # 1-10 scale
    need: int = 0  # 1-10 scale
    timeline: int = 0  # 1-10 scale
    source: str = "direct"


@dataclass
class LeadScore:
    """Calculated BANT score."""

    total: int
    grade: str  # A, B, C, D
    qualified: bool
    next_action: str


@dataclass
class PricingContext:
    """Context for dynamic pricing."""

    product: str
    tier: str = "standard"
    tenant_id: str = "default"
    discount_code: Optional[str] = None
    quantity: int = 1


@dataclass
class WinResult:
    """WIN-WIN-WIN validation result."""

    is_valid: bool
    wins: Dict[WinType, str]
    violations: List[str] = field(default_factory=list)


class AntigravityAlgorithm:
    """
    🧠 The Master Algorithm - Central Business Logic

    All revenue, scoring, pricing, and validation flows through here.
    Single source of truth for the entire platform.
    """

    # Pricing table
    PRICING = {
        "agencyos_pro": {"base": 197, "enterprise": 497},
        "template": {"base": 27, "premium": 67},
        "retainer": {"ghost_cto": 3000, "advisory": 5000},
        "consulting": {"hourly": 150},
    }

    # BANT thresholds
    BANT_THRESHOLDS = {
        "A": 80,  # Hot lead
        "B": 60,  # Warm lead
        "C": 40,  # Nurture
        "D": 0,  # Cold
    }

    def __init__(self):
        self.calculations_count = 0
        self.last_calculation = None

    def calculate_price(
        self,
        base_price: float,
        context: PricingContext = None,
        strategy: PricingStrategy = PricingStrategy.VIRAL_COEFFICIENT,
    ) -> Dict[str, Any]:
        """
        Calculate dynamic price based on context and strategy.

        Returns:
            {price, original, discount, strategy, breakdown}
        """
        self.calculations_count += 1
        self.last_calculation = datetime.now()

        price = base_price
        discount = 0.0
        breakdown = []

        # Apply strategy modifiers
        if strategy == PricingStrategy.PENETRATION:
            discount = 0.20
            breakdown.append("Penetration: -20%")
        elif strategy == PricingStrategy.VIRAL_COEFFICIENT:
            # Viral pricing: lower for sharers
            discount = 0.10
            breakdown.append("Viral coefficient: -10%")
        elif strategy == PricingStrategy.ENTERPRISE:
            # Enterprise: custom negotiation base
            price *= 1.5
            breakdown.append("Enterprise tier: +50%")

        # Apply context modifiers
        if context:
            if context.quantity > 1:
                bulk_discount = min(0.30, context.quantity * 0.05)
                discount += bulk_discount
                breakdown.append(f"Bulk ({context.quantity}): -{int(bulk_discount * 100)}%")

            if context.discount_code:
                discount += 0.10
                breakdown.append(f"Code {context.discount_code}: -10%")

        final_price = price * (1 - discount)

        return {
            "price": round(final_price, 2),
            "original": base_price,
            "discount_percent": round(discount * 100, 1),
            "strategy": strategy.value,
            "breakdown": breakdown,
            "calculated_at": datetime.now().isoformat(),
        }

    def score_lead(self, lead_data: LeadData) -> LeadScore:
        """
        Score lead using BANT methodology.

        B(udget) + A(uthority) + N(eed) + T(imeline) = Score
        """
        self.calculations_count += 1

        # Weighted BANT scoring
        budget_score = min(lead_data.budget / 1000, 10) * 2.5  # Max 25
        authority_score = lead_data.authority * 2.5  # Max 25
        need_score = lead_data.need * 2.5  # Max 25
        timeline_score = lead_data.timeline * 2.5  # Max 25

        total = int(budget_score + authority_score + need_score + timeline_score)

        # Determine grade
        grade = "D"
        for g, threshold in self.BANT_THRESHOLDS.items():
            if total >= threshold:
                grade = g
                break

        # Determine next action
        next_actions = {
            "A": "Schedule demo call immediately",
            "B": "Send case study + follow up in 2 days",
            "C": "Add to nurture sequence",
            "D": "Low priority - automated follow up only",
        }

        return LeadScore(
            total=total,
            grade=grade,
            qualified=grade in ["A", "B"],
            next_action=next_actions[grade],
        )

    def validate_win3(
        self, action: str, anh_win: str, agency_win: str, startup_win: str
    ) -> WinResult:
        """
        Validate WIN-WIN-WIN alignment.

        CRITICAL: Every revenue action MUST benefit all 3 parties.
        """
        violations = []
        wins = {}

        # Check each win
        if not anh_win or anh_win.lower() in ["none", "n/a", ""]:
            violations.append("❌ Anh WIN missing - no owner benefit")
        else:
            wins[WinType.ANH_WIN] = anh_win

        if not agency_win or agency_win.lower() in ["none", "n/a", ""]:
            violations.append("❌ Agency WIN missing - no infrastructure benefit")
        else:
            wins[WinType.AGENCY_WIN] = agency_win

        if not startup_win or startup_win.lower() in ["none", "n/a", ""]:
            violations.append("❌ Startup WIN missing - no client value")
        else:
            wins[WinType.STARTUP_WIN] = startup_win

        is_valid = len(violations) == 0

        if is_valid:
            logger.info(f"✅ WIN-WIN-WIN validated for: {action}")
        else:
            logger.warning(f"⚠️ WIN-WIN-WIN FAILED for: {action}")
            for v in violations:
                logger.warning(f"   {v}")

        return WinResult(is_valid=is_valid, wins=wins, violations=violations)

    def forecast_revenue(
        self, period_days: int = 30, current_mrr: float = 0, growth_rate: float = 0.1
    ) -> Dict[str, Any]:
        """
        Forecast revenue for given period.
        """
        forecasted_mrr = current_mrr * (1 + growth_rate)
        forecasted_arr = forecasted_mrr * 12

        target_1m = 1_000_000
        gap = target_1m - forecasted_arr
        months_to_goal = (
            gap / (forecasted_mrr * growth_rate) if forecasted_mrr > 0 else float("inf")
        )

        return {
            "period_days": period_days,
            "current_mrr": current_mrr,
            "forecasted_mrr": round(forecasted_mrr, 2),
            "forecasted_arr": round(forecasted_arr, 2),
            "growth_rate": growth_rate,
            "target_1m": target_1m,
            "gap_to_1m": round(gap, 2),
            "months_to_1m": round(months_to_goal, 1) if months_to_goal != float("inf") else "∞",
            "on_track": gap <= 0,
        }

    def get_analytics(self) -> Dict[str, Any]:
        """Get algorithm usage analytics."""
        return {
            "calculations_count": self.calculations_count,
            "last_calculation": self.last_calculation.isoformat()
            if self.last_calculation
            else None,
            "pricing_products": list(self.PRICING.keys()),
            "bant_thresholds": self.BANT_THRESHOLDS,
        }


# Global singleton instance
_algorithm = AntigravityAlgorithm()


def get_algorithm() -> AntigravityAlgorithm:
    """Get the global algorithm instance."""
    return _algorithm


# Convenience functions
def calculate_price(base_price: float, context: PricingContext = None) -> Dict[str, Any]:
    """Calculate price using global algorithm."""
    return _algorithm.calculate_price(base_price, context)


def score_lead(lead_data: LeadData) -> LeadScore:
    """Score lead using global algorithm."""
    return _algorithm.score_lead(lead_data)


def validate_win3(action: str, anh: str, agency: str, startup: str) -> WinResult:
    """Validate WIN-WIN-WIN using global algorithm."""
    return _algorithm.validate_win3(action, anh, agency, startup)


def forecast_revenue(period_days: int = 30, current_mrr: float = 0) -> Dict[str, Any]:
    """Forecast revenue using global algorithm."""
    return _algorithm.forecast_revenue(period_days, current_mrr)
