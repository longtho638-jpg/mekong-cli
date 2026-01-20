"""
Cash Flow Tracker Facade.
"""
from typing import Any, Dict

from sortedcontainers import SortedDict

from .models import ExpenseCategory, IncomeCategory, Transaction, TransactionType
from .tracker import CashFlowTracker as BaseTracker


class CashFlowTracker(BaseTracker):
    def get_stats(self) -> Dict[str, Any]:
        """Aggregate financial stats."""
        income = sum(t.amount for t in self.transactions if t.type == TransactionType.INCOME)
        expenses = sum(t.amount for t in self.transactions if t.type == TransactionType.EXPENSE)

        return {
            "opening": self.opening_balance,
            "current": self.get_current_balance(),
            "income": income,
            "expenses": expenses,
            "net_flow": income - expenses,
            "runway": self.get_runway_months(),
            "transactions_count": len(self.transactions),
        }

    def format_dashboard(self) -> str:
        """Render Cash Flow Dashboard."""
        stats = self.get_stats()

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💵 CASH FLOW TRACKER{' ' * 41}║",
            f"║  ${stats['current']:,.0f} balance │ {stats['runway']:>4.1f} months runway{' ' * 18}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  💰 CASH SUMMARY                                          ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    📈 Opening Balance:    ${stats['opening']:>12,.0f}              ║",
            f"║    💵 Total Income:       ${stats['income']:>12,.0f}              ║",
            f"║    💸 Total Expenses:     ${stats['expenses']:>12,.0f}              ║",
            f"║    📊 Net Cash Flow:      ${stats['net_flow']:>+12,.0f}              ║",
            f"║    💰 Current Balance:    ${stats['current']:>12,.0f}              ║",
            "║                                                           ║",
            "║  📈 INCOME BREAKDOWN                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        income_by_cat = {}
        for tx in self.transactions:
            if tx.type == TransactionType.INCOME:
                income_by_cat[tx.category] = income_by_cat.get(tx.category, 0.0) + tx.amount

        cat_icons = {"retainer": "🔄", "project": "📋", "consulting": "💼", "other": "📝"}
        for cat, amount in sorted(income_by_cat.items(), key=lambda x: x[1], reverse=True):
            icon = cat_icons.get(cat, "💵")
            pct = (amount / stats["income"] * 100) if stats["income"] else 0.0
            lines.append(f"║    {icon} {cat.title():<12} │ ${amount:>10,.0f} │ {pct:>4.0f}%  ║")

        lines.extend([
            "║                                                           ║",
            "║  💸 EXPENSE BREAKDOWN                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])

        expense_by_cat = {}
        for tx in self.transactions:
            if tx.type == TransactionType.EXPENSE:
                expense_by_cat[tx.category] = expense_by_cat.get(tx.category, 0.0) + tx.amount

        exp_icons = {
            "payroll": "👥", "rent": "🏢", "software": "💻",
            "marketing": "📢", "utilities": "⚡", "other": "📝",
        }
        for cat, amount in sorted(expense_by_cat.items(), key=lambda x: x[1], reverse=True):
            icon = exp_icons.get(cat, "💸")
            pct = (amount / stats["expenses"] * 100) if stats["expenses"] else 0.0
            lines.append(f"║    {icon} {cat.title():<12} │ ${amount:>10,.0f} │ {pct:>4.0f}%  ║")

        runway = stats["runway"]
        r_icon, r_status = ("🟢", "Healthy ") if runway >= 6 else (("🟡", "Caution ") if runway >= 3 else ("🔴", "Critical"))

        lines.extend([
            "║                                                           ║",
            "║  🎯 RUNWAY STATUS                                         ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    {r_icon} {runway:>4.1f} months │ {r_status:<30} ║",
            "║                                                           ║",
            "║  [💵 Transactions]  [📊 Forecast]  [📈 Reports]           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Castle {self.agency_name[:40]:<40} - Stability!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])

        return "\n".join(lines)
