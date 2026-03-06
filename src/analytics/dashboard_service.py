"""
Dashboard Service — ROIaaS Phase 5

Business logic for analytics dashboard.
Aggregates query data, calculates metrics, formats for charts.
"""

import csv
import io
import json
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple

from src.db.queries.analytics_queries import AnalyticsQueries
from src.db.database import DatabaseConnection


@dataclass
class DashboardMetrics:
    """Dashboard metrics container."""
    api_calls: List[Dict[str, Any]] = field(default_factory=list)
    weekly_usage: List[Dict[str, Any]] = field(default_factory=list)
    monthly_usage: List[Dict[str, Any]] = field(default_factory=list)
    active_licenses: Dict[str, Any] = field(default_factory=dict)
    top_endpoints: List[Dict[str, Any]] = field(default_factory=list)
    revenue: Dict[str, Any] = field(default_factory=dict)
    tier_distribution: Dict[str, Any] = field(default_factory=dict)
    last_updated: str = ""


class DashboardService:
    """
    Analytics dashboard service.

    Features:
    - Data aggregation from queries
    - Growth rate calculations
    - Chart data formatting
    - In-memory caching (5 min TTL)
    - CSV/JSON export
    """

    def __init__(self, db: Optional[DatabaseConnection] = None) -> None:
        """Initialize service with database connection."""
        self._queries = AnalyticsQueries(db or DatabaseConnection())
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cache_ttl: int = 300  # 5 minutes

    def _is_cache_valid(self, key: str) -> bool:
        """Check if cache entry is still valid."""
        if key not in self._cache:
            return False
        age = datetime.now().timestamp() - self._cache[key]['timestamp']
        return age < self._cache_ttl

    def _get_cached(self, key: str) -> Optional[DashboardMetrics]:
        """Get cached data if valid."""
        if self._is_cache_valid(key):
            return self._cache[key]['data']
        return None

    def _set_cache(self, key: str, data: DashboardMetrics) -> None:
        """Cache data with timestamp."""
        self._cache[key] = {
            'data': data,
            'timestamp': datetime.now().timestamp(),
        }

    def invalidate_cache(self, pattern: Optional[str] = None) -> None:
        """Invalidate cache entries."""
        if pattern:
            for key in list(self._cache.keys()):
                if key.startswith(pattern):
                    del self._cache[key]
        else:
            self._cache.clear()

    async def get_metrics(self, range_days: int = 30) -> DashboardMetrics:
        """
        Get all dashboard metrics.

        Args:
            range_days: Date range for usage data (default: 30 days)

        Returns:
            DashboardMetrics object with all aggregated data
        """
        # Check cache
        cache_key = f"metrics_{range_days}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        # Fetch all metrics in parallel
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=range_days)).strftime('%Y-%m-%d')

        daily_usage = await self._queries.get_daily_usage(start_date, end_date)
        weekly_usage = await self._queries.get_weekly_usage()
        monthly_usage = await self._queries.get_monthly_usage()
        active_licenses = await self._queries.get_active_licenses()
        top_endpoints = await self._queries.get_top_endpoints(limit=10)
        revenue = await self._queries.get_revenue_summary()
        tier_dist = await self._queries.get_license_tier_distribution()

        # Build metrics
        metrics = DashboardMetrics(
            api_calls=self._format_chart_data(daily_usage, 'daily'),
            weekly_usage=self._format_chart_data(weekly_usage, 'weekly'),
            monthly_usage=self._format_chart_data(monthly_usage, 'monthly'),
            active_licenses={
                'total': len(active_licenses),
                'licenses': active_licenses[:20],  # Top 20
            },
            top_endpoints=top_endpoints,
            revenue=revenue,
            tier_distribution=tier_dist,
            last_updated=datetime.now().isoformat(),
        )

        self._set_cache(cache_key, metrics)
        return metrics

    def _format_chart_data(
        self,
        data: List[Dict[str, Any]],
        granularity: str = 'daily',
    ) -> List[Dict[str, Any]]:
        """Format data for chart libraries."""
        formatted = []
        for row in data:
            point = {
                'date': row.get('date', row.get('week_start', row.get('month', ''))),
                'calls': int(row.get('calls', 0)),
                'unique_licenses': int(row.get('unique_licenses', 0)),
            }
            formatted.append(point)
        return formatted

    def calculate_growth_rate(
        self,
        current: float,
        previous: float,
    ) -> float:
        """Calculate growth rate percentage."""
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 2)

    async def export_to_csv(
        self,
        date_range: Tuple[str, str],
        license_key: Optional[str] = None,
    ) -> str:
        """
        Export usage data to CSV.

        Args:
            date_range: (start_date, end_date) tuple in YYYY-MM-DD format
            license_key: Optional filter by license

        Returns:
            CSV string
        """
        start_date, end_date = date_range
        daily_data = await self._queries.get_daily_usage(start_date, end_date)

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['date', 'api_calls', 'unique_licenses'])

        for row in daily_data:
            writer.writerow([
                row.get('date', ''),
                row.get('calls', 0),
                row.get('unique_licenses', 0),
            ])

        return output.getvalue()

    async def export_to_json(
        self,
        date_range: Tuple[str, str],
        license_key: Optional[str] = None,
    ) -> str:
        """
        Export usage data to JSON.

        Args:
            date_range: (start_date, end_date) tuple in YYYY-MM-DD format
            license_key: Optional filter by license

        Returns:
            JSON string
        """
        start_date, end_date = date_range

        # Fetch all data
        daily = await self._queries.get_daily_usage(start_date, end_date)
        weekly = await self._queries.get_weekly_usage()
        monthly = await self._queries.get_monthly_usage()
        active = await self._queries.get_active_licenses()
        revenue = await self._queries.get_revenue_summary()
        tiers = await self._queries.get_license_tier_distribution()

        export_data = {
            'exported_at': datetime.now().isoformat(),
            'date_range': {'start': start_date, 'end': end_date},
            'usage': {
                'daily': self._format_chart_data(daily, 'daily'),
                'weekly': self._format_chart_data(weekly, 'weekly'),
                'monthly': self._format_chart_data(monthly, 'monthly'),
            },
            'licenses': {
                'active_count': len(active),
                'tier_distribution': tiers,
            },
            'revenue': revenue,
        }

        return json.dumps(export_data, indent=2)
