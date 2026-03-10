# Algo-Trader Analytics Survey Report

**Date:** 2026-03-06
**Researcher:** a5c4088edce49168a
**Purpose:** Phase 5 Analytics Dashboard requirements

---

## 1. EXISTING ANALYTICS/REPORTS

### 1.1 License Usage Analytics (`src/lib/license-usage-analytics.ts`)
- **LicenseUsageAnalytics** class: singleton pattern, tracks quota consumption
- Tracks: API calls, ML predictions, data points
- Methods: `trackApiCall()`, `trackMLPrediction()`, `trackDataPoints()`
- Tier-based limits (enterprise/pro/free)
- Monthly reset date tracking
- Export report as JSON with usage percentages

### 1.2 Performance Analyzer (`src/reporting/PerformanceAnalyzer.ts`)
- Backtest trade analysis: wins, losses, win rate
- Metrics: totalReturn, sharpeRatio, maxDrawdown, profitFactor
- Input: TradeRecord array + initial/final balance
- Approximates balance curve from trades for drawdown calc

### 1.3 Reporting Page (`dashboard/src/pages/reporting-page.tsx`)
- Paginated trade history table (20 rows/page)
- CSV export capability
- Summary stats: totalPnl, winRate, avgTradeSize
- Sortable columns: date, pair, side, price, amount, fee, pnl, exchange
- currently uses MOCK_TRADES data (47 trades)

### 1.4 Webhook Audit Logger (`src/billing/webhook-audit-logger.ts`)
- Unified audit logging for Stripe + Polar webhooks
- Idempotency store (in-memory Map)
- Error tracking with configurable alert threshold (default: 10)
- Structured logging: eventId, provider, eventType, tenantId, status
- Methods: `getRecentLogs()`, `getLogsByProvider()`, `getErrorLogs()`, `getStats()`

---

## 2. UI DASHBOARD PATTERNS

### 2.1 Current Pages Structure
```
dashboard/src/pages/
├── dashboard-page.tsx        # Live trading monitor
├── reporting-page.tsx        # Trade history + CSV export
├── marketplace-page.tsx      # Strategy marketplace
├── backtests-page.tsx        # Backtest jobs
├── license-page.tsx          # License management (tiered tabs)
└── settings-page.tsx         # User settings
```

### 2.2 License Page (`license-page.tsx`)
Three-tab architecture:
- **Licenses**: License list + Create modal
- **Audit Logs**: License audit trail viewer
- **Analytics**: UsageAnalyticsDashboard component

### 2.3 Usage Analytics Dashboard (`usage-analytics-dashboard.tsx`)
Existing dashboard with:
- 4 summary cards: Total Licenses, Active, Monthly Revenue, API Calls
- Tier distribution: FREE/PRO/ENTERPRISE distribution
- Usage gauges: API calls, ML features, Premium data
- Tenant quota display (circular gauges)
- Overall usage circular gauge
- Status distribution: Active/Revoked/Expired
- Recent activity feed (last 10 events)
- Time range selector: 7d/30d/90d

**Missing**: Revenue charts, MRR trend, churn analysis, customer list

---

## 3. DATA SOURCES

### 3.1 Pricing Data
| Provider | Source | DataType |
|----------|--------|----------|
| **Polar.sh** | `src/billing/polar-subscription-service.ts` | Subscription status per tenantId |
| **Stripe** | `src/billing/stripe-webhook-handler.ts` | Webhook events via Stripe API |

**Polar Products:**
- FREE: $0/mo (1 strategy, $50 daily loss, $500 position)
- PRO: $49/mo (5 strategies, $500 daily loss, $5000 position)
- ENTERPRISE: $199/mo (unlimited)

### 3.2 Usage Data
| Source | File | Capacity |
|--------|------|----------|
| In-Memory Buffer | `src/metering/usage-tracker-service.ts` | Buffered writes (100 events or 30s auto-flush) |
| Database | `src/db/queries/usage-queries.ts` | Prisma ORM with PostgreSQL |
| Internal API | `src/api/routes/internal/usage-routes.ts` | `/internal/usage/:licenseKey` |

**Event Types:**
- `api_call` - API endpoint calls
- `compute_minute` - Computation time
- `ml_inference` - ML predictions

**Database Tables:**
```sql
usageEvent: licenseKey, eventType, units, metadata, createdAt
license: key, tier, status, expiresAt, tenantId, metadata
licenseAuditLog: licenseId, event, tier, ip, metadata, createdAt
```

### 3.3 Quantities Available
- **Licenses**: via `licenseQueries.getAnalytics()` - byTier (free/pro/enterprise), byStatus (active/revoked)
- **Usage**: via `usageQueries.getAggregatedUsage()` - totalUnits, eventCount by eventType
- **Activity**: via `licenseQueries.getRecentActivity()` - last 10 audit logs
- **Revenue**: Not directly queried - estimated from subscription status

---

## 4. DATA FLOW FOR PHASE 5

