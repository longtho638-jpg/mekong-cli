"""
Dashboard UI
============
Presentation layer for the Master Dashboard.
"""
from datetime import datetime

from .types import MasterSummaryDict


class DashboardRenderer:
    """Renders the dashboard stats to the console."""

    @staticmethod
    def render(summary: MasterSummaryDict) -> None:
        """Renders the definitive, full-screen dashboard to the console."""
        score = summary["score"]
        layers = summary["layers"]

        print("\n" + "═" * 70)
        print("║" + "🏯 AGENCY OS - MASTER OPERATIONAL DASHBOARD".center(68) + "║")
        print("║" + "The Closed-Loop $1M ARR Command Center".center(68) + "║")
        print("═" * 70)

        # 1. AGENTIC LAYER
        print(" 🤖 AGENTIC INFRASTRUCTURE")
        print(
            f"    ├─ Agents Active : {layers['agentic']['agents_active']:<5} | Success Rate : {layers['agentic']['success_rate']:.1%}"
        )
        print("    └─ Integration   : Healthy")

        print(" ─" * 35)

        # 2. RETENTION LAYER
        print(" 🏰 STRATEGIC DEFENSIBILITY (MOATS)")
        print(
            f"    ├─ Moat Strength : {layers['retention']['moat_strength']}% | Loyalty Tier : {layers['retention']['loyalty_tier']}"
        )
        print(f"    └─ Switching Cost: ${layers['retention']['switching_cost_usd']:,} USD")

        print(" ─" * 35)

        # 3. REVENUE LAYER
        print(" 💰 REVENUE PERFORMANCE")
        print(f"    ├─ Current ARR   : ${layers['revenue']['arr']:,.0f} | Target ARR   : $1,000,000")
        print(f"    └─ Goal Progress : {layers['revenue']['progress']:.1%}")

        print(" ─" * 35)

        # 4. INFRASTRUCTURE LAYER
        print(" 🏗️ PRODUCTION STACK")
        print(
            f"    ├─ Stack Layers  : {layers['infra']['layers_online']}/10  | Health Score : {layers['infra']['health']}%"
        )
        print("    └─ Status        : Operational")

        print("═" * 70)

        # COMPOSITE SCORE
        bar_w = 40
        filled = int(bar_w * score / 100)
        bar = "█" * filled + "░" * (bar_w - filled)
        print(f" 🏆 OVERALL READINESS: [{bar}] {score}%")

        status_msg = (
            "✅ PEAK PERFORMANCE"
            if score >= 90
            else "⚡ READY FOR SCALE"
            if score >= 75
            else "🔨 ACTIVELY BUILDING"
        )
        print(f"    └─ System Status: {status_msg}")
        print("═" * 70)

        timestamp_str = datetime.fromisoformat(summary['timestamp']).strftime("%Y-%m-%d %H:%M")
        print(f'\n   🏯 "Không đánh mà thắng" | {timestamp_str}\n')
