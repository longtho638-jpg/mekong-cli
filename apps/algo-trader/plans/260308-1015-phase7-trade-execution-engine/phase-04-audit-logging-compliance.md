---
title: "Phase 7.4: Audit Logging Compliance"
description: "Immutable SEC/FINRA-compliant audit trail with PostgreSQL append-only storage"
status: pending
priority: P1
effort: 2h
---

# Phase 7.4: Audit Logging Compliance

## Context Links
- **Research:** `plans/reports/researcher-260308-1014-trade-execution-engine.md#audit-logging-schema`
- **Core Files:** `src/execution/audit-logger.ts`, `src/a2ui/trade-audit-logger.ts`
- **Related:** `prisma/schema.prisma`

## Overview
- **Priority:** P1 (Regulatory compliance)
- **Status:** pending
- **Description:** Immutable audit trail for SEC/FINRA compliance with PostgreSQL append-only storage

## Key Insights from Research
1. **Current audit:** In-memory buffer (1000 events max), not immutable
2. **Missing fields:** IP, User-Agent for regulatory tracking
3. **Storage:** No persistent storage, events lost on restart
4. **Compliance:** SEC requires 3+ years retention, FINRA requires immediate recording

## Requirements

### Functional
- Append-only PostgreSQL storage
- SEC/FINRA compliance fields (IP, timestamp, who/what/when/price/quantity)
- Immutable audit log (no updates/deletes)
- Query interface for audit retrieval
- Export to S3 for long-term archival

### Non-Functional
- Write latency <10ms
- 99.99% durability
- 3+ years retention
- Query response <1s for date range searches

## Related Code Files

### Modify
- `src/execution/audit-logger.ts` - Add PostgreSQL persistence
- `src/a2ui/trade-audit-logger.ts` - Merge with audit logger
- `prisma/schema.prisma` - Add audit log tables

### Create
- `src/compliance/audit-log-repository.ts` - PostgreSQL repository
- `src/compliance/audit-exporter.ts` - S3 export
- `src/compliance/audit-query-service.ts` - Query interface
- `prisma/migrations/add_audit_logs_table/` - Migration

## Implementation Steps

### Step 1: Define Audit Log Schema
```prisma
// prisma/schema.prisma
model AuditLog {
  id            String   @id @default(uuid())
  tenantId      String
  exchangeId    String
  symbol        String?
  orderId       String?
  clientOrderId String? // Idempotency key
  side          String? // buy/sell
  amount        Decimal?
  price         Decimal?
  fee           Decimal? @default(0)
  strategyId    String?
  signalId      String?
  eventType     AuditEventType
  severity      SeverityLevel
  ipAddress     String?
  userAgent     String?
  metadata      Json?
  createdAt     DateTime @default(now())

  @@index([tenantId, createdAt])
  @@index([orderId])
  @@index([eventType])
}

enum AuditEventType {
  TRADE_EXECUTED
  TRADE_CANCELLED
  TRADE_FAILED
  API_KEY_USED
  API_KEY_RATE_LIMITED
  UNUSUAL_PATTERN_DETECTED
  CIRCUIT_BREAKER_TRIGGERED
  MAX_ORDER_SIZE_EXCEEDED
  DAILY_VOLUME_LIMIT_EXCEEDED
  ORDER_STATE_TRANSITION
}

enum SeverityLevel {
  INFO
  WARNING
  CRITICAL
}
```

### Step 2: Create Audit Log Repository
```typescript
// src/compliance/audit-log-repository.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogInput {
  tenantId: string;
  exchangeId: string;
  symbol?: string;
  orderId?: string;
  clientOrderId?: string;
  side?: 'buy' | 'sell';
  amount?: number;
  price?: number;
  fee?: number;
  strategyId?: string;
  signalId?: string;
  eventType: string;
  severity: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export class AuditLogRepository {
  async append(log: AuditLogInput): Promise<string> {
    // Append-only: INSERT only, no UPDATE/DELETE
    const result = await prisma.auditLog.create({
      data: {
        ...log,
        createdAt: new Date(),
      },
      select: { id: true },
    });
    return result.id;
  }

  async findByTenant(
    tenantId: string,
    from: Date,
    to: Date,
    limit: number = 1000
  ): Promise<AuditLogInput[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return logs;
  }

  async findByOrderId(orderId: string): Promise<AuditLogInput[]> {
    const logs = await prisma.auditLog.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
    return logs;
  }

  async exportToCSV(
    tenantId: string,
    from: Date,
    to: Date,
    outputPath: string
  ): Promise<void> {
    const logs = await this.findByTenant(tenantId, from, to, 100000);
    const csv = convertToCSV(logs);
    await fs.writeFile(outputPath, csv);
  }
}
```

