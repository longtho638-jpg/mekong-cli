"""
Analytics Presenter Facade.
"""
from typing import Any, Dict

from .client_view import ClientViewPresenter
from .forecast_view import ForecastViewPresenter
from .performance_view import PerformanceViewPresenter
from .revenue_view import RevenueViewPresenter


class AnalyticsPresenter(RevenueViewPresenter, ClientViewPresenter, ForecastViewPresenter, PerformanceViewPresenter):
    def __init__(self, agency_name: str = "Nova Digital"):
        self.agency_name = agency_name

    def format_dashboard_text(self, data: Dict[str, Any]) -> str:
        return f"""
╔═══════════════════════════════════════════════════════════╗
║  📊 {data["agency"].upper()[:40]:<40} - ANALYTICS  ║
╠═══════════════════════════════════════════════════════════╣
║  💰 Revenue (Month): ${data["revenue"]["this_month"]:>10,.2f}  Growth: {data["revenue"]["growth"]:>5.1f}% ║
║  👥 Clients Total:   {data["clients"]["total"]:>10}  At Risk: {data["clients"]["at_risk"]:>5} ║
║  🔮 Next Month:      ${data["forecast"]["next_month"]:>10,.2f}  Quarter: ${data["forecast"]["quarter"]:>10,.2f} ║
╚═══════════════════════════════════════════════════════════╝
"""

    def format_revenue_breakdown(self, breakdown: Dict[str, Any]) -> str:
        lines = [f"📊 Revenue Breakdown - {breakdown['period'].title()}", "=" * 50, f"💰 Total: ${breakdown['total']:,.2f}", ""]
        for rev_type, data in breakdown["by_type"].items():
            lines.append(f"  {rev_type.title()}: ${data['amount']:,.2f} ({data['count']} tx)")
        return "\n".join(lines)
