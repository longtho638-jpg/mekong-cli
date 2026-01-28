# Executive Dashboard Guide (IPO-059)

## Overview
The Executive Dashboard provides C-suite executives with a high-level view of the agency's performance, focusing on key financial metrics, operational health, and strategic growth indicators.

## Key Features
- **Real-time KPI Tracking**: MRR, ARR, Churn Rate, and Active Customers.
- **Financial Health**: Cash flow visualization, revenue trends, and burn rate analysis.
- **Operational Metrics**: Team utilization, project status summary, and SLA compliance.
- **Strategic Insights**: AI-generated summaries of business performance and recommended actions.

## Architecture
- **Frontend**: `apps/admin/app/executive/` using MD3 components and Recharts for visualization.
- **Backend Service**: `backend/services/dashboard_service.py` aggregates data from disparate sources (Billing, CRM, Project Management).
- **Data Source**: Aggregated via `AnalyticsService` from Supabase and cached in Redis for performance.

## Usage
1. **Access**: Navigate to `/executive` in the Admin Dashboard.
2. **Filtering**: Use the date range picker to analyze performance over specific periods (Month, Quarter, Year).
3. **Export**: Download reports in PDF or CSV format for board meetings.

## Configuration
- **Widgets**: Dashboard layout and widget visibility can be customized per user role via the `dashboard_config` table.
- **Thresholds**: KPI alert thresholds (e.g., Churn > 5%) are configurable in System Settings.

## Troubleshooting
- **Missing Data**: Ensure the background aggregation jobs (Celery) are running correctly. Check `backend.log` for aggregation errors.
- **Cache Staleness**: Metrics are cached for 1 hour. Use the "Refresh" button to force a cache invalidation and data reload.
