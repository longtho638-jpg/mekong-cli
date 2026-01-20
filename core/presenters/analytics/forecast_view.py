"""
Forecast, Trends and Anomaly formatting.
"""
from typing import Any, Dict, List


class ForecastViewPresenter:
    def format_forecast_report(self, forecasts: List[Dict[str, Any]]) -> str:
        lines = ["🔮 Revenue Forecast", "=" * 40]
        for f in forecasts:
            lines.extend([f"📅 {f['month']}:", f"  💰 Total: ${f['projected_total']:,.2f}", f"  🔄 MRR: ${f['projected_mrr']:,.2f}", f"  🎯 Confidence: {f['confidence']}%", ""])
        return "\n".join(lines)

    def format_anomaly_report(self, anomalies: List[Dict[str, Any]]) -> str:
        if not anomalies: return "✅ No revenue anomalies detected."
        lines = ["⚠️  Revenue Anomalies Detected", "=" * 40]
        for a in anomalies:
            lines.extend([f"🔸 Entry {a['entry_id']}:", f"   Amount: ${a['amount']:,.2f}", f"   Date: {a['date'].strftime('%Y-%m-%d')}", f"   Z-Score: {a['z_score']:.2f}", ""])
        return "\n".join(lines)

    def format_growth_trend(self, trends: List[Dict[str, Any]]) -> str:
        lines = ["📈 Monthly Growth Trend", "=" * 40]
        for t in trends[-6:]:
            lines.extend([f"📅 {t['month']}:", f"  💰 Revenue: ${t['revenue']:,.2f}", f"  📊 Transactions: {t['transactions']}", ""])
        return "\n".join(lines)