### Current Flow (Missing MRR/Revenue Analytics)
```
Payment Webhooks (Polar/Stripe)
    ↓
SubscriptionService.activateSubscription()
    ↓
LicenseService.activateSubscription()
    ↓
UsageTrackerService.track()  ← Usage ONLY
    ↓
Database: usageEvent table

Analytics Dashboard reads:
- license table → license counts, tier distribution
- usageEvent table → API call counts
- licenseAuditLog → activity feed
❌ MISSING: revenue calculations, MRR trends
```

### Required Additions for Phase 5
```
Payment Webhooks → PolarSubscriptionService
    ↓
Calculate MRR: $49 × proCount + $199 × enterpriseCount
    ↓
Store in pgAnalytics table (revenueEvent)
    ↓
Analytics Dashboard reads revenue + usage
```

---

## 5. GAPS FOR PHASE 5

### 5.1 Missing Revenue Analytics
| Gap | Impact |
|-----|--------|
| No MRR calculation | Can't show Monthly Recurring Revenue |
| No revenue by tier | Can't break down $ by PRO/Enterprise |
| No revenue charts | Can't show MRR trend over time |
| No revenue export | Can't generate billing reports |
| No subscription item counts | Can't track active subscribers |

### 5.2 Missing Churn Analytics
| Gap | Impact |
|-----|--------|
| No cancellation tracking | Can't measure churn rate |
| No downgrades tracking | Can't see tier migration patterns |
| No LTV calculation | Can't calculate customer lifetime value |
| No cohort analysis | Can't analyze retention by acquisition source |

### 5.3 Missing Customer Analytics
| Gap | Impact |
|-----|--------|
| No tenant list with subscription status | Can't view all customers |
| No customer details modal | Can't see per-customer usage/revenue |
| No tenantId propagation to analytics | Can't attribute usage to paying customers |

### 5.4 Missing API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1 analytics/mrr` | Monthly Recurring Revenue summary |
| `GET /api/v1 analytics/revenue-trend` | MRR chart data (7d/30d/90d) |
| `GET /api/v1 analytics/churn` | Churn metrics (cancellations by period) |
| `GET /api/v1 analytics/customers` | List of paying customers |
| `GET /api/v1 analytics/usage-by-customer` | Top usage customers |

---

## 6. RECOMMENDATIONS

### Priority 1: Database Schema
```sql
CREATE TABLE revenueEvent (
  id SERIAL PRIMARY KEY,
  licenseId VARCHAR(255) REFERENCES license(id),
  eventType VARCHAR(50),  -- subscription_created, subscription_cancelled, refund
  amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  periodMonth VARCHAR(7),  -- YYYY-MM
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_revenue_license ON revenueEvent(licenseId);
CREATE INDEX idx_revenue_month ON revenueEvent(periodMonth);
```

### Priority 2: Analytics Service
Add to `src/billing/`:
- `RevenueAnalyticsService` - MRR, churn, LTV calculations
- `RevenueReportService` - CSV/JSON export for billing

### Priority 3: API Routes
Add to `src/api/routes/analytics-routes.ts`:
- `/api/v1/analytics/mrr` - Current MRR, MoM change
- `/api/v1/analytics/trend` - Historical MRR chart data
- `/api/v1/analytics/churn` - Cancellation analysis
- `/api/v1/analytics/customers` - Active subscribers

### Priority 4: Frontend Components
- Revenue cards: MRR, New Revenue, Churned Revenue
- MRR line chart (recharts)
- Churn waterfall chart
- Customer list table with subscription status

---

## 7. UNRESOLVED QUESTIONS

1. **Stripe Integration**: Stripe webhook handler exists but no revenue recording  - how should revenue be attributed to Stripe vs Polar subscriptions?

2. **TenantId Mapping**: License table has `tenantId` field - is this consistently populated from webhooks? Without this, usage can't be attributed to paying customers.

3. **Revenue Data Source**: Should MRR be calculated from:
   - Real-time webhook events? (immediate but requires processing)
   - Database subscription state? (simpler but delayed)
   - Hybrid approach? (recommended)

4. **Refund Handling**: Stripe/Polar refund events should reduce revenue - how should negative amounts be recorded?

5. **Time Zone**: All timestamps use ISO strings - should analytics use UTC or localized timezone?

---

## 8. FILE PATH SUMMARY

| Component | File Path |
|-----------|-----------|
| License Usage Analytics | `src/lib/license-usage-analytics.ts` |
| Performance Analyzer | `src/reporting/PerformanceAnalyzer.ts` |
| Polar Subscription Service | `src/billing/polar-subscription-service.ts` |
| Stripe Webhook Handler | `src/billing/stripe-webhook-handler.ts` |
| Webhook Audit Logger | `src/billing/webhook-audit-logger.ts` |
| Usage Tracker Service | `src/metering/usage-tracker-service.ts` |
| Usage Queries | `src/db/queries/usage-queries.ts` |
| License Queries | `src/db/queries/license-queries.ts` |
| Usage Analytics Dashboard | `dashboard/src/components/usage-analytics-dashboard.tsx` |
| Analytics Hook | `dashboard/src/hooks/use-license-analytics.ts` |

---

**Report Generated:** 2026-03-06T21:40:00Z
