# System Architecture - Mekong CLI Business Application

**Last Updated**: 2026-01-25
**Version**: 2.0.0
**Purpose**: Business application architecture (Frontend, Backend, Payment, Database)

> **Note**: For AgencyOS agent architecture, see [system-architecture.md](./system-architecture.md)

---

## Overview

Mekong CLI is a full-stack SaaS application with:
- **Frontend**: Next.js 14+ dashboard (apps/dashboard)
- **Backend**: FastAPI REST API (backend/api)
- **AI Engine**: Antigravity Core (antigravity/core)
- **Database**: Supabase (PostgreSQL)
- **Payments**: PayPal (Primary), Polar (Backup)
- **CLI Tools**: CC Command Center (scripts/)

---

## Data Flow Diagram (ASCII)

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                          │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ├─→ [Browser] → apps/dashboard (Next.js)
             │       │
             │       ├─→ /api routes (Next.js API)
             │       └─→ /dashboard pages (React)
             │
             ├─→ [CLI] → scripts/cc (Python CLI)
             │       │
             │       ├─→ cc revenue dashboard
             │       ├─→ cc deploy backend
             │       └─→ cc sales products-build
             │
             └─→ [API Client] → backend/api (FastAPI)
                     │
                     ├─→ backend/services (Business Logic)
                     │       │
                     │       ├─→ Payment Service (PayPal/Polar)
                     │       ├─→ License Service (Generation)
                     │       ├─→ Subscription Service (Billing)
                     │       └─→ User Service (Auth)
                     │
                     ├─→ antigravity/core (AI Engine)
                     │       │
                     │       ├─→ Command Registry
                     │       ├─→ MCP Orchestrator
                     │       └─→ Quota Engine
                     │
                     └─→ Database (Supabase PostgreSQL)
                             │
                             ├─→ users
                             ├─→ subscriptions
                             ├─→ payments
                             ├─→ licenses
                             └─→ invoices

┌──────────────────────────────────────────────────────────────────┐
│                      EXTERNAL INTEGRATIONS                        │
└────────────┬─────────────────────────────────────────────────────┘
             │
             ├─→ PayPal API (sandbox/live)
             ├─→ Polar.sh API (backup)
             ├─→ Supabase API (database/auth)
             ├─→ Gemini API (AI models)
             └─→ Google Cloud (deployment)
```

---

## Component Overview

### 1. Frontend Layer (apps/dashboard)

**Technology**: Next.js 14+ with App Router, React 18, TypeScript
**Location**: `apps/dashboard/`
**Responsibilities**:
- User interface (dashboard, billing, settings)
- Client-side rendering + Server-side rendering
- API route handlers (Next.js API)
- Authentication (session management)

**Key Routes**:
```
apps/dashboard/
├── app/
│   ├── (auth)/           # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/        # Main dashboard
│   │   ├── page.tsx      # Overview
│   │   ├── billing/      # Subscription management
│   │   └── settings/     # User settings
│   └── api/              # Next.js API routes
│       ├── checkout/     # Payment initiation
│       ├── webhooks/     # Payment webhooks
│       └── auth/         # Auth endpoints
```

**State Management**:
- React Context (global state)
- SWR/TanStack Query (API data)
- Local storage (session persistence)

### 2. Backend Layer (backend/api)

**Technology**: FastAPI (Python 3.11+), Pydantic, asyncio
**Location**: `backend/api/`
**Responsibilities**:
- REST API endpoints
- Business logic orchestration
- Authentication/authorization
- Database operations (via Supabase client)

**API Structure**:
```
backend/api/
├── routers/
│   ├── auth.py           # /api/v1/auth
│   ├── payments.py       # /api/v1/payments
│   ├── subscriptions.py  # /api/v1/subscriptions
│   ├── licenses.py       # /api/v1/licenses
│   └── users.py          # /api/v1/users
├── middleware/
│   ├── auth.py           # JWT validation
│   ├── cors.py           # CORS handling
│   └── rate_limit.py     # Rate limiting
└── main.py               # FastAPI app
```

**Key Endpoints**:
- `POST /api/v1/checkout` - Initiate payment
- `POST /api/v1/webhooks/paypal` - PayPal webhook handler
- `GET /api/v1/subscriptions` - List user subscriptions
- `POST /api/v1/licenses/generate` - Generate license key

### 3. Business Logic Layer (backend/services)

**Location**: `backend/services/`
**Responsibilities**:
- Payment processing (PayPal, Polar)
- License generation and validation
- Subscription lifecycle management
- Invoice generation (Vietnam tax compliant)

**Services**:
```
backend/services/
├── payment_service.py    # PayPal/Polar integration
├── license_service.py    # License generation/validation
├── subscription_service.py  # Billing cycles
├── invoice_service.py    # Invoice generation (VN tax)
└── user_service.py       # User management
```

**Key Logic**:

**Payment Service** (`payment_service.py`):
```python
# PayPal integration
async def create_paypal_order(amount: float, currency: str = "USD"):
    # Mode: sandbox | live (env PAYPAL_MODE)
    # Returns: order_id, approval_url

