# IPO-059: Executive Dashboard & Reporting System

## Overview

The **Executive Dashboard** provides high-level insights for agency owners and tenant administrators. It aggregates critical business metrics across Revenue, CRM, and Operations into a single view, facilitating data-driven decision-making.

This feature also includes an automated **Report Scheduler** that generates and emails PDF executive summaries on a weekly or monthly basis.

## Key Features

1.  **Real-time Dashboard API**: Aggregates MRR, ARR, Churn, Lead Growth, and Operational Health.
2.  **PDF Report Generation**: Professional-grade PDF reports with visualizations and key insights.
3.  **Automated Scheduling**: Background jobs to send reports via email (Weekly/Monthly).
4.  **Multi-Tenant Support**: Data isolation and tenant-specific reporting.

## Architecture

### 1. API Layer (`backend/api/routers/executive.py`)

-   `GET /executive/dashboard`: Returns JSON data for the frontend dashboard.
    -   **Metrics**: MRR, ARR, Churn Rate, New Leads, Active Subscribers, Runway.
    -   **Trends**: 30-day trend data for charts.
    -   **Alerts**: Critical system or business alerts (e.g., High Churn, Server Load).
-   `GET /executive/report/pdf`: On-demand download of the Executive Report PDF.
-   `POST /executive/scheduler/trigger`: (Admin only) Manually trigger the report generation job.

### 2. Service Layer

-   **RevenueService**: Calculates financial metrics from Stripe/Payment data.
-   **ReportSchedulerService** (`backend/services/report_scheduler.py`): Orchestrates data gathering, PDF generation, and email delivery.
-   **PDFGenerator** (`backend/services/pdf_generator.py`): Uses `reportlab` to render visual PDF reports.

### 3. Frontend

-   Located at `apps/admin/app/executive/page.tsx`.
-   Visualizes data using charts (Recharts) and summary cards.
-   Provides controls to download reports.

## Configuration

### Scheduler
The scheduler is configured to run automatically. You can adjust the frequency in the scheduler service or via environment variables if exposed.

### Email Integration
Reports are sent using the configured email provider (SMTP/Resend/SendGrid) defined in `settings.py`.

## Data Sources

-   **Revenue**: `products/paid/` (Redis/DB) and Stripe Webhooks.
-   **CRM**: Lead tracking system (mocked or integrated with CRM module).
-   **System**: Health checks and resource monitoring.

## Usage

### Fetching Dashboard Data

```bash
curl -X GET "http://localhost:8000/api/executive/dashboard" \
     -H "Authorization: Bearer <token>" \
     -H "X-Tenant-ID: <tenant_id>"
```

### Downloading PDF Report

```bash
curl -X GET "http://localhost:8000/api/executive/report/pdf?days=30" \
     -H "Authorization: Bearer <token>" \
     -o report.pdf
```

## Testing

Run the test suite to verify functionality:

```bash
python -m pytest backend/tests/routers/test_executive.py backend/tests/services/test_report_scheduler.py
```
