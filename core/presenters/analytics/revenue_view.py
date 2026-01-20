"""
Revenue and MRR formatting for Analytics.
"""
from typing import Any, Dict


class RevenueViewPresenter:
    def format_revenue_report(self, revenue_data: Dict[str, Any]) -> str:
        """Format revenue report cho display."""
        return f"""
📈 Revenue Report - {revenue_data["period"].title()}

💰 Total Revenue: ${revenue_data["total"]:,.2f}
📊 Growth: {revenue_data["growth_percent"]:+.1f}%
🔢 Transactions: {revenue_data["transaction_count"]}

📊 By Type:
{self._format_by_type(revenue_data["by_type"])}

📈 Previous Period: ${revenue_data["previous"]:,.2f}
"""

    def _format_by_type(self, by_type: Dict[str, float]) -> str:
        if not by_type: return "  No data available"
        return "\n".join([f"  {t.title()}: ${a:,.2f}" for t, a in by_type.items()])

    def format_mrr_report(self, mrr_data: Dict[str, Any]) -> str:
        """Format MRR report cho display."""
        return f"""
🔄 MRR Report

💰 Current MRR: ${mrr_data["mrr"]:,.2f}
📅 Annual Run Rate: ${mrr_data["arr"]:,.2f}
📊 Growth: {mrr_data["growth_percent"]:+.1f}%
👥 Retainer Count: {mrr_data["retainer_count"]}

📈 Previous MRR: ${mrr_data["previous_mrr"]:,.2f}
"""
