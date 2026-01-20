"""
🏰 Moat Dashboard
=================

Renders the Moat Strategy Dashboard.
"""

from typing import Any, Dict

from .models import Moat


class MoatDashboard:
    """Handles the visual presentation of the Moat Strategy."""

    @staticmethod
    def render(
        moats: Dict[str, Moat], aggregate_strength: int, costs: Dict[str, Any]
    ) -> None:
        """Renders the dashboard to stdout."""
        print("\n" + "═" * 65)
        print("║" + "🏰 AGENCY OS - ĐỘC QUYỀN HÓA CHIẾN LƯỢC (5 MOATS)".center(63) + "║")
        print("═" * 65)

        for m in moats.values():
            bar_w = 20
            filled = int(bar_w * m.strength / 100)
            bar = "█" * filled + "░" * (bar_w - filled)
            print(f"\n  {m.emoji} {m.name.upper():<15} | [{bar}] {m.strength}%")
            print(f"     └─ {m.description}")
            print(f"     └─ Chi phí rời bỏ: {m.switching_cost_label}")

        print("\n" + "─" * 65)
        print(f"  💰 CHI PHÍ RỜI BỎ ƯỚC TÍNH: ${costs['financial_usd']:,} USD")
        print(f"  ⏳ THỜI GIAN KHÔI PHỤC:     {costs['hours']} giờ làm việc")
        print("\n" + "═" * 65)
        print(f"  🏆 TỔNG THỂ SỨC MẠNH: {aggregate_strength}% | {costs['verdict']}")
        print("═" * 65 + "\n")