### Step 3: Enhance Audit Logger with PostgreSQL
```typescript
// src/execution/audit-logger.ts
import { AuditLogRepository } from '../compliance/audit-log-repository';

export class AuditLogger {
  private repository: AuditLogRepository;

  constructor(
    private tenantId: string,
    private exchangeId: string,
    private webhookUrl?: string
  ) {
    this.repository = new AuditLogRepository();
  }

  async logTradeExecution(
    order: { id: string; symbol: string; side: string; amount: number; price?: number },
    metadata?: TradeExecutionMetadata
  ): Promise<string> {
    const event: AuditEvent = {
      id: this.generateEventId(),
      eventType: AuditEventType.TRADE_EXECUTED,
      severity: SeverityLevel.INFO,
      timestamp: Date.now(),
      tenantId: this.tenantId,
      exchangeId: this.exchangeId,
      symbol: order.symbol,
      side: order.side as 'buy' | 'sell',
      amount: order.amount,
      price: order.price,
      orderId: order.id,
      metadata: {
        ...metadata,
        ipAddress: metadata?.ip,
        userAgent: metadata?.userAgent,
      },
    };

    this.bufferEvent(event);

    // Persist to PostgreSQL
    const logId = await this.repository.append({
      tenantId: this.tenantId,
      exchangeId: this.exchangeId,
      symbol: order.symbol,
      orderId: order.id,
      side: order.side as 'buy' | 'sell',
      amount: order.amount,
      price: order.price,
      eventType: AuditEventType.TRADE_EXECUTED,
      severity: SeverityLevel.INFO,
      metadata: event.metadata,
    });

    this.persistEvent(event);

    return logId;
  }

  // Add similar persistence to all other log methods...
}
```

### Step 4: Add SEC/FINRA Compliance Fields
```typescript
interface ComplianceAuditLog {
  // WHO
  tenantId: string;
  userId?: string;
  ipAddress: string;

  // WHAT
  eventType: AuditEventType;
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;

  // WHEN
  timestamp: number; // Unix ms
  exchangeTimestamp?: number; // Exchange's timestamp

  // ORDER DETAILS
  orderType: 'market' | 'limit';
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  clientOrderId?: string;

  // EXECUTION DETAILS
  avgFillPrice?: number;
  totalFilled?: number;
  fee: number;
  feeCurrency: string;

  // STRATEGY CONTEXT
  strategyId?: string;
  signalId?: string;

  // COMPLIANCE
  regulatoryId?: string; // FINRA CAT ID
  brokerId?: string; // Broker-dealer ID
}
```

### Step 5: S3 Export for Long-term Archival
```typescript
// src/compliance/audit-exporter.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export class AuditExporter {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async exportDailyLogs(tenantId: string, date: Date): Promise<void> {
    const repository = new AuditLogRepository();
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(start.getTime() + 86400000);

    const logs = await repository.findByTenant(tenantId, start, end, 100000);
    const jsonl = logs.map(l => JSON.stringify(l)).join('\n');

    // Upload to S3
    const key = `audit-logs/${tenantId}/${date.toISOString().split('T')[0]}.jsonl`;
    await this.s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_AUDIT_BUCKET,
      Key: key,
      Body: jsonl,
      ServerSideEncryption: 'AES256',
    }));
  }

  async exportToGlacier(tenantId: string, olderThan: Date): Promise<void> {
    // Move logs older than X days to Glacier for cost savings
    // Implementation depends on S3 lifecycle policies
  }
}
```

## Todo List
- [ ] Create Prisma schema for audit logs
- [ ] Run migration to create audit_logs table
- [ ] Implement `AuditLogRepository` class
- [ ] Add PostgreSQL persistence to `AuditLogger`
- [ ] Add SEC/FINRA compliance fields to audit events
- [ ] Implement `AuditExporter` for S3 archival
- [ ] Add query interface for audit retrieval
- [ ] Add unit tests for repository
- [ ] Add integration tests for end-to-end audit flow

## Success Criteria
- [ ] All audit events persisted to PostgreSQL
- [ ] No UPDATE/DELETE operations allowed (append-only)
- [ ] SEC/FINRA fields captured (IP, timestamp, etc.)
- [ ] Daily S3 export working
- [ ] Query by tenant/order/date works

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| PostgreSQL unavailable | High | Fallback to in-memory buffer with warning |
| Audit write slow | Medium | Async batch writes |
| S3 export fails | Medium | Retry with exponential backoff |
| Data tampering | High | Cryptographic hash chain for immutability |

## Security Considerations
- Audit logs encrypted at rest (PostgreSQL TDE)
- S3 bucket with versioning enabled
- Access logging for audit queries
- Hash chain for tamper detection
