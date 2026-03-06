---
title: "Phase 2: Analytics Service"
description: "Business logic layer for dashboard metrics"
status: completed
priority: P2
effort: 2h
---

# Phase 2: Analytics Service

## Overview

Service layer process raw query data, calculate metrics, và prepare data cho frontend.

## Requirements

1. Aggregate data từ queries
2. Calculate growth rates, trends
3. Format data cho charts (lightweight-charts)
4. Cache results cho performance

## Files to Create

- `src/analytics/dashboard_service.py` (new)

## Files to Reference

- `src/db/queries/analytics_queries.py` — Raw queries
- `src/db/repository.py` — Connection management
- `src/lib/usage_metering_service.py` — Usage patterns

## Implementation Steps

### 2.1 Create Dashboard Service

```python
# src/analytics/dashboard_service.py
"""
Dashboard Service — ROIaaS Phase 5

Business logic for analytics dashboard.
Aggregates query data, calculates metrics, formats for charts.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from src.db.queries.analytics_queries import AnalyticsQueries
from src.db.repository import get_repository, LicenseRepository


@dataclass
class DashboardMetrics:
    """Dashboard metrics container."""
    api_calls: List[Dict[str, Any]]
    active_licenses: Dict[str, Any]
    top_endpoints: List[Dict[str, Any]]
    estimated_revenue: Dict[str, Any]
    last_updated: str


class DashboardService:
    """
    Analytics dashboard service.

    Features:
    - Data aggregation from queries
    - Growth rate calculations
    - Chart data formatting
    - In-memory caching (5 min TTL)
    """

    def __init__(self, repository: Optional[LicenseRepository] = None):
        self._repo = repository or get_repository()
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cache_ttl: int = 300  # 5 minutes

    def get_dashboard_metrics(
        self,
        range_days: int = 30,
        granularity: str = 'day'
    ) -> DashboardMetrics:
        """
        Get all dashboard metrics.

        Args:
            range_days: Date range (default: 30 days)
            granularity: 'day', 'week', 'month'

        Returns:
            DashboardMetrics object
        """
        # Check cache
        cache_key = f"metrics_{range_days}_{granularity}"
        if self._is_cache_valid(cache_key):
            return self._cache[cache_key]['data']

        # Calculate date range
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=range_days)).strftime('%Y-%m-%d')

        # Fetch data
        with self._repo.get_connection() as conn:
            api_calls = AnalyticsQueries.get_api_call_volume(
                conn, start_date, end_date, granularity
            )
            active_licenses = AnalyticsQueries.get_active_licenses(conn, end_date)
            top_endpoints = AnalyticsQueries.get_top_endpoints(
                conn, start_date, end_date, limit=10
            )
            estimated_revenue = self._calculate_estimated_revenue(conn, end_date)

        # Format metrics
        metrics = DashboardMetrics(
            api_calls=self._format_chart_data(api_calls),
            active_licenses=active_licenses,
            top_endpoints=top_endpoints,
            estimated_revenue=estimated_revenue,
            last_updated=datetime.now().isoformat()
        )

        # Cache results
        self._cache[cache_key] = {
            'data': metrics,
            'timestamp': datetime.now().timestamp()
        }

        return metrics

    def export_data(
        self,
        format: str = 'json',
        date_range: tuple = None,
        license_key: Optional[str] = None
    ) -> str:
        """
        Export data to CSV or JSON.

        Args:
            format: 'csv' or 'json'
            date_range: (start_date, end_date) tuple
            license_key: Filter by specific license

        Returns:
            Exported data string
        """
        # Implementation
```

### 2.2 Add Cache Management

```python
def _is_cache_valid(self, key: str) -> bool:
    """Check if cache entry is still valid."""
    if key not in self._cache:
        return False
    age = datetime.now().timestamp() - self._cache[key]['timestamp']
    return age < self._cache_ttl

def invalidate_cache(self, pattern: Optional[str] = None):
    """Invalidate cache entries."""
    if pattern:
        for key in list(self._cache.keys()):
            if key.startswith(pattern):
                del self._cache[key]
    else:
        self._cache.clear()
```

## Success Criteria

- [ ] `DashboardService` class với `get_dashboard_metrics()` method
- [ ] Cache mechanism với 5-min TTL
- [ ] Export function (CSV/JSON)
- [ ] Service < 200 lines

## Dependencies

- Phase 1: AnalyticsQueries
- PostgreSQL connection

## Risk Assessment

- **Risk:** Cache stale data
- **Mitigation:** Short TTL, manual invalidation API
