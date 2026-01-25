# ARCHITECTURE MASTER PLAN - AgencyOS (Mekong CLI)

**Generated:** 2026-01-25
**Status:** READ ONLY - Master Reference Document
**Version:** 5.1.1 (Production Ready)

---

## EXECUTIVE SUMMARY

AgencyOS is a **Binh Pháp (Art of War)-powered Operating System** for solopreneurs and agencies. Built on nuclear weaponization principles, it transforms every input into scalable, automated agency operations.

**Core Philosophy:** "Không đánh mà thắng" (Win Without Fighting)

**Key Metrics:**
- 48 Skills (dual systems: `.claude-skills/` + `.agencyos/skills/`)
- 24 Agents (orchestrated via `antigravity/`)
- 14 MCP Servers (payment, revenue, security, orchestration)
- 3 Apps (dashboard, docs, web landing)
- Backend API (FastAPI + Python)
- CLI (Mekong CLI via `antigravity/cli/`)

---

## I. ARCHITECTURE LAYERS

### Layer 1: CORE INTELLIGENCE (`antigravity/`)

**Purpose:** Nuclear weaponization engine - transforms inputs into production-ready outputs

**Key Modules:**

1. **Agent Orchestrator** (`core/agent_orchestrator/`)
   - `engine.py` - Multi-agent coordination
   - `delegator.py` - Task delegation
   - `monitor.py` - Performance tracking
   - `analytics.py` - Metrics & reporting

2. **Agent Memory System** (`core/agent_memory/`)
   - `blackboard.py` - Shared memory across agents
   - `storage.py` - Persistent memory
   - `retrieval.py` - Context-aware retrieval
   - `compression.py` - Memory optimization

3. **Agent Swarm** (`core/swarm/`)
   - `coordinator.py` - Parallel agent execution
   - `enums.py` - Agent states & types

4. **CLI Bridge** (`cli/`)
   - Entry point for `cc` commands
   - Maps to MCP servers & backend API

5. **MCP Servers** (`mcp_servers/`)
   - 14 specialized servers (revenue, sales, security, etc.)
   - Protocol: Model Context Protocol
   - Integration: Claude Code CLI + Gemini models

6. **Infrastructure** (`infrastructure/`)
   - Deployment configs (Cloud Run, Kubernetes)
   - CI/CD pipelines
   - Health checks & monitoring

---

### Layer 2: BACKEND API (`backend/`)

**Purpose:** FastAPI-based backend serving agents, webhooks, and business logic

**Structure:**

```
backend/
├── api/           # API routes (17 modules)
├── services/      # Business logic (42 modules)
├── controllers/   # Request handlers (8 modules)
├── middleware/    # Auth, rate limiting (10 modules)
├── models/        # Pydantic schemas (8 modules)
├── db/            # Database layer (Supabase)
├── websocket/     # Real-time communication
├── tests/         # Test suite (25 modules)
└── main.py        # FastAPI app entry
```

**Critical Services:**
- Payment webhooks (PayPal, Stripe)
- Subscription management
- Invoice generation (VN tax compliant)
- License generation & validation
- CRM & pipeline tracking

**API Endpoints (Samples):**
- `POST /api/payments/paypal/webhook` - PayPal verification
- `POST /api/subscriptions` - Create subscription
- `GET /api/revenue/dashboard` - Financial metrics
- `POST /api/invoices` - Generate invoices

---

### Layer 3: FRONTEND APPS (`apps/`)

**Purpose:** User-facing interfaces for agency operations

**Apps:**

1. **Dashboard** (`apps/dashboard/`) - Next.js 15 (App Router)
   - Revenue tracking & forecasting
   - Client management (CRM)
   - Agent monitoring
   - Subscription billing
   - A/B test results
   - **Tech:** React 19, Tailwind CSS, shadcn/ui

2. **Docs** (`apps/docs/`) - Astro static site
   - AgencyOS documentation
   - API references
   - Integration guides
   - **Tech:** Astro, MDX

3. **Web Landing** (`apps/web/`) - Marketing site
   - Public landing pages
   - Pricing tiers (Solo/Team/Enterprise)
   - Lead capture forms
   - **Tech:** Next.js, TypeScript

---

### Layer 4: SKILLS ECOSYSTEM

**Dual System Architecture:**

#### System A: `.claude-skills/` (48 skills)
- **Location:** User home + project root
- **Purpose:** Claude Code CLI specialization
- **Categories:**
  - Development (backend, frontend, mobile, databases)
  - DevOps (cloudflare, deployment)
  - Design (UI/UX, frontend-design-pro)
  - Payment (payment-integration, better-auth)
  - Content (copywriting, SEO, marketing)
  - Tools (MCP, debugging, planning)

