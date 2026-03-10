---
title: "Phase 6 License Enforcement — Trade Gating & Grace Period"
description: "Implement tier-based trade execution gating, backtest depth limits, 15-min grace period, KV rate limiting, and multi-channel notifications"
status: pending
priority: P1
effort: 8h
branch: master
tags: [raas, license, enforcement, rate-limiting, notifications]
created: 2026-03-08
---

# Phase 6 License Enforcement Plan

## Overview

Comprehensive license enforcement system with real-time trade gating, usage quotas, grace period handling, and multi-channel notifications.

## Tier Limits Summary

| Feature | FREE | PRO | ENTERPRISE |
|---------|------|-----|------------|
| Concurrent Strategies | 1 | 5 | Unlimited |
| Orders/Day | 10 | 100 | 1000 |
| Backtest History | 1 month | 1 year | Unlimited |
| Rate Limit (req/min) | 10 | 100 | 1000 |
| Grace Period | None | 15 min | 30 min |

## Architecture

```mermaid
graph TD
    A[Trade Request] --> B{License Check}
    B -->|Valid| C{Quota Check}
    C -->|Under Limit| D{Rate Limit Check}
    D -->|Pass| E[Execute Trade]
    E --> F[Increment KV Counter]
    C -->|Over Limit| G[Return 429]
    D -->|Blocked| G
    B -->|Invalid/Expired| H{Grace Period?}
    H -->|Yes| I[Start Countdown]
    H -->|No| J[Block Trading]
    I --> K[Send Notifications]
    K --> L{T+15min?}
    L -->|Yes| J
    L -->|No| M[Allow Trading]
```

## Phase Files

1. [phase-01-trade-execution-gating.md](./phase-01-trade-execution-gating.md) — Trade execution gating
2. [phase-02-backtest-limits.md](./phase-02-backtest-limits.md) — Backtest depth limits
3. [phase-03-grace-period.md](./phase-03-grace-period.md) — Grace period handling
4. [phase-04-kv-rate-limiting.md](./phase-04-kv-rate-limiting.md) — KV rate limiting integration
5. [phase-05-notifications.md](./phase-05-notifications.md) — Notification system
6. [phase-06-testing.md](./phase-06-testing.md) — Unit & integration tests

## TODO Checklist

- [ ] Phase 1: Trade execution gating middleware
- [ ] Phase 2: Backtest depth limit enforcement
- [ ] Phase 3: Grace period countdown + notifications
- [ ] Phase 4: Redis KV sliding window rate limiter
- [ ] Phase 5: Multi-channel notifications (Email, Telegram, Webhook)
- [ ] Phase 6: Comprehensive test suite

## Dependencies

- Existing `LicenseService` (src/lib/raas-gate.ts)
- Existing `rate-limiter.ts` (sliding window)
- Existing `billing-notification-service.ts`
- Redis for distributed KV storage
- Polar webhook integration for subscription events

## Unresolved Questions

1. Should grace period be configurable per tenant?
2. Do we need a dashboard UI for quota monitoring?
3. Should overage charges apply for ENTERPRISE tier?