async def capture_paypal_payment(order_id: str):
    # Retry logic: 3 attempts (1s, 2s, 4s backoff)
    # Webhook verification: MANDATORY (fail closed)

async def verify_paypal_webhook(headers, body):
    # Signature verification using PAYPAL_WEBHOOK_ID
    # Returns: True/False
```

**License Service** (`license_service.py`):
```python
def generate_license(tenant_id: str, plan: str, duration_days: int):
    # Format: AGY-{TENANT_ID}-{TIMESTAMP}-{CHECKSUM}
    # Example: AGY-tenant123-20260125-a3f8c9d2
    # Binding: domain + hardware fingerprint
    # Expiry: 365 days (annual renewal)
```

**Invoice Service** (`invoice_service.py`):
```python
def calculate_vn_tax(amount_vnd: float, quarter_total: float):
    THRESHOLD = 500_000_000  # VND (~$20,000 USD)
    if quarter_total + amount_vnd <= THRESHOLD:
        return {"rate": 0.005, "method": "simplified"}  # 0.5%
    else:
        return {"rate": 0.20, "method": "standard + VAT"}  # 10% + 10%
```

### 4. AI Engine Layer (antigravity/core)

**Location**: `antigravity/core/`
**Responsibilities**:
- AI model quota management
- MCP server orchestration
- Command registry (unified CLI)
- Cost optimization (Gemini models)

**Components**:
```
antigravity/core/
├── registry/             # Command metadata
│   ├── command_registry.py
│   └── mcp_catalog.py
├── knowledge/            # Knowledge graph
│   ├── quantum_manifest.py
│   └── entity_extractor.py
├── mcp_orchestrator.py   # MCP lifecycle
└── quota_engine.py       # Cost management
```

**Integration**:
- Proxy: `antigravity-claude-proxy` @ localhost:8080
- Models: Gemini Flash (speed), Gemini Pro (depth)
- Quota: Token-based rate limiting

### 5. Database Layer (Supabase)

**Technology**: PostgreSQL 15+ (Supabase hosted)
**Schema**: See `backend/database/schema.sql`

**Core Tables**:

**users**:
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'solo',  -- solo | team | enterprise
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**subscriptions**:
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',  -- active | paused | cancelled
    price_usd DECIMAL(10, 2) NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'annual',  -- monthly | annual
    next_billing_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**payments**:
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    amount_usd DECIMAL(10, 2) NOT NULL,
    gateway VARCHAR(20) NOT NULL,  -- paypal | polar
    gateway_order_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',  -- pending | completed | failed | refunded
    created_at TIMESTAMP DEFAULT NOW()
);
```

**licenses**:
```sql
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_key VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    domain VARCHAR(255),  -- Binding domain
    hardware_fingerprint VARCHAR(255),  -- Binding hardware
    status VARCHAR(50) DEFAULT 'active',  -- active | expired | revoked
    created_at TIMESTAMP DEFAULT NOW()
);
```

**invoices**:
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id),
    amount_vnd DECIMAL(15, 2) NOT NULL,
    tax_rate DECIMAL(5, 4) NOT NULL,  -- 0.005 or 0.20
    tax_method VARCHAR(50) NOT NULL,  -- simplified | standard + VAT
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',  -- draft | sent | paid | overdue
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 6. CLI Tools Layer (scripts/)

