"""
Performance and Cache info formatting.
"""
from typing import Any, Dict


class PerformanceViewPresenter:
    def format_cache_status(self, cache_info: Dict[str, Any]) -> str:
        if not cache_info.get("cache_enabled", False): return "🚫 Cache is disabled"
        return f"""
💾 Cache Status
✅ Enabled: Yes
📦 Cache Size: {cache_info.get("cache_size", 0)} items
⏰ TTL: {cache_info.get("ttl_seconds", 0)}s
"""

    def format_performance_metrics(self, metrics: Dict[str, Any]) -> str:
        return f"""
⚡ Performance Metrics
📊 Total Revenue: ${metrics.get("total_revenue", 0):,.2f}
📅 From: {metrics.get("date_range", {}).get("earliest", "N/A")}
   To: {metrics.get("date_range", {}).get("latest", "N/A")}
{self.format_cache_status(metrics.get("cache_info", {}))}
"""
