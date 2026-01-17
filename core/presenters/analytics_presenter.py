"""
📊 Analytics Presenter - UI/Formatting Layer
============================================

Presentation layer cho analytics với clean display formatting.
"""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class AnalyticsPresenter:
    """Presenter class cho analytics UI formatting."""
    
    def __init__(self, agency_name: str = "Nova Digital"):
        self.agency_name = agency_name
        logger.info("Analytics presenter initialized")
    
    def format_dashboard_text(self, dashboard_data: Dict[str, Any]) -> str:
        """Format dashboard summary cho text display."""
        data = dashboard_data
        
        return f"""
╔═══════════════════════════════════════════════════════════╗
║  📊 {data['agency'].upper()[:40]:<40} - ANALYTICS  ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  💰 REVENUE                                               ║
║  ─────────────────────────────────────                    ║
║  This Month:    ${data['revenue']['this_month']:>10,.2f}                   ║
║  Growth:        {data['revenue']['growth']:>10.1f}%                    ║
║  MRR:           ${data['revenue']['mrr']:>10,.2f}                   ║
║  ARR:           ${data['revenue']['arr']:>10,.2f}                   ║
║                                                           ║
║  👥 CLIENTS                                               ║
║  ─────────────────────────────────────                    ║
║  Total:         {data['clients']['total']:>10}                        ║
║  At Risk:       {data['clients']['at_risk']:>10}                        ║
║  Avg LTV:       ${data['clients']['avg_ltv']:>10,.2f}                   ║
║                                                           ║
║  🔮 FORECAST                                              ║
║  ─────────────────────────────────────                    ║
║  Next Month:    ${data['forecast']['next_month']:>10,.2f}                   ║
║  Next Quarter:  ${data['forecast']['quarter']:>10,.2f}                   ║
║                                                           ║
║  🏥 HEALTH                                                ║
║  ─────────────────────────────────────                    ║
║  Revenue:       {data['health_indicators']['revenue_trend']:<30}   ║
║  Clients:       {data['health_indicators']['client_health']:<30}   ║
║  Forecast:      {data['health_indicators']['forecast_confidence']:<30}   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"""
    
    def format_revenue_report(self, revenue_data: Dict[str, Any]) -> str:
        """Format revenue report cho display."""
        return f"""
📈 Revenue Report - {revenue_data['period'].title()}

💰 Total Revenue: ${revenue_data['total']:,.2f}
📊 Growth: {revenue_data['growth_percent']:+.1f}%
🔢 Transactions: {revenue_data['transaction_count']}

📊 By Type:
{self._format_by_type(revenue_data['by_type'])}

📈 Previous Period: ${revenue_data['previous']:,.2f}
"""
    
    def _format_by_type(self, by_type: Dict[str, float]) -> str:
        """Format revenue by type breakdown."""
        if not by_type:
            return "  No data available"
        
        lines = []
        for rev_type, amount in by_type.items():
            lines.append(f"  {rev_type.title()}: ${amount:,.2f}")
        
        return "\n".join(lines)
    
    def format_mrr_report(self, mrr_data: Dict[str, Any]) -> str:
        """Format MRR report cho display."""
        return f"""
🔄 MRR Report

💰 Current MRR: ${mrr_data['mrr']:,.2f}
📅 Annual Run Rate: ${mrr_data['arr']:,.2f}
📊 Growth: {mrr_data['growth_percent']:+.1f}%
👥 Retainer Count: {mrr_data['retainer_count']}

📈 Previous MRR: ${mrr_data['previous_mrr']:,.2f}
"""
    
    def format_client_overview(self, client_data: Dict[str, Any]) -> str:
        """Format client overview cho display."""
        return f"""
👥 Client Overview

📊 Total Clients: {client_data['total_clients']}
💰 Total Revenue: ${client_data['total_revenue']:,.2f}
💵 Avg LTV: ${client_data['avg_lifetime_value']:,.2f}
❤️  Avg Health: {client_data['avg_health_score']:.1f}

⚠️  At Risk Clients: {client_data['at_risk_count']}

🏆 Top Clients:
{self._format_top_clients(client_data.get('top_clients', []))}
"""
    
    def _format_top_clients(self, top_clients: List) -> str:
        """Format top clients list."""
        if not top_clients:
            return "  No data available"
        
        lines = []
        for i, client in enumerate(top_clients, 1):
            lines.append(f"  {i}. {client.client_name}: ${client.total_revenue:,.2f}")
        
        return "\n".join(lines)
    
    def format_forecast_report(self, forecasts: List[Dict[str, Any]]) -> str:
        """Format revenue forecast cho display."""
        lines = [
            "🔮 Revenue Forecast",
            "=" * 40
        ]
        
        for forecast in forecasts:
            lines.append(f"📅 {forecast['month']}:")
            lines.append(f"  💰 Total: ${forecast['projected_total']:,.2f}")
            lines.append(f"  🔄 MRR: ${forecast['projected_mrr']:,.2f}")
            lines.append(f"  💡 One-time: ${forecast['projected_one_time']:,.2f}")
            lines.append(f"  🎯 Confidence: {forecast['confidence']}%")
            lines.append("")
        
        return "\n".join(lines)
    
    def format_health_indicators(self, health_data: Dict[str, Any]) -> str:
        """Format health indicators cho display."""
        return f"""
🏥 Agency Health Check

💰 Revenue Trend: {health_data['revenue_trend']}
👥 Client Health: {health_data['client_health']}
🔮 Forecast: {health_data['forecast_confidence']}
"""
    
    def format_anomaly_report(self, anomalies: List[Dict[str, Any]]) -> str:
        """Format anomaly report cho display."""
        if not anomalies:
            return "✅ No revenue anomalies detected."
        
        lines = [
            "⚠️  Revenue Anomalies Detected",
            "=" * 40
        ]
        
        for anomaly in anomalies:
            lines.append(f"🔸 Entry {anomaly['entry_id']}:")
            lines.append(f"   Amount: ${anomaly['amount']:,.2f}")
            lines.append(f"   Type: {anomaly['type']}")
            lines.append(f"   Date: {anomaly['date'].strftime('%Y-%m-%d')}")
            lines.append(f"   Z-Score: {anomaly['z_score']:.2f}")
            lines.append("")
        
        return "\n".join(lines)
    
    def format_growth_trend(self, trends: List[Dict[str, Any]]) -> str:
        """Format growth trend cho display."""
        lines = [
            "📈 Monthly Growth Trend",
            "=" * 40
        ]
        
        for trend in trends[-6:]:  # Last 6 months
            lines.append(f"📅 {trend['month']}:")
            lines.append(f"  💰 Revenue: ${trend['revenue']:,.2f}")
            lines.append(f"  📊 Transactions: {trend['transactions']}")
            lines.append("")
        
        return "\n".join(lines)
    
    def format_revenue_breakdown(self, breakdown: Dict[str, Any]) -> str:
        """Format revenue breakdown cho display."""
        lines = [
            f"📊 Revenue Breakdown - {breakdown['period'].title()}",
            "=" * 50,
            f"💰 Total: ${breakdown['total']:,.2f}",
            f"🔄 Recurring Ratio: {breakdown['recurring_ratio']:.1%}",
            "",
            "📊 By Type:"
        ]
        
        for rev_type, data in breakdown['by_type'].items():
            lines.append(f"  {rev_type.title()}: ${data['amount']:,.2f} ({data['count']} transactions)")
            if data['recurring'] > 0:
                lines.append(f"    🔄 Recurring: {data['recurring']} transactions")
        
        lines.append("")
        lines.append("👥 By Client (Top 5):")
        
        # Sort by amount và take top 5
        sorted_clients = sorted(
            breakdown['by_client'].items(),
            key=lambda x: x[1]['amount'],
            reverse=True
        )[:5]
        
        for client_id, data in sorted_clients:
            lines.append(f"  {client_id}: ${data['amount']:,.2f} ({data['count']} transactions)")
        
        return "\n".join(lines)
    
    def format_cache_status(self, cache_info: Dict[str, Any]) -> str:
        """Format cache status cho display."""
        if not cache_info.get("cache_enabled", False):
            return "🚫 Cache is disabled"
        
        return f"""
💾 Cache Status
✅ Enabled: Yes
📦 Cache Size: {cache_info.get('cache_size', 0)} items
⏰ TTL: {cache_info.get('ttl_seconds', 0)}s
🔑 Keys: {len(cache_info.get('keys', []))}
"""
    
    def format_performance_metrics(self, metrics: Dict[str, Any]) -> str:
        """Format performance metrics."""
        return f"""
⚡ Performance Metrics

📊 Data Summary:
  Revenue Entries: {metrics.get('revenue_entries_count', 0)}
  Client Metrics: {metrics.get('client_metrics_count', 0)}
  Total Revenue: ${metrics.get('total_revenue', 0):,.2f}

📅 Date Range:
  From: {metrics.get('date_range', {}).get('earliest', 'N/A')}
  To: {metrics.get('date_range', {}).get('latest', 'N/A')}

{self.format_cache_status(metrics.get('cache_info', {}))}
"""