"""
RevenueEngine - Track and optimize revenue.

Features:
- Invoice management
- Revenue tracking
- Forecasting
- $1M 2026 goal tracking

🏯 Binh Pháp: Tướng (General) - Leadership metrics
"""

from datetime import datetime, timedelta
from typing import List, Dict
import math

from .models.invoice import Invoice, InvoiceStatus, Forecast
from .config import Currency, EXCHANGE_RATES, ARR_TARGET_2026, DEFAULT_GROWTH_RATE
from .base import BaseEngine


class RevenueEngine(BaseEngine):
    """
    Track and optimize revenue.
    
    Example:
        engine = RevenueEngine()
        inv = engine.create_invoice("ABC Corp", 1500)
        engine.mark_paid(inv)
        print(engine.get_mrr())
    """

    def __init__(self, data_dir: str = ".antigravity"):
        super().__init__(data_dir)
        self.invoices: List[Invoice] = []
        self._next_id = 1

    def create_invoice(
        self,
        client_name: str,
        amount: float,
        currency: str = "USD",
        notes: str = ""
    ) -> Invoice:
        """Create a new invoice."""
        invoice = Invoice(
            id=self._next_id,
            client_name=client_name,
            amount=amount,
            currency=currency,
            notes=notes
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

    def _to_usd(self, invoice: Invoice) -> float:
        """Convert invoice amount to USD."""
        if invoice.currency == "USD":
            return invoice.amount
        return invoice.amount / EXCHANGE_RATES.get(Currency.VND, 24500)

    def get_total_revenue(self) -> float:
        """Get total revenue from paid invoices (USD)."""
        return sum(
            self._to_usd(inv) for inv in self.invoices
            if inv.status == InvoiceStatus.PAID
        )

    def get_mrr(self) -> float:
        """Get Monthly Recurring Revenue estimate."""
        thirty_days_ago = datetime.now() - timedelta(days=30)
        return sum(
            self._to_usd(inv) for inv in self.invoices
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
            self._to_usd(inv) for inv in self.invoices
            if inv.status in [InvoiceStatus.SENT, InvoiceStatus.OVERDUE]
        )

    def forecast_monthly(self, months: int = 3) -> List[Forecast]:
        """Generate monthly forecast."""
        mrr = self.get_mrr()
        forecasts = []
        current = datetime.now()

        for i in range(months):
            month = (current + timedelta(days=30 * (i + 1))).strftime("%Y-%m")
            projected = mrr * ((1 + DEFAULT_GROWTH_RATE) ** (i + 1))
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
            "outstanding": self.get_outstanding()
        }

    # ===== $1M 2026 Goal Tracking =====

    def get_goal_progress(self) -> float:
        """Get progress toward $1M ARR goal (0-100%)."""
        return min((self.get_arr() / ARR_TARGET_2026) * 100, 100)

    def get_goal_gap(self) -> float:
        """Get remaining ARR needed to hit $1M goal."""
        return max(ARR_TARGET_2026 - self.get_arr(), 0)

    def months_to_goal(self, growth_rate: float = DEFAULT_GROWTH_RATE) -> int:
        """Estimate months to hit $1M ARR at given growth rate."""
        current_arr = self.get_arr()
        if current_arr >= ARR_TARGET_2026:
            return 0
        if current_arr <= 0 or growth_rate <= 0:
            return -1
        return math.ceil(
            math.log(ARR_TARGET_2026 / current_arr) / math.log(1 + growth_rate)
        )

    def get_goal_dashboard(self) -> Dict:
        """Get complete $1M 2026 goal dashboard."""
        return {
            "current_arr": self.get_arr(),
            "target_arr": ARR_TARGET_2026,
            "progress_percent": self.get_goal_progress(),
            "gap_usd": self.get_goal_gap(),
            "months_to_goal": self.months_to_goal(),
            "mrr": self.get_mrr(),
            "forecast_12m": self.get_mrr() * 12 * (1.10 ** 12)
        }
