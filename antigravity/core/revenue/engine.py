"""
💰 RevenueEngine - Financial Performance & Forecasting
======================================================

The operational heart of the Agency OS financial system. Tracks invoices,
calculates MRR/ARR, and monitors progress toward the $1M 2026 milestone.

Key Performance Indicators:
- 💵 MRR: Monthly Recurring Revenue.
- 📅 ARR: Annualized Recurring Revenue.
- 📉 Churn Impact: Loss of recurring revenue.
- 🚀 Rule of 40: Growth + Profitability index.

Binh Pháp: 💂 Tướng (Leadership) - Managing the numbers that drive the march.
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List

from typing_extensions import TypedDict

from ..base import BaseEngine
from ..config import EXCHANGE_RATES, Currency
from ..models.invoice import Forecast, Invoice, InvoiceStatus
from .forecasting import RevenueForecasting
from .goals import GoalSummaryDict, GoalTracker
from .reporting import RevenueReporting

# Configure logging
logger = logging.getLogger(__name__)


class RevenueVolumeDict(TypedDict):
    total_invoices: int
    paid_count: int


class RevenueFinancialsDict(TypedDict):
    total_revenue_usd: float
    mrr: float
    arr: float
    outstanding: float


class RevenueStatsDict(TypedDict):
    """Complete revenue performance metrics"""
    volume: RevenueVolumeDict
    financials: RevenueFinancialsDict
    goals: Dict[str, Any]


class RevenueEngine(BaseEngine):
    """
    💰 Revenue Management Engine

    Automates invoicing and provides a real-time financial cockpit
    for the agency owner.
    """

    def __init__(self, data_dir: str = ".antigravity"):
        super().__init__(data_dir)
        self.invoices: List[Invoice] = []
        self._next_id = 1

        # Sub-components
        self.forecaster = RevenueForecasting()
        self.goal_tracker = GoalTracker()
        self.reporter = RevenueReporting()

    def create_invoice(
        self, client_name: str, amount: float, currency: str = "USD", notes: str = ""
    ) -> Invoice:
        """Generates a new invoice entity in DRAFT state."""
        invoice = Invoice(
            id=self._next_id,
            client_name=client_name,
            amount=amount,
            currency=currency,
            notes=notes,
            status=InvoiceStatus.DRAFT,
        )
        self.invoices.append(invoice)
        self._next_id += 1
        logger.info(f"Invoice #{invoice.id} created for {client_name} (${amount} {currency})")
        return invoice

    def send_invoice(self, invoice: Invoice) -> Invoice:
        """Transitions an invoice from DRAFT to SENT."""
        invoice.status = InvoiceStatus.SENT
        return invoice

    def mark_paid(self, invoice: Invoice) -> Invoice:
        """Records a successful payment and sets the payment date."""
        invoice.status = InvoiceStatus.PAID
        invoice.paid_date = datetime.now()
        logger.info(
            f"💰 Payment received: Invoice #{invoice.id} (${invoice.amount} {invoice.currency})"
        )
        return invoice

    def _to_usd(self, amount: float, currency: str) -> float:
        """Converts local currency amounts to normalized USD."""
        if currency.upper() == "USD":
            return amount
        # Standardize on 25,000 VND for 2026 simulations
        rate = EXCHANGE_RATES.get(Currency.VND, 25000.0)
        return amount / rate

    def get_total_revenue(self) -> float:
        """Aggregates all-time PAID revenue in USD."""
        return sum(
            self._to_usd(inv.amount, inv.currency)
            for inv in self.invoices
            if inv.status == InvoiceStatus.PAID
        )

    def get_mrr(self) -> float:
        """Calculates current Monthly Recurring Revenue (active in last 30 days)."""
        thirty_days_ago = datetime.now() - timedelta(days=30)
        return sum(
            self._to_usd(inv.amount, inv.currency)
            for inv in self.invoices
            if inv.status == InvoiceStatus.PAID
            and inv.paid_date
            and inv.paid_date > thirty_days_ago
        )

    def get_arr(self) -> float:
        """Projects current ARR based on active MRR."""
        return self.get_mrr() * 12

    def get_outstanding_usd(self) -> float:
        """Total unpaid value currently in the SENT or OVERDUE state."""
        return sum(
            self._to_usd(inv.amount, inv.currency)
            for inv in self.invoices
            if inv.status in [InvoiceStatus.SENT, InvoiceStatus.OVERDUE]
        )

    def forecast_growth(self, months: int = 6) -> List[Forecast]:
        """Projects future revenue based on current MRR and default growth rates."""
        return self.forecaster.forecast_growth(self.get_mrr(), months)

    def _collect_stats(self) -> RevenueStatsDict:
        """
        Provides high-level performance metrics for the engine.
        Cached for 60 seconds to reduce calculation overhead.
        """
        # Simple caching mechanism (could be replaced by functools.lru_cache or redis)
        now = datetime.now()
        if hasattr(self, "_cached_stats") and hasattr(self, "_cache_time"):
            if (now - self._cache_time).total_seconds() < 60:
                return self._cached_stats

        stats = {
            "volume": {
                "total_invoices": len(self.invoices),
                "paid_count": len([i for i in self.invoices if i.status == InvoiceStatus.PAID]),
            },
            "financials": {
                "total_revenue_usd": self.get_total_revenue(),
                "mrr": self.get_mrr(),
                "arr": self.get_arr(),
                "outstanding": self.get_outstanding_usd(),
            },
            "goals": self.get_goal_summary(),
        }

        self._cached_stats = stats
        self._cache_time = now
        return stats

    # ============================================
    # $1M 2026 GOAL TRACKING
    # ============================================

    def get_goal_summary(self) -> GoalSummaryDict:
        """Aggregates all metrics relevant to the $1M ARR target."""
        return self.goal_tracker.get_goal_summary(self.get_arr())

    def print_dashboard(self):
        """ASCII dashboard for terminal reporting."""
        self.reporter.print_dashboard(self.get_stats())