**Location**: `scripts/cc`
**Technology**: Python Click CLI
**Purpose**: Developer/admin operations

**Command Structure**:
```
scripts/
├── cc                    # Main CLI entry point
├── commands/
│   ├── revenue.py        # cc revenue dashboard/forecast/autopilot
│   ├── sales.py          # cc sales products-*/contract-*
│   ├── deploy.py         # cc deploy backend/health/rollback
│   ├── finance.py        # cc finance invoice-*/status
│   ├── content.py        # cc content generate
│   ├── outreach.py       # cc outreach add/draft/send
│   └── test.py           # cc test run/coverage
```

**Key Commands**:
- `cc revenue dashboard` - Real-time MRR/ARR/churn metrics
- `cc deploy backend` - Deploy FastAPI to Google Cloud Run
- `cc finance invoice-create` - Generate VN tax-compliant invoices
- `cc sales contract-create` - Auto-generate MSAs/SOWs

---

## Payment Flow (Detailed)

### PayPal Payment Flow (Primary)

```
┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: User initiates payment                                   │
└────────────┬─────────────────────────────────────────────────────┘
             │
   [Browser] → Click "Buy Pro Plan ($995/year)"
             │
             ↓
┌──────────────────────────────────────────────────────────────────┐
│ STEP 2: Frontend creates checkout session                        │
└────────────┬─────────────────────────────────────────────────────┘
             │
   [Next.js] → POST /api/checkout
             │   Body: { plan: "pro", amount: 995 }
             │
             ↓
   [API Route] → Calls backend payment service
             │
             ↓
┌──────────────────────────────────────────────────────────────────┐
│ STEP 3: Backend creates PayPal order                             │
└────────────┬─────────────────────────────────────────────────────┘
             │
   [FastAPI] → POST https://api-m.paypal.com/v2/checkout/orders
             │   Headers: {
             │     Authorization: Bearer {ACCESS_TOKEN},
             │     Content-Type: application/json
             │   }
             │   Body: {
             │     intent: "CAPTURE",
             │     purchase_units: [{
             │       amount: { currency_code: "USD", value: "995.00" }
             │     }],
             │     application_context: {
             │       return_url: "https://yourdomain.com/checkout/success",
             │       cancel_url: "https://yourdomain.com/checkout/cancel"
             │     }
             │   }
             │
             ↓
   [PayPal] → Returns: { id: "ORDER_ID_123", links: [...] }
             │
             ↓
   [FastAPI] → Saves to DB:
             │   INSERT INTO payments (gateway_order_id, status)
             │   VALUES ('ORDER_ID_123', 'pending')
             │
             ↓
   [Frontend] → Redirects user to PayPal approval URL
             │
             ↓
┌──────────────────────────────────────────────────────────────────┐
│ STEP 4: User approves payment on PayPal                          │
└────────────┬─────────────────────────────────────────────────────┘
             │
   [PayPal] → User logs in and approves
             │
             ↓
   [PayPal] → Redirects to return_url with ?token=ORDER_ID_123
             │
             ↓
┌──────────────────────────────────────────────────────────────────┐
│ STEP 5: Backend captures payment                                 │
└────────────┬─────────────────────────────────────────────────────┘
             │
   [Next.js] → GET /checkout/success?token=ORDER_ID_123
             │
             ↓
   [API Route] → POST /api/v1/payments/capture
             │   Body: { order_id: "ORDER_ID_123" }
             │
             ↓
   [FastAPI] → POST https://api-m.paypal.com/v2/checkout/orders/ORDER_ID_123/capture
             │   Headers: { Authorization: Bearer {ACCESS_TOKEN} }
             │
             ↓
   [PayPal] → Returns: {
             │   id: "ORDER_ID_123",
             │   status: "COMPLETED",
             │   purchase_units: [{
             │     payments: {
             │       captures: [{
             │         id: "CAPTURE_ID_456",
             │         status: "COMPLETED"
             │       }]
             │     }
             │   }]
             │ }
             │
             ↓
   [FastAPI] → Updates DB:
             │   UPDATE payments SET status = 'completed' WHERE gateway_order_id = 'ORDER_ID_123'
             │   INSERT INTO subscriptions (user_id, plan, status, next_billing_date)
             │   INSERT INTO licenses (user_id, license_key, expires_at)
             │
             ↓
┌──────────────────────────────────────────────────────────────────┐
│ STEP 6: PayPal webhook confirms payment (backup verification)    │
└────────────┬─────────────────────────────────────────────────────┘
             │
   [PayPal] → POST /api/v1/webhooks/paypal
             │   Headers: {
             │     PAYPAL-TRANSMISSION-ID: "webhook_id",
             │     PAYPAL-TRANSMISSION-SIG: "signature_hash"
             │   }
             │   Body: {
             │     event_type: "PAYMENT.CAPTURE.COMPLETED",
             │     resource: { id: "CAPTURE_ID_456", ... }
             │   }
             │
             ↓
   [FastAPI] → Verify webhook signature:
             │   POST https://api-m.paypal.com/v1/notifications/verify-webhook-signature
             │   Body: {
             │     transmission_id: headers['PAYPAL-TRANSMISSION-ID'],
             │     transmission_sig: headers['PAYPAL-TRANSMISSION-SIG'],
             │     webhook_id: env['PAYPAL_WEBHOOK_ID'],
             │     webhook_event: request_body
             │   }
             │
             ↓
   [PayPal] → Returns: { verification_status: "SUCCESS" }
             │
             ↓
   [FastAPI] → Process webhook event:
             │   UPDATE payments SET status = 'completed' WHERE gateway_order_id = 'ORDER_ID_123'
             │   (Idempotent update - safe to run multiple times)
             │
             ↓
┌──────────────────────────────────────────────────────────────────┐
│ STEP 7: Dashboard refreshes                                      │
└────────────┬─────────────────────────────────────────────────────┘
             │
   [Frontend] → SWR/TanStack Query refetches:
             │   GET /api/v1/subscriptions
             │   GET /api/v1/licenses
             │
             ↓
   [Dashboard] → Displays:
             │   ✅ Subscription: Pro Plan ($995/year)
             │   🔑 License Key: AGY-tenant123-20260125-a3f8c9d2
             │   📅 Next Billing: 2027-01-25
```

