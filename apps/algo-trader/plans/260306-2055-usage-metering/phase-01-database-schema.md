---
title: "Phase 4.1: Database Schema + Usage Queries"
description: "Add UsageEvent model and create DB query functions"
status: pending
priority: P0
effort: 1h
parent: plan.md
---

# Phase 4.1: Database Schema + Usage Queries

## Files to Create/Modify

### 1. Modify `prisma/schema.prisma`

Add UsageEvent model at the end of schema:

```prisma
model UsageEvent {
  id          BigInt   @id @default(autoincrement())
  tenantId    String
  licenseKey  String
  eventType   String   // api_call, compute_ml, strategy_run, etc.
  endpoint    String?  // API path
  computeMs   Int      @default(0)  // Compute time in milliseconds
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())

  @@index([tenantId, createdAt(sort: Desc)])
  @@index([licenseKey, createdAt(sort: Desc)])
  @@index([eventType, createdAt(sort: Desc)])
  @@map("usage_events")
}
```

### 2. Create `src/db/queries/usage-queries.ts`

```typescript
/**
 * Usage Event Database Queries
 *
 * CRUD operations for usage_events table
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UsageEventInput {
  tenantId: string;
  licenseKey: string;
  eventType: string;
  endpoint?: string;
  computeMs?: number;
  metadata?: Record<string, unknown>;
}

export interface UsageSummary {
  tenantId: string;
  period: string; // YYYY-MM
  apiCalls: number;
  computeMinutes: number;
  events: Array<{
    eventType: string;
    count: number;
    totalComputeMs: number;
  }>;
}

/**
 * Record a single usage event
 */
export async function recordUsageEvent(input: UsageEventInput): Promise<void> {
  await prisma.usageEvent.create({
    data: {
      tenantId: input.tenantId,
      licenseKey: input.licenseKey,
      eventType: input.eventType,
      endpoint: input.endpoint,
      computeMs: input.computeMs ?? 0,
      metadata: input.metadata ?? {},
    },
  });
}

/**
 * Batch record multiple usage events
 */
export async function batchRecordUsageEvents(
  inputs: UsageEventInput[]
): Promise<void> {
  await prisma.usageEvent.createMany({
    data: inputs.map((input) => ({
      tenantId: input.tenantId,
      licenseKey: input.licenseKey,
      eventType: input.eventType,
      endpoint: input.endpoint,
      computeMs: input.computeMs ?? 0,
      metadata: input.metadata ?? {},
    })),
  });
}

/**
 * Get usage summary for a tenant by period (month)
 */
export async function getUsageByPeriod(
  tenantId: string,
  period: string // YYYY-MM
): Promise<UsageSummary> {
  const startDate = new Date(`${period}-01T00:00:00.000Z`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const events = await prisma.usageEvent.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: {
      eventType: true,
      computeMs: true,
    },
  });

  const apiCalls = events.filter((e) => e.eventType === 'api_call').length;
  const computeMinutes = Math.round(
    events.reduce((sum, e) => sum + e.computeMs, 0) / 60000
  );

  // Aggregate by event type
  const eventsByType = events.reduce(
    (acc, event) => {
      const existing = acc.find((e) => e.eventType === event.eventType);
      if (existing) {
        existing.count++;
        existing.totalComputeMs += event.computeMs;
      } else {
        acc.push({
          eventType: event.eventType,
          count: 1,
          totalComputeMs: event.computeMs,
        });
      }
      return acc;
    },
    [] as Array<{ eventType: string; count: number; totalComputeMs: number }>
  );

  return {
    tenantId,
    period,
    apiCalls,
    computeMinutes,
    events: eventsByType,
  };
}

/**
 * Get total compute minutes for a tenant by period
 */
export async function getComputeMinutesByPeriod(
  tenantId: string,
  period: string
): Promise<number> {
  const startDate = new Date(`${period}-01T00:00:00.000Z`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const result = await prisma.usageEvent.aggregate({
    _sum: {
      computeMs: true,
    },
    where: {
      tenantId,
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
    },
  });

  return Math.round((result._sum.computeMs ?? 0) / 60000);
}

/**
 * Export usage data in Stripe Billing format
 */
export interface StripeUsageExport {
  subscription_item: string;
  quantity: number;
  timestamp: number;
  action?: 'increment' | 'set';
}

export async function exportForStripeBilling(
  tenantId: string,
  period: string,
  subscriptionItemId: string
): Promise<StripeUsageExport[]> {
  const startDate = new Date(`${period}-01T00:00:00.000Z`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const events = await prisma.usageEvent.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return events.map((event) => ({
    subscription_item: subscriptionItemId,
    quantity: event.eventType === 'api_call' ? 1 : Math.round(event.computeMs / 60000),
    timestamp: Math.floor(event.createdAt.getTime() / 1000),
    action: 'increment',
  }));
}

/**
 * Clean up old usage events (older than retention period)
 */
export async function cleanupOldUsageEvents(
  olderThanDays: number = 90
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.usageEvent.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}
```

## Tasks

- [ ] Add UsageEvent model to `prisma/schema.prisma`
- [ ] Run migration: `npx prisma migrate dev --name add_usage_events`
- [ ] Create `src/db/queries/usage-queries.ts` with all functions above
- [ ] Export from `src/db/queries/index.ts` (if exists)
- [ ] Verify migration with: `npx prisma db pull`

## Success Criteria

- [ ] Migration runs successfully
- [ ] UsageEvent table exists with proper indexes
- [ ] All query functions compile without errors
- [ ] Unit tests for query functions pass
