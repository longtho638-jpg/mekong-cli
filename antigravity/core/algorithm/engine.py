"""
The central engine for Antigravity Algorithm.
"""
import logging
from datetime import datetime
from typing import Any, Dict

from .forecasting import forecast_revenue_logic
from .types import LeadData, LeadScore, PricingContext, PricingStrategy, WinResult
from .pricing import PRICING_TABLE, calculate_price_logic
from .scoring import BANT_THRESHOLDS, score_lead_logic
from .validation import validate_win3_logic

logger = logging.getLogger(__name__)


class AntigravityAlgorithm:
    """
    🧠 The Master Algorithm - Central Business Logic

    All revenue, scoring, pricing, and validation flows through here.
    Single source of truth for the entire platform.
    """

    PRICING = PRICING_TABLE
    BANT_THRESHOLDS = BANT_THRESHOLDS

    def __init__(self):
        self.calculations_count = 0
        self.last_calculation = None

    def calculate_price(
        self,
        base_price: float,
        context: PricingContext = None,
        strategy: PricingStrategy = PricingStrategy.VIRAL_COEFFICIENT,
    ) -> Dict[str, Any]:
        """Delegate to pricing logic."""
        self._record_activity()
        return calculate_price_logic(base_price, context, strategy)

    def score_lead(self, lead_data: LeadData) -> LeadScore:
        """Delegate to scoring logic."""
        self._record_activity()
        return score_lead_logic(lead_data)

    def validate_win3(
        self, action: str, anh_win: str, agency_win: str, startup_win: str
    ) -> WinResult:
        """Delegate to validation logic."""
        return validate_win3_logic(action, anh_win, agency_win, startup_win)

    def forecast_revenue(
        self, period_days: int = 30, current_mrr: float = 0, growth_rate: float = 0.1
    ) -> Dict[str, Any]:
        """Delegate to forecasting logic."""
        return forecast_revenue_logic(period_days, current_mrr, growth_rate)

    def _record_activity(self):
        """Internal helper to track usage stats."""
        self.calculations_count += 1
        self.last_calculation = datetime.now()

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