### Retry Logic (Capture Failures)

```python
# backend/services/payment_service.py
async def capture_paypal_payment_with_retry(order_id: str, max_retries: int = 3):
    for attempt in range(1, max_retries + 1):
        try:
            response = await paypal_client.capture_order(order_id)
            if response["status"] == "COMPLETED":
                return response
        except Exception as e:
            if attempt < max_retries:
                await asyncio.sleep(2 ** (attempt - 1))  # 1s, 2s, 4s backoff
                continue
            else:
                raise PaymentCaptureError(f"Failed after {max_retries} attempts: {e}")
```

### Webhook Security (MANDATORY)

```python
# backend/api/routers/webhooks.py
@router.post("/paypal")
async def paypal_webhook(request: Request):
    headers = dict(request.headers)
    body = await request.body()

    # STEP 1: Verify signature
    is_valid = await payment_service.verify_paypal_webhook(headers, body)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    # STEP 2: Process event (idempotent)
    event = await request.json()
    await payment_service.process_paypal_event(event)

    return {"status": "ok"}
```

---

## Key Integrations

### 1. PayPal Integration (Primary Payment Gateway)

**Configuration** (`.env`):
```bash
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_secret_here
PAYPAL_WEBHOOK_ID=your_webhook_id_here
PAYPAL_MODE=sandbox  # or 'live' for production
```

**Key Features**:
- **Mode switching**: Sandbox (dev) / Live (prod)
- **Webhook verification**: Signature validation (fail closed)
- **Retry logic**: 3 attempts with exponential backoff (1s, 2s, 4s)
- **Refund window**: 180 days (PayPal policy)
- **Currency support**: USD, EUR, GBP, JPY, VND (via conversion)

**Implementation**: `backend/services/payment_service.py`

### 2. Polar Integration (Backup Payment Gateway)

**Configuration** (`.env`):
```bash
POLAR_API_KEY=your_api_key_here
```

**Key Features**:
- **SaaS-focused**: Built-in subscription management
- **Global support**: 135+ currencies
- **Auto-retry**: Built-in failed payment recovery
- **Usage**: Fallback when PayPal unavailable

