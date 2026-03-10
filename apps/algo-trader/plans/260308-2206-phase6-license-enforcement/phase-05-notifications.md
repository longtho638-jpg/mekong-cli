---
title: "Phase 5 — Notification System"
description: "Multi-channel notifications via Email, Telegram, and Dashboard Webhook"
status: pending
priority: P1
effort: 1.5h
---

# Phase 5: Notification System

## Overview

Send license enforcement notifications via multiple channels to ensure users are informed before trading is blocked.

## Notification Events

| Event | Channels | Timing |
|-------|----------|--------|
| License Expiring Soon | Email, Telegram | T-24h, T-1h |
| Grace Period Started | Email, Telegram, Webhook | T+0 |
| Grace Period Warning | Email, Telegram, Webhook | T+5, T+10 |
| Account Suspended | Email, Telegram, Webhook | T+15 |
| Quota 80% Used | Email, Webhook | When threshold reached |
| Rate Limit Exceeded | Webhook only | On 429 response |

## Implementation Steps

### 5.1 Extend BillingNotificationService

**File:** `src/notifications/billing-notification-service.ts`

Add new event types:

```typescript
export type BillingEventType =
  | 'license_expiring_soon'  // NEW
  | 'quota_threshold'        // NEW
  | 'rate_limit_exceeded'    // NEW
  | 'payment_failed'
  | 'grace_period_started'
  | 'account_suspended'
  // ... existing types
```

### 5.2 Add License Expiring Notification

```typescript
async sendLicenseExpiringNotification(
  tenantId: string,
  hoursUntilExpiry: number
): Promise<void> {
  await this.sendNotification(
    'license_expiring_soon',
    tenantId,
    ['email', 'telegram'],
    {
      gracePeriodDays: 0,
      gracePeriodEndsAt: new Date(Date.now() + hoursUntilExpiry * 3600000),
    }
  );
}
```

### 5.3 Add Quota Threshold Notification

```typescript
async sendQuotaThresholdNotification(
  tenantId: string,
  quotaType: 'daily_orders' | 'backtest_candles' | 'api_requests',
  usagePercent: number
): Promise<void> {
  await this.sendNotification(
    'quota_threshold',
    tenantId,
    ['email', 'webhook'],
    {
      overageUnits: usagePercent,
      period: quotaType,
    }
  );
}
```

### 5.4 Add Dashboard Webhook Integration

**File:** `src/api/routes/webhook-routes.ts`

```typescript
import { billingNotificationService } from '../notifications/billing-notification-service';

/**
 * POST /api/webhooks/license-status
 * Body: { tenantId, tier, status, gracePeriodRemaining?, quota? }
 */
app.post('/api/webhooks/license-status', async (c) => {
  const body = await c.req.json();
  const { tenantId, status, gracePeriodRemaining, quota } = body;

  // Broadcast to connected dashboard clients
  // via WebSocket or Server-Sent Events
  broadcastToDashboard(tenantId, {
    type: 'license_status',
    status,
    gracePeriodRemaining,
    quota,
    timestamp: new Date().toISOString(),
  });

  return c.json({ success: true });
});
```

### 5.5 Create Notification Scheduler

**File:** `src/jobs/notification-scheduler.ts`

```typescript
export class NotificationScheduler {
  /**
   * Schedule license expiry notifications
   * Send at T-24h, T-1h before expiration
   */
  scheduleLicenseExpiryNotifications(
    tenantId: string,
    expiresAt: Date
  ): void {
    const now = Date.now();
    const expiryTime = expiresAt.getTime();

    // T-24h notification
    const delay24h = expiryTime - now - (24 * 60 * 60 * 1000);
    if (delay24h > 0) {
      setTimeout(async () => {
        await billingNotificationService.sendLicenseExpiringNotification(
          tenantId,
          24
        );
      }, delay24h);
    }

    // T-1h notification
    const delay1h = expiryTime - now - (60 * 60 * 1000);
    if (delay1h > 0) {
      setTimeout(async () => {
        await billingNotificationService.sendLicenseExpiringNotification(
          tenantId,
          1
        );
      }, delay1h);
    }
  }

  /**
   * Send quota threshold notifications
   * Trigger at 80%, 90%, 100% usage
   */
  async checkQuotaThresholds(tenantId: string): Promise<void> {
    const quota = await this.getQuotaUsage(tenantId);
    const thresholds = [80, 90, 100];

    for (const threshold of thresholds) {
      if (quota.usagePercent >= threshold && !quota.notifiedThresholds.includes(threshold)) {
        await billingNotificationService.sendQuotaThresholdNotification(
          tenantId,
          'daily_orders',
          quota.usagePercent
        );
        quota.notifiedThresholds.push(threshold);
      }
    }
  }
}
```

## Files to Modify/Create

| Action | File |
|--------|------|
| Modify | `src/notifications/billing-notification-service.ts` |
| Create | `src/jobs/notification-scheduler.ts` |
| Create | `src/api/routes/webhook-routes.ts` |
| Modify | `src/lib/raas-gate.ts` (trigger notifications) |

## Success Criteria

- [ ] License expiry notifications sent at T-24h, T-1h
- [ ] Quota threshold notifications at 80%, 90%, 100%
- [ ] Dashboard webhook receives real-time updates
- [ ] Grace period notifications sent at T+0, T+5, T+10, T+15
- [ ] All notification events logged to database

## Unresolved Questions

1. Should we support push notifications (FCM/APNs)?
2. Should users be able to configure notification preferences?
