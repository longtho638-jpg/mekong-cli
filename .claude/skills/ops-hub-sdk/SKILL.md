---
name: ops-hub-sdk
description: Unified operations SDK — analytics, observability, notifications, newsletter. Use for event tracking, metrics, alerting, multi-channel notifications.
license: MIT
version: 1.0.0
---

# Ops Hub SDK Skill

Build operational infrastructure with unified analytics, observability, and notification facades.

## When to Use

- Event tracking and funnel analysis
- Application performance monitoring (APM)
- Distributed tracing and metrics collection
- Multi-channel notification delivery
- Alert rule configuration
- Newsletter and email campaigns
- Operational dashboards

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/ops-hub-sdk/analytics` | AnalyticsFacade | Events, funnels, cohorts |
| `@agencyos/ops-hub-sdk/observability` | ObservabilityFacade | Metrics, traces, alerts |
| `@agencyos/ops-hub-sdk/notifications` | NotificationsFacade | Multi-channel delivery |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-analytics` | Analytics engine |
| `@agencyos/vibe-observability` | Metrics + tracing |
| `@agencyos/vibe-ops` | Operational automation |
| `@agencyos/vibe-notifications` | Notification routing |
| `@agencyos/vibe-newsletter` | Email campaigns |