**Implementation**: `backend/services/payment_service.py`

### 3. Supabase Integration (Database + Auth)

**Configuration** (`.env`):
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here  # Backend only
```

**Key Features**:
- **PostgreSQL**: Managed database
- **Auth**: Built-in user authentication
- **Realtime**: WebSocket subscriptions (future)
- **Storage**: File uploads (future)

**Implementation**: `backend/database/supabase_client.py`

### 4. Gemini API Integration (AI Models)

**Configuration** (`.env`):
```bash
GEMINI_API_KEY=your_api_key_here
```

**Models**:
- `gemini-3-flash[1m]` - Speed (1M token context)
- `gemini-3-pro-high[1m]` - Depth (1M token context)

**Proxy**: `antigravity-claude-proxy` @ localhost:8080
**Quota Management**: `antigravity/core/quota_engine.py`

**Implementation**: `antigravity/core/mcp_orchestrator.py`

### 5. Google Cloud Integration (Deployment)

**Services Used**:
- **Cloud Run**: FastAPI backend deployment
- **Cloud SQL**: PostgreSQL (if not Supabase)
- **Cloud Storage**: File uploads (future)

**Deployment**: `scripts/cc deploy backend`

---

## Security Considerations

### 1. Payment Security

**PayPal**:
- ✅ Webhook signature verification (MANDATORY)
- ✅ HTTPS only (TLS 1.2+)
- ✅ No credit card storage (PCI-DSS compliant)
- ✅ Secure credential storage (env vars, no hardcoding)

**Database**:
- ✅ Encrypted connections (Supabase SSL)
- ✅ Row-level security (RLS) policies
- ✅ No sensitive data logging

### 2. Authentication

**JWT Tokens**:
- Expiry: 24 hours (access token)
- Refresh: 30 days (refresh token)
- Algorithm: HS256 (HMAC-SHA256)
- Secret: Environment variable (`JWT_SECRET`)

**Implementation**: `backend/middleware/auth.py`

### 3. API Security

**Rate Limiting**:
- 100 requests/minute per IP (global)
- 10 requests/minute for checkout endpoints
- Implementation: `backend/middleware/rate_limit.py`

**CORS**:
- Allowed origins: `https://yourdomain.com` (prod), `http://localhost:3000` (dev)
- Credentials: Allowed
- Implementation: `backend/middleware/cors.py`

### 4. Secret Management

**Environment Variables** (`.env`):
- ❌ Never commit to git
- ✅ Use `.env.example` as template
- ✅ Rotate secrets quarterly
- ✅ Use secret management services in production (Google Secret Manager)

---

## Deployment Architecture

### Development Environment

```
Developer Machine
├── Frontend: apps/dashboard (Next.js Dev Server @ localhost:3000)
├── Backend: backend/api (uvicorn @ localhost:8000)
├── Database: Supabase (cloud)
├── Payments: PayPal Sandbox
└── AI: Antigravity Claude Proxy (localhost:8080)
```

### Production Environment (Google Cloud)

```
Google Cloud Platform
├── Cloud Run: FastAPI backend (autoscaling 0-10 instances)
├── Cloud Storage: Static assets (Next.js build)
├── Cloud Load Balancer: HTTPS termination
├── Cloud SQL: PostgreSQL (if not Supabase)
└── External:
    ├── Supabase: Database + Auth
    ├── PayPal: Payment processing
    └── Vercel: Next.js hosting (alternative to Cloud Storage)
```

**Deployment Commands**:
```bash
# Backend
cc deploy backend          # Deploy FastAPI to Cloud Run

# Frontend (Vercel)
vercel --prod              # Deploy Next.js to Vercel

# Health Check
cc deploy health           # System diagnostics

# Rollback
cc deploy rollback         # Emergency rollback
```

---

## Monitoring & Observability

### Application Metrics

**Revenue Metrics** (`cc revenue dashboard`):
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Churn Rate
- Customer Lifetime Value (CLV)

**Payment Metrics**:
- Success rate (target: >98%)
- Failed captures (retry rate)
- Refund rate (target: <2%)
- Gateway latency (PayPal response time)

