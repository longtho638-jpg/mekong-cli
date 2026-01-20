"""
Revenue Reporting Logic.
"""
from typing import Any, Dict


class RevenueReporting:
    """Handles financial reporting and dashboards."""

    def print_dashboard(self, stats: Dict[str, Any]):
        """ASCII dashboard for terminal reporting."""
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
