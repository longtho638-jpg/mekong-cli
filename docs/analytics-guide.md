# Analytics & BI Guide

## Overview

The Analytics & BI system provides comprehensive insights into user behavior, system performance, and business metrics. It includes:

1.  **Funnel Analysis**: Track user conversion through multi-step flows.
2.  **Cohort Analysis**: Measure user retention over time (weekly/monthly).
3.  **Real-time Analytics**: Live updates via WebSockets.
4.  **ETL Pipeline**: Daily aggregation of raw events into metrics snapshots.

## Architecture

### Services

-   **`AnalyticsService`**: Core service for event tracking and basic stats.
-   **`FunnelService`**: specialized logic for funnel conversion calculation.
-   **`CohortService`**: specialized logic for retention matrix calculation.
-   **`ETLService`**: Background jobs for aggregating data.

### Database Schema

-   `analytics_events`: Raw event stream (partitioned by time).
-   `metrics_snapshots`: Daily aggregated metrics (MRR, Active Users, etc.).

## API Endpoints

### 1. Funnel Analysis

**POST** `/api/v1/analytics/funnel`

Calculate conversion rates for a sequence of events.

**Request:**

```json
{
  "steps": ["signup", "onboarding_completed", "subscription_created"],
  "start_date": "2023-01-01",
  "end_date": "2023-01-31"
}
```

**Response:**

```json
{
  "funnel": [
    {
      "step": "signup",
      "count": 1000,
      "conversion_rate": 100.0,
      "drop_off": 0
    },
    {
      "step": "onboarding_completed",
      "count": 500,
      "conversion_rate": 50.0,
      "drop_off": 500
    }
  ],
  "total_entries": 1000,
  "overall_conversion": 10.5
}
```

### 2. Cohort Analysis

**GET** `/api/v1/analytics/cohort`

**Parameters:**

-   `period_type`: "weekly" or "monthly"
-   `periods`: Number of periods to analyze (default: 8)

**Response:**

```json
{
  "cohorts": [
    {
      "cohort_date": "2023-W01",
      "users": 500,
      "data": [
        {"period": 0, "percentage": 100.0, "count": 500},
        {"period": 1, "percentage": 45.0, "count": 225}
      ]
    }
  ]
}
```

### 3. Real-time Updates

**WebSocket** `/ws/analytics/live`

Connect to receive live updates.

**Messages:**

-   `{"type": "active_users", "count": 120}`
-   `{"type": "new_event", "event": "purchase", "amount": 99.0}`

## ETL Process

The ETL job runs daily at 00:00 UTC via `scheduler`.

**Manual Trigger:**
**POST** `/api/v1/analytics/etl/run` (Admin only)

## Adding New Metrics

1.  Define metric calculation in `AnalyticsService`.
2.  Add to `ETLService.run_daily_etl`.
3.  Expose via `get_dashboard_overview` or new endpoint.