#### System B: `.agencyos/skills/` (48 skills - mirrors A)
- **Location:** Project-specific
- **Purpose:** AgencyOS command integration
- **Mapping:** 1:1 with `.claude-skills/`

**Critical Skills:**
- `payment-integration` - PayPal/Stripe flows
- `backend-development` - FastAPI patterns
- `binh-phap-wisdom` - Strategic planning
- `planning` - Task orchestration
- `ui-ux-pro-max` - 50 styles, 21 palettes, 9 stacks

---

### Layer 5: CONFIGURATION SYSTEM

**Config Hierarchy (Precedence):**
1. `.claude/config/` - Project overrides (HIGHEST)
2. `.claude/rules/` - Project defaults
3. `$HOME/.claude/workflows/` - Global defaults
4. Built-in defaults (LOWEST)

**Rule Categories** (`.claude/rules/`):
```
00-core/          # Foundational rules
01-strategy/      # Binh Pháp principles
02-development/   # Code standards
03-operations/    # DevOps protocols
04-client/        # Client management
05-revenue/       # Financial rules
06-specialized/   # Domain-specific
```

**Hooks** (`.claude/hooks/`):
- Privacy block (sensitive file protection)
- Scout block (context optimization)
- Validation hooks (pre-commit, pre-push)

---

## II. DATA FLOWS

### Flow 1: PAYMENT WEBHOOK → REVENUE UPDATE

```
PayPal/Stripe Webhook (HTTPS POST)
  ↓
backend/api/payments/{provider}/webhook
  ↓
Verify signature (mandatory)
  ↓
backend/services/payment_service.py
  ↓
Update DB (Supabase)
  ↓
Trigger events:
  - Email receipt (backend/services/email_service.py)
  - Update revenue dashboard (apps/dashboard/)
  - Log transaction (.antigravity/cashflow/)
```

### Flow 2: USER COMMAND → AI AGENT EXECUTION

```
User: cc revenue dashboard
  ↓
antigravity/cli/revenue.py
  ↓
MCP Server: revenue_server
  ↓
antigravity/core/agent_orchestrator/engine.py
  ↓
Delegate to specialized agent
  ↓
Query backend API (GET /api/revenue/dashboard)
  ↓
Format output (JSON → CLI table)
  ↓
Return to user
```

### Flow 3: NEW SUBSCRIPTION → LICENSE GENERATION

```
User: Purchase "Pro Plan"
  ↓
apps/dashboard/api/checkout
  ↓
backend/api/subscriptions (POST)
  ↓
Create Stripe/PayPal subscription
  ↓
backend/services/license_service.py
  ↓
Generate license: AGY-{tenant}-{timestamp}-{checksum}
  ↓
Store in DB (expiry: 365 days)
  ↓
Email license key
  ↓
Activate in apps/dashboard/
```

---

## III. CRITICAL BUSINESS RULES

### 1. VIETNAM TAX COMPLIANCE

**Threshold Management:**
- Limit: 500M VND (~$20K USD) per quarter
- Below: 0.5% simplified tax
- Above: 20% total (10% standard + 10% VAT)

**Implementation:** `backend/services/tax_service.py`

### 2. PAYMENT GATEWAY LOGIC

**PayPal:**
- Modes: `sandbox` / `live` (env: `PAYPAL_MODE`)
- Webhook verification: MANDATORY (fail closed)
- Retry logic: 3 attempts (exponential backoff)
- Refund window: 180 days

**Stripe:**
- Price IDs: Store in env (not hardcoded)
- Webhook secret: Required for signature verification
- Modes: `payment` (one-time) | `subscription` (recurring)

**Config:** `backend/.env`

### 3. LICENSE VALIDATION

**Format:** `AGY-{TENANT_ID}-{TIMESTAMP}-{CHECKSUM}`
- **Expiry:** 365 days (annual renewal)
- **Binding:** Domain + hardware fingerprint
- **Validation:** On every API call

**Implementation:** `antigravity/core/licensing/`

### 4. SUBSCRIPTION TIERS (2026 Pricing)

| Tier | Price | Features | Target |
|------|-------|----------|--------|
| Solo | $395/year | 1 user, 3 agents, 10K requests/month | Solopreneur |
| Team | $995/year | 5 users, 10 agents, 50K requests/month | Small agency |
| Enterprise | Custom | Unlimited users/agents, dedicated support | Large agency |

---

## IV. TECHNOLOGY STACK

