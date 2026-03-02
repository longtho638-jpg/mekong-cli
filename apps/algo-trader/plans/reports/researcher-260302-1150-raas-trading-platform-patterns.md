# RaaS Multi-Tenant Algorithmic Trading Platform — Architecture Patterns Report

**Date:** 2026-03-02 | **Word Count:** ~140 lines | **Target:** TypeScript/Node.js + Prisma + PostgreSQL

---

## 1. Multi-Tenant Architecture Decision

**Recommendation: Hybrid Pool + RLS** (shared database, schema-per-tenant isolation)

- **Why:** Cost-efficient for 100-1000 traders, enterprise security, operational simplicity
- **Pattern:** Single PostgreSQL database with Prisma, row-level security (RLS) at table level
- **Tenant isolation:** `tenant_id` column EVERYWHERE (design first, audit second)
- **RLS Policy:**
  ```sql
  CREATE POLICY tenant_isolation ON trades
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
  ```
- **Prisma Client Extension:** Use `$extends()` to auto-inject `tenant_id` on every query (prevents missing WHERE clauses = data leak)

---

## 2. API Design — Core Endpoints

**Auth Layer:**
- `POST /auth/register` → Create tenant org + admin user
- `POST /auth/api-keys` → Generate hashed API key (never store plaintext)
- `DELETE /auth/api-keys/:keyId` → Revoke instantly

**Tenant Management:**
- `GET /tenants/me` → Current tenant config (API key verification)
- `PATCH /tenants/me` → Rate limits, webhook URL, trading preferences

**Strategy Marketplace:**
- `GET /strategies` → Browse published strategies (filterable, paginated)
- `POST /strategies` → Upload custom algorithm (JSON + execution validation)
- `GET /strategies/:id/backtest` → Historical performance data

**Backtesting:**
- `POST /backtests` → Queue async job (returns `jobId`)
- `GET /backtests/:jobId` → Poll status + results
- `GET /backtests/:jobId/export` → CSV download (date range, metrics)

**Trading:**
- `POST /trades/execute` → Place order (sandbox or live, tenant-isolated)
- `GET /trades/history` → Query with filters (symbol, date range, P&L)
- `GET /positions` → Current portfolio state

**Alerts:**
- `POST /alerts` → Define price/volume rules (stored + webhook triggers)
- `GET /alerts` → List active rules per tenant

**Webhooks:**
- `POST /webhooks` → Trade fill events, backtest complete, price alerts
- Authentication: HMAC-SHA256 signature in header

---

## 3. Background Job Architecture (BullMQ + Redis)

```typescript
// Queue setup
import { Queue, Worker } from 'bullmq';

const backtestQueue = new Queue('backtests', { connection: redis });
const alertQueue = new Queue('price-alerts', { connection: redis });

// Producer: POST /backtests
backtestQueue.add('run', {
  tenantId: req.user.tenantId,
  strategyId, startDate, endDate
}, {
  jobId: `backtest-${Date.now()}`,
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
});

// Worker: Process with tenant isolation
new Worker('backtests', async (job) => {
  const { tenantId, strategyId } = job.data;

  // Set PostgreSQL session var for RLS
  await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', $1, FALSE)`;

  // Execute backtest, save results to trades table (auto-filtered by RLS)
  return { success: true, metrics: {...} };
}, { connection: redis, concurrency: 5 });
```

**Job isolation pattern:**
- Each job sets `app.current_tenant_id` before database access
- RLS policies prevent cross-tenant data leakage
- Webhook callback triggers after completion

---

## 4. Database Schema Essentials (Prisma)

```prisma
model Tenant {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  apiKeyHash    String    @db.VarChar(255)  // bcrypt(apiKey)
  rateLimit     Int       @default(100)      // requests/minute
  webhookUrl    String?
  createdAt     DateTime  @default(now())

  trades        Trade[]
  strategies    Strategy[]
  alerts        Alert[]
  auditLogs     AuditLog[]
}

model Trade {
  id            String    @id
  tenantId      String    @db.Uuid  // ESSENTIAL: RLS filter
  symbol        String
  side          String    // BUY/SELL
  quantity      Int
  executedAt    DateTime
  price         Decimal
  fee           Decimal
  status        String    // FILLED/PENDING/REJECTED

  @@index([tenantId, symbol])
  @@policy("tenant_isolation", "SELECT,INSERT,UPDATE,DELETE", "tenant_id = current_setting('app.current_tenant_id')::uuid")
}

model Strategy {
  id            String    @id
  tenantId      String    @db.Uuid  // Owns strategy
  name          String
  code          String    @db.Text  // Execution JSON
  published     Boolean   @default(false)
  createdAt     DateTime  @default(now())

  @@index([tenantId])
}