**System Metrics**:
- API response time (p50, p95, p99)
- Error rate (target: <0.1%)
- Database query time
- Cache hit rate

### Logging

**Backend Logs** (FastAPI):
- Request/response (structured JSON)
- Payment events (sanitized, no sensitive data)
- Error traces (Sentry integration)

**Frontend Logs** (Next.js):
- Client-side errors (browser console)
- API errors (network failures)
- User actions (analytics)

**Database Logs** (Supabase):
- Slow queries (>100ms)
- Failed connections
- Authentication failures

---

## Performance Optimization

### Frontend

**Next.js**:
- Static generation (ISG) for public pages
- Server-side rendering (SSR) for dashboard
- Image optimization (next/image)
- Code splitting (dynamic imports)

**Caching**:
- SWR revalidation (5 seconds)
- API response cache (Redis, future)
- CDN caching (Vercel Edge Network)

### Backend

**FastAPI**:
- Async/await for I/O operations
- Connection pooling (Supabase client)
- Background tasks (Celery, future)

**Database**:
- Indexes on foreign keys (user_id, subscription_id)
- Query optimization (EXPLAIN ANALYZE)
- Connection pooling (max 10 connections)

### AI Engine

**Quota Optimization**:
- Gemini Flash for simple queries
- Gemini Pro for complex reasoning
- Token caching (MCP responses)
- Lazy loading (on-demand tool activation)

---

## Vietnam Tax Strategy (2026)

### Threshold Management

**Limits**:
- **Threshold**: 500,000,000 VND (~$20,000 USD per quarter)
- **Below threshold**: 0.5% simplified tax
- **Above threshold**: 10% standard + 10% VAT = 20% total

**Strategy**:
- Split large invoices across quarters
- Invoice in VND (not USD) for local clients
- Quarterly filing via GDT e-filing portal

**Implementation**: `backend/services/invoice_service.py`

```python
def calculate_vn_tax(amount_vnd: float, quarter_total: float) -> dict:
    THRESHOLD = 500_000_000  # VND
    if quarter_total + amount_vnd <= THRESHOLD:
        return {
            "rate": 0.005,
            "method": "simplified",
            "tax_amount": amount_vnd * 0.005
        }
    else:
        standard_tax = amount_vnd * 0.10
        vat = amount_vnd * 0.10
        return {
            "rate": 0.20,
            "method": "standard + VAT",
            "tax_amount": standard_tax + vat
        }
```

---

## Subscription Tiers (2026 Pricing)

| Tier       | Price      | Features                                  | Target        |
|------------|------------|-------------------------------------------|---------------|
| **Solo**   | $395/year  | 1 user, 3 agents, 10K requests/month      | Solopreneur   |
| **Team**   | $995/year  | 5 users, 10 agents, 50K requests/month    | Small agency  |
| **Enterprise** | Custom | Unlimited users/agents, dedicated support | Large agency  |

**License Format**: `AGY-{TENANT_ID}-{TIMESTAMP}-{CHECKSUM}`
- Example: `AGY-tenant123-20260125-a3f8c9d2`
- Expiry: 365 days (annual renewal)
- Binding: Domain + hardware fingerprint

---

## Unresolved Questions

1. **Payment Gateway Failover**: How to handle PayPal downtime? Should Polar be auto-fallback or manual?
2. **Multi-Currency Invoicing**: Should we support VND invoices for Vietnam clients?
3. **Refund Automation**: Auto-refund on cancellation within 30 days?
4. **Database Scaling**: When to migrate from Supabase to self-hosted PostgreSQL?
5. **Real-time Updates**: WebSocket for live dashboard updates (subscription changes)?

---

## References

### Internal Documentation
- [system-architecture.md](./system-architecture.md) - AgencyOS agent architecture
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Deployment guide
- [FINANCE_OPS.md](./FINANCE_OPS.md) - Financial operations
- [PAYPAL_TESTING_GUIDE.md](./PAYPAL_TESTING_GUIDE.md) - PayPal testing

### External Resources
- [PayPal API Docs](https://developer.paypal.com/api/rest/)
- [Polar API Docs](https://docs.polar.sh/api/)
- [Supabase Docs](https://supabase.com/docs)
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com/)

---

**ARCHITECTURE COMPLETE**
