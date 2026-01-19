"""
Finance Module - Presentation Layer
"""

from .entities import FinancialRatio
from .services import FinancialReportsService


class FinancePresenter:
    @staticmethod
    def format_dashboard(service: FinancialReportsService) -> str:
        """Render the CFO Financial Dashboard."""
        if not service.pnl_history:
            return "No financial history data."

        latest = service.pnl_history[0]
        overall_score = service.ratios.get("net_margin", FinancialRatio("", 0, 0)).value

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 FINANCIAL REPORTS - CFO DASHBOARD{' ' * 21}║",
            f"║  {latest.period} │ ${latest.revenue:,.0f} revenue │ {overall_score:.0f}% net margin{' ' * 13}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📈 PROFIT & LOSS                                         ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    Gross Revenue:  ${latest.revenue:>12,.0f}                      ║",
            f"║    COGS:           ${latest.cogs:>12,.0f}                      ║",
            f"║    Gross Profit:   ${latest.gross_profit:>12,.0f}                      ║",
            f"║    Op Expenses:    ${latest.operating_expenses:>12,.0f}                      ║",
            f"║    ✅ Net Income:  ${latest.net_income:>12,.0f}                      ║",
            "║                                                           ║",
            "║  📊 PERFORMANCE RATIOS                                    ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        for r in service.ratios.values():
            status = "🟢" if r.value >= r.target else "🟡"
            bar_len = min(10, int(r.value / 10))
            bar = "█" * bar_len + "░" * (10 - bar_len)
            lines.append(f"║    {status} {r.name:<18} │ {bar} │ {r.value:>5.1f}{r.unit}  ║")

        lines.extend(
            [
                "║                                                           ║",
                "║  [📊 P&L]  [📈 Trends]  [💰 Forecast]  [⚙️ Settings]      ║",
                "╠═══════════════════════════════════════════════════════════╣",
                f"║  🏯 {service.agency_name[:40]:<40} - Big Picture!      ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )
        return "\n".join(lines)