model Alert {
  id            String    @id
  tenantId      String    @db.Uuid
  symbol        String
  priceTrigger  Decimal
  active        Boolean   @default(true)
  webhookFired  DateTime?

  @@index([tenantId, active])
}

model AuditLog {
  id            String    @id
  tenantId      String    @db.Uuid  // REQUIRED: trading compliance
  action        String    // TRADE_EXECUTED, ALERT_TRIGGERED, API_KEY_CREATED
  resourceId    String
  details       String    @db.Text  // JSON
  ipAddress     String
  userAgent     String
  createdAt     DateTime  @default(now())

  @@index([tenantId, createdAt])
}
```

---

## 5. API Key Management

```typescript
// Generation (never store plain key)
import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';

const plainKey = randomBytes(32).toString('hex');  // Returned to user ONCE
const keyHash = await bcrypt.hash(plainKey, 10);    // Stored in DB

// Verification middleware
async function verifyApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  const tenant = await prisma.tenant.findFirst({
    where: { apiKeyHash: await bcrypt.compare(key, tenant.apiKeyHash) }
  });

  if (!tenant) return res.status(401).json({ error: 'Invalid key' });

  // Set RLS context
  req.tenantId = tenant.id;
  await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', $1, FALSE)`;
  next();
}
```

**Rate limiting per tenant:**
- Use Redis with sliding window: `tenant:${tenantId}:requests`
- Enforce `tenant.rateLimit` from database

---

## 6. Security Essentials

| Layer | Pattern |
|-------|---------|
| **Tenant Isolation** | RLS policy on ALL tables; Prisma Client extension injection; AUDIT EVERY QUERY |
| **API Authentication** | HMAC-SHA256 for webhooks; bcrypt hashing for API keys (never plaintext) |
| **Data Encryption** | PII (trader names, emails) encrypted at rest with column-level encryption |
| **Audit Trail** | All trades + auth events logged to `AuditLog` table (immutable, indexed by tenant+date) |
| **Webhook Security** | Signature = HMAC-SHA256(payload, secretKey); retry with exponential backoff |
| **Rate Limiting** | Per-tenant quotas enforced at middleware; 429 response when exceeded |

---

## 7. Unresolved Questions

1. **Backtest cost model**: Charge per backtest run or per compute hour?
2. **Strategy marketplace**: Commission split (e.g., 20% platform take)?
3. **Live trading limits**: Max position size per strategy to prevent catastrophic loss?
4. **Data retention**: Keep audit logs 7 years (trading compliance) or custom per tenant?
5. **Multi-region**: Single PostgreSQL instance (latency) or geo-replica read-only for queries?

---

**Next Steps:** Implement Prisma schema + RLS migrations → Auth middleware → BullMQ queue → Backtest runner → Webhook publisher.

---

## Sources

- [Architecting Multi-Tenant SaaS: Database Isolation Patterns](https://www.developers.dev/tech-talk/multi-tenant-database-architecture-a-guide-to-isolation-patterns-and-scaling-trade-offs.html)
- [Multitenant SaaS Patterns - Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/database/saas-tenancy-app-design-patterns?view=azuresql)
- [Data Isolation in Multi-Tenant SaaS: Architecture & Security Guide](https://redis.io/blog/data-isolation-multi-tenant-saas/)
- [BullMQ - Background Jobs and Message Queue for Node.js](https://bullmq.io/)
- [Building Scalable Background Jobs in Node.js with BullMQ](https://dev.to/asad_ahmed_5592ac0a7d0258/building-scalable-background-jobs-in-nodejs-with-bullmq-509p)
- [SaaS Identity and Access Management Best Practices](https://www.loginradius.com/blog/engineering/saas-identity-access-management)
- [Multi-tenant SaaS authorization and API access control - AWS](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-api-access-authorization/introduction.html)
- [Securing Multi-Tenant Applications Using Row Level Security with Prisma](https://medium.com/@francolabuschagne90/securing-multi-tenant-applications-using-row-level-security-in-postgresql-with-prisma-orm-4237f4d4bd35)
- [Using Row-Level Security in Prisma](https://atlasgo.io/guides/orms/prisma/row-level-security)
- [Prisma Client Extensions - Row Level Security](https://github.com/prisma/prisma-client-extensions/tree/main/row-level-security)
- [Building Multi-Tenant SaaS with NestJS, Prisma and Row-Level Security](https://js.elitedev.in/js/complete-guide-build-multi-tenant-saas-with-nestjs-prisma-and-row-level-security-96c123c5/)
- [Stock trading app guide: Compliance, tech stack & features](https://innowise.com/blog/stock-trading-app-development/)
- [Trading Platform Development: 2025-2026 Playbook for U.S. Broker-Dealers](https://www.etnasoft.com/trading-platform-development-2025-2026-playbook-for-u-s-broker-dealers-rias/)
