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
import math
from datetime import datetime, timedelta
from typing import Any, Dict, List

from ..base import BaseEngine
from ..config import ARR_TARGET_2026, DEFAULT_GROWTH_RATE, EXCHANGE_RATES, Currency
from ..models.invoice import Forecast, Invoice, InvoiceStatus

# Configure logging
logger = logging.getLogger(__name__)


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
        mrr = self.get_mrr()
        forecasts = []
        current = datetime.now()

        for i in range(1, months + 1):
            target_date = current + timedelta(days=30 * i)
            # Compounding growth formula
            projected = mrr * ((1 + DEFAULT_GROWTH_RATE) ** i)
            forecasts.append(Forecast(month=target_date.strftime("%Y-%m"), projected=projected))

        return forecasts

    def get_stats(self) -> Dict[str, Any]:
        """Provides high-level performance metrics for the engine."""
        return {
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

    # ============================================
    # $1M 2026 GOAL TRACKING
    # ============================================

    def get_goal_summary(self) -> Dict[str, Any]:
        """Aggregates all metrics relevant to the $1M ARR target."""
        current_arr = self.get_arr()
        progress = min((current_arr / ARR_TARGET_2026) * 100, 100)
        gap = max(ARR_TARGET_2026 - current_arr, 0)

        return {
            "current_arr": current_arr,
            "target_arr": ARR_TARGET_2026,
            "progress_percent": round(progress, 1),
            "gap_usd": gap,
            "months_to_goal": self._calculate_months_to_goal(current_arr),
        }

    def _calculate_months_to_goal(self, current_arr: float) -> int:
        """Estimates time to milestone based on growth velocity."""
        if current_arr >= ARR_TARGET_2026:
            return 0
        if current_arr <= 0:
            return -1  # Undefined

        # log(target / current) / log(1 + growth)
        return math.ceil(
            math.log(ARR_TARGET_2026 / current_arr) / math.log(1 + DEFAULT_GROWTH_RATE)
        )

    def print_dashboard(self):
        """ASCII dashboard for terminal reporting."""
        stats = self.get_stats()
        f = stats["financials"]
        g = stats["goals"]

        print("\n" + "═" * 65)
        print("║" + "💰 REVENUE ENGINE - PERFORMANCE DASHBOARD".center(63) + "║")
        print("═" * 65)

        print(f"\n  💸 REVENUE: MRR: ${f['mrr']:,.0f} | ARR: ${f['arr']:,.0f}")
        print(
            f"  📂 INVOICES: Paid: {stats['volume']['paid_count']} | Outstanding: ${f['outstanding']:,.0f}"
        )

        # Goal Progress
        bar_w = 30
        filled = int(bar_w * g["progress_percent"] / 100)
        bar = "█" * filled + "░" * (bar_w - filled)
        print(f"\n  🎯 2026 GOAL: [{bar}] {g['progress_percent']}%")
        print(f"     └─ Gap to $1M: ${g['gap_usd']:,.0f}")

        if g["months_to_goal"] > 0:
            print(f"     └─ Estimated Time to Goal: {g['months_to_goal']} months")

        print("\n" + "═" * 65 + "\n")
