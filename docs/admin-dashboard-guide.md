# Admin Dashboard User Guide

## Overview

The AgencyOS Admin Dashboard is the central control hub for managing the entire system. It allows administrators, owners, and developers to monitor system health, manage users, configure settings, and analyze performance.

**Access URL:** `/admin` (Requires Admin or Owner role)

## Dashboard Sections

### 1. Dashboard Overview
**Route:** `/admin/dashboard`

The landing page provides a high-level view of the system status:
- **Key Metrics:** MRR, Active Users, API Requests, Webhook Health.
- **Revenue Trend:** Visual chart of revenue growth over time.
- **System Status:** Operational status of critical components (API, Database, Cache, Webhooks).

### 2. User Management
**Route:** `/admin/users`

Manage system users and their permissions.
- **List View:** Search and filter users by role or status.
- **Detail View:** Click on a user to view their profile, activity log, and metadata.
- **Actions:**
    - **Ban User:** Suspend access for a user.
    - **Update Role:** Change user role (Owner only).
    - **Reset Password:** Trigger a password reset email.

### 3. Webhook Management
**Route:** `/admin/webhooks`

Configure and monitor outgoing webhooks.
- **Configs:** Create and manage webhook endpoints (URL, Secret, Events).
- **Health Dashboard:** Real-time metrics on delivery success rates and latency.
- **DLQ (Dead Letter Queue):** View and replay failed webhook deliveries.
- **Recent Events:** Log of all fired events and their delivery status.

### 4. Analytics
**Route:** `/admin/analytics`

Deep dive into business and technical metrics.
- **Revenue:** MRR, ARR, Churn analysis.
- **Subscriptions:** Plan distribution and growth.
- **API Usage:** Request volume and error rates (planned).

### 5. Payments
**Route:** `/admin/payments`

Transaction history and financial records.
- **Transactions:** List of all payments (Stripe, PayPal).
- **Status:** Monitor successful and failed charges.
- **Refunds:** Process refunds (planned).

### 6. Settings & Audit
**Route:** `/admin/settings` | `/admin/audit`

System configuration and security.
- **Feature Flags:** Toggle system features on/off dynamically.
- **System Config:** Update global settings (maintenance mode, limits).
- **Audit Log:** Immutable record of all administrative actions for security compliance.

## Roles & Permissions

| Role | Access Level |
|------|--------------|
| **Owner** | Full access, including billing and critical system settings. |
| **Admin** | Manage users, webhooks, and view all data. Cannot change Owner settings. |
| **Developer** | Manage webhooks and view technical logs. |
| **Viewer** | Read-only access to dashboards and user lists. |

## Troubleshooting

- **Dashboard not loading:** Check your internet connection and verify you are logged in with an authorized account.
- **Data missing:** Some charts may take up to 30s to refresh. Check the "Health" tab for system outages.
- **Action denied:** Verify you have the correct role for the action you are trying to perform.
