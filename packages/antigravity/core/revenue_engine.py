"""
RevenueEngine - Track and optimize revenue.

Features:
- Invoice management
- Revenue tracking
- Forecasting
- Pricing optimization

🏯 Binh Pháp: Tướng (General) - Leadership metrics
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional


class InvoiceStatus(Enum):
    """Invoice payment status."""

    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class Currency(Enum):
    """Supported currencies."""

    USD = "USD"
    VND = "VND"
    THB = "THB"  # Thailand expansion 2026


# Exchange rates (1 USD = X)
EXCHANGE_RATES = {
    Currency.USD: 1.0,
    Currency.VND: 24500,
    Currency.THB: 35,
}


# $1M 2026 ARR Target
ARR_TARGET_2026 = 1_000_000


@dataclass
class Invoice:
    """An invoice record."""

    id: Optional[int] = None
    client_name: str = ""
    amount: float = 0.0
    currency: Currency = Currency.USD
    status: InvoiceStatus = InvoiceStatus.DRAFT
    due_date: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=14))
    paid_date: Optional[datetime] = None
    notes: str = ""
    created_at: datetime = field(default_factory=datetime.now)

    def get_amount_vnd(self) -> int:
        """Get amount in VND (1 USD = 24,500 VND)."""
        if self.currency == Currency.VND:
            return int(self.amount)
        return int(self.amount * 24500)


@dataclass
class Forecast:
    """Revenue forecast."""

    month: str
    projected: float
    actual: float = 0.0
    confidence: float = 0.8

    def variance(self) -> float:
        """Calculate variance from projection."""
        return self.actual - self.projected


class RevenueEngine:
    """
    Track and optimize revenue.

    Example:
        engine = RevenueEngine()
        inv = engine.create_invoice("ABC Corp", 1500)
        engine.mark_paid(inv)
        print(engine.get_mrr())
    """

    def __init__(self):
        self.invoices: List[Invoice] = []
        self._next_id = 1

    def create_invoice(
        self, client_name: str, amount: float, currency: Currency = Currency.USD, notes: str = ""
    ) -> Invoice:
        """Create a new invoice."""
        invoice = Invoice(
            id=self._next_id, client_name=client_name, amount=amount, currency=currency, notes=notes
        )
        self.invoices.append(invoice)
        self._next_id += 1
        return invoice

    def send_invoice(self, invoice: Invoice) -> Invoice:
        """Mark invoice as sent."""
        invoice.status = InvoiceStatus.SENT
        return invoice

    def mark_paid(self, invoice: Invoice) -> Invoice:
        """Mark invoice as paid."""
        invoice.status = InvoiceStatus.PAID
        invoice.paid_date = datetime.now()
        return invoice

    def get_total_revenue(self) -> float:
        """Get total revenue from paid invoices (in USD)."""
        return sum(
            inv.amount if inv.currency == Currency.USD else inv.amount / 24500
            for inv in self.invoices
            if inv.status == InvoiceStatus.PAID
        )

    def get_mrr(self) -> float:
        """Get Monthly Recurring Revenue estimate."""
        # Simple approach: last 30 days paid invoices
        thirty_days_ago = datetime.now() - timedelta(days=30)
        return sum(
            inv.amount if inv.currency == Currency.USD else inv.amount / 24500
            for inv in self.invoices
            if inv.status == InvoiceStatus.PAID
            and inv.paid_date
            and inv.paid_date > thirty_days_ago
        )

    def get_arr(self) -> float:
        """Get Annual Recurring Revenue estimate."""
        return self.get_mrr() * 12

    def get_outstanding(self) -> float:
        """Get total outstanding (unpaid) amount."""
        return sum(
            inv.amount if inv.currency == Currency.USD else inv.amount / 24500
            for inv in self.invoices
            if inv.status in [InvoiceStatus.SENT, InvoiceStatus.OVERDUE]
        )

    def forecast_monthly(self, months: int = 3) -> List[Forecast]:
        """Generate monthly forecast."""
        mrr = self.get_mrr()
        growth_rate = 0.10  # 10% monthly growth assumption

        forecasts = []
        current = datetime.now()

        for i in range(months):
            month = (current + timedelta(days=30 * (i + 1))).strftime("%Y-%m")
            projected = mrr * ((1 + growth_rate) ** (i + 1))
            forecasts.append(Forecast(month=month, projected=projected))

        return forecasts

    def get_stats(self) -> Dict:
        """Get revenue statistics."""
        return {
            "total_invoices": len(self.invoices),
            "paid_invoices": len([i for i in self.invoices if i.status == InvoiceStatus.PAID]),
            "total_revenue_usd": self.get_total_revenue(),
            "mrr": self.get_mrr(),
            "arr": self.get_arr(),
            "outstanding": self.get_outstanding(),
        }

    # ===== $1M 2026 Goal Tracking =====

    def get_goal_progress(self) -> float:
        """Get progress toward $1M ARR goal (0-100%)."""
        return min((self.get_arr() / ARR_TARGET_2026) * 100, 100)

    def get_goal_gap(self) -> float:
        """Get remaining ARR needed to hit $1M goal."""
        return max(ARR_TARGET_2026 - self.get_arr(), 0)

    def months_to_goal(self, growth_rate: float = 0.10) -> int:
        """
        Estimate months to hit $1M ARR at given monthly growth rate.
        Default: 10% month-over-month growth.
        """
        current_arr = self.get_arr()
        if current_arr >= ARR_TARGET_2026:
            return 0
        if current_arr <= 0 or growth_rate <= 0:
            return -1  # Cannot reach goal

        import math

        # ARR * (1 + growth_rate)^n = target
        # n = log(target/ARR) / log(1 + growth_rate)
        months = math.ceil(math.log(ARR_TARGET_2026 / current_arr) / math.log(1 + growth_rate))
        return months

    def get_goal_dashboard(self) -> Dict:
        """Get complete $1M 2026 goal dashboard."""
        return {
            "current_arr": self.get_arr(),
            "target_arr": ARR_TARGET_2026,
            "progress_percent": self.get_goal_progress(),
            "gap_usd": self.get_goal_gap(),
            "months_to_goal": self.months_to_goal(),
            "mrr": self.get_mrr(),
            "forecast_12m": self.get_mrr() * 12 * (1.10**12),  # 10% growth for 12 months
        }