### Frontend
- Next.js 15 (App Router, Server Components)
- React 19 (Suspense, Concurrent Mode)
- TypeScript 5.x
- Tailwind CSS + shadcn/ui
- TanStack Router
- MUI v7 (Material Design 3)

### Backend
- FastAPI (Python 3.11+)
- Pydantic (data validation)
- Supabase (PostgreSQL + Auth)
- Redis (caching)
- Celery (async tasks)

### AI/Agent Layer
- Claude Code CLI (orchestration)
- Gemini 1.5 Flash (1M context, speed)
- Gemini 1.5 Pro (deep reasoning)
- Model Context Protocol (MCP)
- Antigravity Proxy (quota management)

### Infrastructure
- Google Cloud Run (backend)
- Vercel (frontend apps)
- Cloudflare (CDN, edge functions)
- GitHub Actions (CI/CD)
- Docker + Kubernetes (k8s/)

### Databases
- Supabase (PostgreSQL)
- Redis (in-memory cache)
- ChromaDB (vector embeddings)
- JSON files (.antigravity/)

---

## V. SECURITY ARCHITECTURE

### Authentication Flow
```
User Login (apps/dashboard/)
  ↓
Backend: POST /api/auth/login
  ↓
Verify credentials (Supabase Auth)
  ↓
Generate JWT token (expiry: 7 days)
  ↓
Return token + refresh token
  ↓
Store in httpOnly cookie
  ↓
Middleware validates on every request
```

### Payment Security
- Webhook signature verification (MANDATORY)
- Input validation (Pydantic schemas)
- Rate limiting (100 req/min per IP)
- SQL injection prevention (ORM-only)
- XSS prevention (output escaping)
- CSRF tokens (POST requests)

### Secrets Management
- Environment variables (`.env` - never committed)
- GitHub Secrets (CI/CD)
- Google Secret Manager (production)
- Privacy hooks (`.claude/hooks/privacy-block.cjs`)

---

## VI. OBSERVABILITY & MONITORING

### Metrics Collection
```
antigravity/core/telemetry/
  ↓
.antigravity/telemetry/
  ↓
backend/services/analytics_service.py
  ↓
Aggregate & store
  ↓
apps/dashboard/analytics/
```

### Health Checks
- Endpoint: `GET /health`
- Checks:
  - Database connection
  - Redis availability
  - External APIs (PayPal, Stripe)
  - Disk space
  - Memory usage

**Command:** `cc deploy health`

### Logging
- Backend logs: `backend/logs/`
- Antigravity logs: `.antigravity/debug/`
- Format: JSON (structured)
- Retention: 30 days

---

## VII. DEPLOYMENT TOPOLOGY

### Production Environment

```
Cloudflare CDN
  ↓
Vercel (Next.js apps) ← apps/dashboard/, apps/docs/, apps/web/
  ↓
Google Cloud Run (FastAPI backend) ← backend/
  ↓
Supabase (PostgreSQL + Auth)
  ↓
Redis (Cloud Memorystore)
```

### Staging Environment
- Mirror of production
- Separate databases
- PayPal sandbox mode
- Stripe test mode

### CI/CD Pipeline (GitHub Actions)
```
git push → main
  ↓
Run tests (pytest, vitest)
  ↓
Build Docker image
  ↓
Push to GCP Artifact Registry
  ↓
Deploy to Cloud Run
  ↓
Run smoke tests
  ↓
Notify Slack/Email
```

**Commands:**
- `cc deploy backend` - Deploy to Cloud Run
- `cc deploy rollback` - Emergency rollback

---

## VIII. KEY INTEGRATIONS

### 1. MCP Servers (14 Total)

| Server | Role | Port |
|--------|------|------|
| `agency_server` | Core operations | 8081 |
| `revenue_server` | Financials | 8082 |
| `security_server` | Auth & permissions | 8083 |
| `orchestrator_server` | Agent coordination | 8084 |
| `quota_server` | Cost management | 8085 |
| `coding_server` | Implementation | 8086 |
| `marketing_server` | Content generation | 8087 |
| `network_server` | Social media | 8088 |
| `solo_revenue_server` | Solopreneur models | 8089 |
| `recovery_server` | Disaster recovery | 8090 |
| `sync_server` | Claude ↔ Gemini bridge | 8091 |
| `ui_server` | MD3 components | 8092 |
| `workflow_server` | Process automation | 8093 |
| `commander_server` | High-level audit | 8094 |

### 2. Payment Gateways
- PayPal (REST API v2)
- Stripe (Payment Intents API)
- VietQR (SePay integration)

### 3. Third-Party APIs
- Supabase (Auth, DB, Storage)
- Cloudflare (CDN, Workers, R2)
- Google Cloud (Run, Secret Manager, Logging)
- Vercel (Hosting, Analytics)

