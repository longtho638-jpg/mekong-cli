# Research Report: Formbricks SDK & Integration Patterns
Date: 2026-03-01 | Repo: github.com/formbricks/formbricks

---

## 1. SDK Design (JS/React)

**Init pattern** — CommandQueue singleton, blocking setup before user actions:
```
formbricks.setup({ environmentId, appUrl })
  → CommandQueue.add(setup, { blocking: true })
  → wait() → scheduleAsync(checkPageUrl)
```

**Public API surface** (all queue-backed, async):
- `track(code, properties?)` — code-based event emission
- `setUserId / setEmail / setAttribute / setAttributes` — identity/attribute management
- `registerRouteChange()` — SPA navigation trigger
- `setNonce(nonce)` — CSP propagation to lazy-loaded survey widget
- `logout()` — session clear

**Key pattern:** CommandQueue ensures `setUserId()` called synchronously after `setup()` is always processed BEFORE page-view triggers fire. Explicit ordering guarantee via blocking flag.

**SDK modules** (4 domains under `packages/js-core/src/lib/`):
- `common/` — shared utils, `makeRequest()`, Result<T,E> API pattern
- `environment/` — env state fetch/cache (surveys, triggers, branding)
- `survey/` — display logic, trigger evaluation, widget lifecycle
- `user/` — identity state, attribute sync to server

**API client** — Result-type returns (not throw-based), no built-in retry, delegates to calling code.

---

## 2. Data Pipeline

```
User action
  → SDK track(event)
  → Public Client API (unauthenticated POST)
  → Zod validation
  → Prisma write → PostgreSQL (Response model)
  → Response Pipeline (async, post-commit)
      ├── Webhook delivery (HTTP POST to registered URLs)
      ├── Email notifications (conditional on response values)
      └── Integration fan-out (Zapier, n8n, Slack, etc.)
```

**Key details:**
- Public API is unauthenticated (no API key needed for response submission)
- `zod-prisma-types` generates TS+Zod types from Prisma schema — single source of truth
- UUIDv7 primary keys → chronological sorting + B-tree index performance
- Prisma Accelerate for connection pooling (serverless/Vercel bursty traffic)
- Response Pipeline = async post-write fan-out, not inline with HTTP response

---

## 3. Workflow Engine (Conditional Logic, Triggers, Actions)

**Trigger types:**
- `ActionClass` — code-based events via `track()`, CSS-selector clicks, page-URL patterns
- Session events — survey shown once per session, N days cooldown
- Attribute filters — show only if user.attribute matches condition

**Survey display state machine** (SDK-side):
1. Fetch `EnvironmentState` (all surveys + trigger config) — cached locally
2. On each `track()` / route change → evaluate all surveys against user state
3. First matching survey → render widget (lazy-loaded from CDN)
4. Widget completion → POST response → pipeline

**Branching (conditional logic in survey):**
- Logic jumps encoded per-question: `if answer == X → jump to question N`
- Evaluated client-side inside the survey widget
- Not a server-side workflow engine — pure declarative JSON config interpreted by widget

**Actions (post-submission):**
- Response Pipeline triggers registered webhooks
- Email follow-ups based on response value conditions
- No built-in retry logic in webhook delivery (observed from codebase)

---

## 4. Multi-tenant Architecture

**Hierarchy:**
```
Organization (tenant root)
  └── Project (groups surveys)
        ├── Environment: Production  (isolated data, API keys, contacts)
        └── Environment: Development (isolated data, API keys, contacts)
```

**Isolation:** `organizationId` + `environmentId` foreign keys on all resources — shared DB, logical separation (not schema-per-tenant).

**RBAC:**
- Org-level roles: Owner, Manager, Member, Billing
- Project-level permissions: `read`, `readWrite`, `manage` (granular per project/team)

**Env separation** is a standout pattern: Prod/Dev split within each project prevents test data contaminating analytics.

---

## 5. Self-hosting vs Cloud

| Dimension | Self-hosted | Cloud |
|---|---|---|
| Data | Full on-prem | Formbricks infra |
| Ops | User manages: backups, cron, reverse proxy, updates | Zero-ops |
| Auth | Local Auth + SAML configured by user | Managed MFA/SSO |
| Customization | Full env var + code access | UI only |
| Compliance | User responsibility | GDPR/SOC2 provided |
| Deployment | Docker, Kubernetes (Helm), Railway, Zeabur | formbricks.com |

**License:** AGPLv3 core + Enterprise Edition (license key) for advanced features (SSO, audit logs, etc.).

---

## Mapping to Mekong-CLI Patterns

### Plan-Execute-Verify ↔ Response Pipeline
- Formbricks' async Response Pipeline (write → fan-out) maps directly to Mekong's Plan→Execute→Verify
- Post-commit fan-out = parallel verify steps (webhook, email, integration)
- **Applicable pattern:** `RecipeOrchestrator` could emit a pipeline event after execution, running verification steps asynchronously (webhook notify + quality check + doc update) rather than inline

### CommandQueue ↔ Agent Orchestration
- CommandQueue's `blocking` flag + `wait()` pattern = explicit task ordering guarantee
- Maps to Mekong's need for ordered agent chains: `planner` MUST complete before `developer` starts
- **Applicable pattern:** A lightweight CommandQueue with `blocking` flag would handle sequential agent chains more reliably than promise chains

### EnvironmentState Cache ↔ Skill/Plugin System
- SDK fetches all survey configs once → caches locally → evaluates triggers client-side
- Maps to skill activation: load skill manifests once at session start, evaluate which skills apply per task
- **Applicable pattern:** `.claude/skills/` manifests could be loaded into a session-level `SkillState` cache, with trigger evaluation (does this task match skill's activation criteria?) before execution

### ActionClass Trigger ↔ Recipe Trigger
- Formbricks ActionClass (code event → survey) maps to Mekong recipe triggers (user goal → recipe selection)
- NLU in `src/nlu.py` already does this — Formbricks confirms this is the right architecture
- **Applicable pattern:** Explicit ActionClass registry (event name → handler) would be cleaner than current NLU-only routing for known command patterns

### Public Unauthenticated Ingestion ↔ Webhook Delivery Reliability
- Formbricks accepts responses without auth — simplifies client SDK at cost of spam risk
- Mitigation: environment-scoped endpoints (each env has unique token in URL)
- **Applicable pattern:** For Mekong's webhook delivery (raas-gateway), use environment-scoped tokens in URL rather than header-based auth — reduces SDK complexity

### Prod/Dev Environment Split ↔ Task Pipeline Isolation
- Formbricks' Prod/Dev isolation prevents test data in analytics
- **Applicable pattern:** Mekong recipe runs could have `dry_run` vs `live` mode baked into the environment model, not just a CLI flag — ensures verifier never uses live data in test mode

---

## Unresolved Questions
1. Webhook delivery retry logic — not confirmed from codebase inspection; docs imply at-most-once delivery
2. Survey conditional logic server-side evaluation — unclear if server validates submitted responses against declared logic
3. EnvironmentState cache TTL — not confirmed; likely session-scoped but unclear on staleness strategy
4. Enterprise features scope — exact features behind license key not fully enumerated
5. Response Pipeline failure handling — what happens if webhook delivery fails (DLQ? silent drop?)
