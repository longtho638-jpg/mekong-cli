"""
Dashboard Service — ROIaaS Phase 5

Business logic for analytics dashboard.
Aggregates query data, calculates metrics, formats for charts.
"""

import csv
import io
import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from cachetools import TTLCache

from src.db.queries.analytics_queries import AnalyticsQueries
from src.db.database import DatabaseConnection
from src.telemetry.rate_limit_metrics import RateLimitMetricsEmitter


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

    # Rate limit observability metrics (Phase 6)
    rate_limit_violations: List[Dict[str, Any]] = field(default_factory=list)
    quota_usage_by_tenant: List[Dict[str, Any]] = field(default_factory=list)
    violations_summary: Dict[str, Any] = field(default_factory=dict)

    # License health metrics (Phase 7)
    license_health: Dict[str, Any] = field(default_factory=dict)
    renewal_prompts: List[Dict[str, Any]] = field(default_factory=list)
    rate_limit_events: List[Dict[str, Any]] = field(default_factory=list)


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
        self._cache_ttl: int = 300  # 5 minutes
        self._queries = AnalyticsQueries(db or DatabaseConnection())
        self._rate_limit_emitter = RateLimitMetricsEmitter(db or DatabaseConnection())
        self._cache: TTLCache = TTLCache(maxsize=100, ttl=self._cache_ttl)

    def _get_cached(self, key: str) -> Optional[DashboardMetrics]:
        """Get cached data if exists."""
        return self._cache.get(key)  # type: ignore

    def _set_cache(self, key: str, data: DashboardMetrics) -> None:
        """Cache data with TTL."""
        self._cache[key] = data

    def invalidate_cache(self, pattern: Optional[str] = None) -> None:
        """Invalidate cache entries."""
        if pattern:
            for key in list(self._cache.keys()):
                if key.startswith(pattern):
                    del self._cache[key]
        else:
            self._cache.clear()

    async def get_metrics(
        self,
        range_days: int = 30,
        license_key: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> DashboardMetrics:
        """
        Get all dashboard metrics.

        Args:
            range_days: Date range for usage data (default: 30 days)
            license_key: Optional filter by license key
            start_date: Optional start date (YYYY-MM-DD)
            end_date: Optional end date (YYYY-MM-DD)

        Returns:
            DashboardMetrics object with all aggregated data
        """
        # Check cache
        cache_key = f"metrics_{range_days}_{license_key}_{start_date}_{end_date}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        # Calculate date range
        if start_date and end_date:
            filter_start = start_date
            filter_end = end_date
        else:
            filter_end = datetime.now().strftime('%Y-%m-%d')
            filter_start = (datetime.now() - timedelta(days=range_days)).strftime('%Y-%m-%d')

        # Fetch all metrics in parallel
        daily_usage = await self._queries.get_daily_usage(filter_start, filter_end)
        weekly_usage = await self._queries.get_weekly_usage()
        monthly_usage = await self._queries.get_monthly_usage()
        active_licenses = await self._queries.get_active_licenses()
        top_endpoints = await self._queries.get_top_endpoints(limit=10)
        revenue = await self._queries.get_revenue_summary()
        tier_dist = await self._queries.get_license_tier_distribution()

        # Fetch rate limit metrics (Phase 6)
        violations_summary = await self._rate_limit_emitter.get_violations_summary(hours=24)
        top_violated = await self._rate_limit_emitter.get_top_violated_tenants(limit=10, hours=24)
        events_by_tier = await self._rate_limit_emitter.get_events_by_tier(hours=24)

        # Fetch license health metrics (Phase 7)
        license_health = await self._queries.get_license_health_summary()
        renewal_prompts = await self._queries.get_expired_licenses_for_renewal(days=7)
        recent_rate_events = await self._rate_limit_emitter.get_recent_events(limit=50)

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
            # Rate limit observability (Phase 6)
            rate_limit_violations=top_violated,
            quota_usage_by_tenant=events_by_tier,
            violations_summary=violations_summary,
            # License health (Phase 7)
            license_health=license_health,
            renewal_prompts=renewal_prompts,
            rate_limit_events=recent_rate_events,
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

        # Filter by license_key if provided
        if license_key:
            daily_data = [d for d in daily_data if d.get('key_id') == license_key]

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

        # Filter by license_key if provided
        if license_key:
            daily = [d for d in daily if d.get('key_id') == license_key]
            active = [a for a in active if a.get('key_id') == license_key]

        export_data = {
            'exported_at': datetime.now().isoformat(),
            'date_range': {'start': start_date, 'end': end_date},
            'filters': {
                'license_key': license_key,
            },
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