---

## IX. CRITICAL FILE LOCATIONS

### Configuration
- `.env` - Secrets (NEVER commit)
- `.env.example` - Template
- `backend/.env.example` - Backend secrets template
- `.claude/config/` - Project overrides
- `.claude/rules/` - Development rules

### Business Logic
- `antigravity/core/` - Core intelligence
- `backend/services/` - Business services
- `backend/api/` - API routes
- `antigravity/cli/` - CLI commands

### Data Storage
- `.antigravity/cashflow/` - Financial transactions
- `.antigravity/crm/` - Client data
- `.antigravity/tasks/` - Task tracking
- `.antigravity/telemetry/` - Metrics

### Documentation
- `docs/` - Project docs
- `apps/docs/` - Public docs site
- `plans/` - Implementation plans
- `claudedocs/` - AI-generated docs

---

## X. WIN-WIN-WIN VALIDATION GATES

Before ANY decision, verify:

1. **👑 ANH (Owner) WIN:**
   - Revenue increase?
   - Time saved?
   - Automation gained?

2. **🏢 AGENCY WIN:**
   - Scalability improved?
   - Technical debt reduced?
   - Client satisfaction up?

3. **🚀 STARTUP/CLIENT WIN:**
   - Value delivered?
   - Problem solved?
   - ROI positive?

**If ANY party loses → STOP. Redesign.**

---

## XI. AGENT INVENTORY (24 Agents)

**Location:** `.agent/subagents/`

**Categories:**

1. **Core Agents** (6)
   - Planner
   - Coder
   - Tester
   - Debugger
   - Reviewer
   - Deployer

2. **Hub Agents** (8)
   - Executive Hub
   - Marketing Hub
   - Sales Hub
   - Finance Hub
   - HR Hub
   - IT Hub
   - Legal Hub
   - Creative Hub

3. **Ops Agents** (10)
   - Sales Ops (SDR, AE, SE)
   - Marketing Ops (Content, SEO, PPC, Social)
   - Revenue Ops
   - HR Ops
   - Finance Ops

**Orchestration:** `antigravity/core/agent_orchestrator/`

---

## XII. TESTING STRATEGY

### Test Pyramid
```
E2E Tests (10%) ← apps/dashboard/tests/e2e/
  ↓
Integration Tests (30%) ← backend/tests/integration/
  ↓
Unit Tests (60%) ← backend/tests/unit/
```

### Coverage Targets
- Backend: 80%+ (pytest)
- Frontend: 70%+ (vitest)
- E2E: Critical paths only (Playwright)

### Test Commands
- `cc test run` - Full suite
- `pytest --cov` - Backend coverage
- `pnpm test` - Frontend tests

---

## XIII. MIGRATION PATHS

### From Claude Code to AgencyOS
1. Clone repository
2. Copy `.env.example` → `.env`
3. Configure payment keys
4. Run `pnpm install`
5. Start backend: `cd backend && uvicorn main:app`
6. Start dashboard: `cd apps/dashboard && pnpm dev`

### From Monolith to Modular
- Current: Monolithic `backend/main.py`
- Target: Microservices (payment, auth, revenue)
- Migration: Phase 2 (not started)

---

## XIV. OPEN QUESTIONS

1. **Gemini Proxy Status:**
   - Is `antigravity-claude-proxy` running on port 8080?
   - Quota tracking enabled?

2. **Payment Gateway Redundancy:**
   - Failover if PayPal down?
   - Backup to Stripe automatic?

3. **Multi-Tenancy:**
   - Current: Single tenant
   - Future: Multi-tenant architecture?

4. **Horizontal Scaling:**
   - Cloud Run auto-scaling config?
   - Load balancer strategy?

5. **Data Backup:**
   - Supabase backups automated?
   - Recovery time objective (RTO)?

---

## XV. NEXT STEPS (NOT FOR EXECUTION - REFERENCE ONLY)

**Phase 1: Security Hardening**
- Implement rate limiting (all endpoints)
- Add CAPTCHA (signup/login)
- Enable 2FA (optional)

**Phase 2: Performance Optimization**
- CDN for static assets
- Database query optimization
- Redis caching layer

**Phase 3: Feature Expansion**
- Multi-currency support (beyond VND/USD)
- Invoice customization (logo, branding)
- Advanced analytics (Metabase integration)

**Phase 4: Internationalization**
- Vietnamese localization (i18n)
- Multi-language support (docs, UI)

---

**END OF ARCHITECTURE MASTER PLAN**

*This document is READ ONLY. For execution tasks, see TERMINAL_EXECUTION_PLAN.md*
