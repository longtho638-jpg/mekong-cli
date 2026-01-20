"""
Client overview and health indicators formatting.
"""
from typing import Any, Dict, List


class ClientViewPresenter:
    def format_client_overview(self, client_data: Dict[str, Any]) -> str:
        """Format client overview cho display."""
        return f"""
👥 Client Overview

📊 Total Clients: {client_data["total_clients"]}
💰 Total Revenue: ${client_data["total_revenue"]:,.2f}
💵 Avg LTV: ${client_data["avg_lifetime_value"]:,.2f}
❤️  Avg Health: {client_data["avg_health_score"]:.1f}

⚠️  At Risk Clients: {client_data["at_risk_count"]}

🏆 Top Clients:
{self._format_top_clients(client_data.get("top_clients", []))}
"""

    def _format_top_clients(self, top_clients: List) -> str:
        if not top_clients: return "  No data available"
        return "\n".join([f"  {i}. {c.client_name}: ${c.total_revenue:,.2f}" for i, c in enumerate(top_clients, 1)])

    def format_health_indicators(self, health_data: Dict[str, Any]) -> str:
        return f"""
🏥 Agency Health Check

💰 Revenue Trend: {health_data["revenue_trend"]}
👥 Client Health: {health_data["client_health"]}
🔮 Forecast: {health_data["forecast_confidence"]}
"""
