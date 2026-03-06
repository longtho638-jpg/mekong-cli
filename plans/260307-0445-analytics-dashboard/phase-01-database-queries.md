---
title: "Phase 1: Database Queries Layer"
description: "Analytics queries for usage metrics, active licenses, and billing estimation"
status: completed
priority: P2
effort: 1h
---

# Phase 1: Database Queries Layer

## Overview

Tầng truy vấn database cho analytics dashboard, sử dụng PostgreSQL repository có sẵn.

## Requirements

1. Query API call volume theo ngày/tuần/tháng
2. Query active license keys
3. Query top endpoints
4. Query estimated billing dựa trên usage tier

## Files to Create

- `src/db/queries/analytics_queries.py` (new)

## Files to Reference

- `src/db/repository.py` — LicenseRepository pattern
- `src/db/schema.py` — Table structures
- `src/usage/usage_tracker.py` — Usage tracking logic

## Implementation Steps

### 1.1 Create Analytics Queries Module

```python
# src/db/queries/analytics_queries.py
"""
Analytics Queries — ROIaaS Phase 5

Query builders for dashboard metrics:
- API call volume (daily/weekly/monthly)
- Active license keys
- Top endpoints
- Estimated billing
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from psycopg_pool import ConnectionPool


class AnalyticsQueries:
    """Analytics query builders."""

    @staticmethod
    def get_api_call_volume(
        conn,
        start_date: str,
        end_date: str,
        granularity: str = 'day'
    ) -> List[Dict[str, Any]]:
        """
        Get API call volume for date range.

        Args:
            conn: Database connection
            start_date: YYYY-MM-DD format
            end_date: YYYY-MM-DD format
            granularity: 'day', 'week', or 'month'

        Returns:
            List of {date, calls, unique_licenses}
        """
        # Implementation

    @staticmethod
    def get_active_licenses(
        conn,
        date: str,
        period: str = 'daily'
    ) -> Dict[str, Any]:
        """
        Get Daily/Monthly Active Licenses (DAL/MAL).

        Returns:
            {total, by_tier, activity_rate}
        """

    @staticmethod
    def get_top_endpoints(
        conn,
        start_date: str,
        end_date: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get most-used endpoints.

        Returns:
            List of {endpoint, calls, avg_duration}
        """

    @staticmethod
    def get_estimated_billing(
        conn,
        license_key: str,
        month: str
    ) -> Dict[str, Any]:
        """
        Calculate estimated billing based on usage tier.

        Returns:
            {base_price, overage_charges, total}
        """
```

### 1.2 Add Indexes for Performance

```sql
-- Add to schema.py as MIGRATION_004
CREATE INDEX IF NOT EXISTS idx_usage_records_date
ON usage_records(date DESC);

CREATE INDEX IF NOT EXISTS idx_usage_records_commands_count
ON usage_records(commands_count DESC);
```

## Success Criteria

- [ ] `analytics_queries.py` created với 4 query methods
- [ ] Queries tested với psql
- [ ] Indexes added cho performance
- [ ] Code < 200 lines/method

## Dependencies

- PostgreSQL connection pool (có sẵn)
- Schema: `licenses`, `usage_records` tables

## Risk Assessment

- **Risk:** Queries chậm với large dataset
- **Mitigation:** Add indexes, use materialized views nếu cần
