# Research Report: cal.com Architecture Deep Dive

**Date:** 2026-03-01
**Scope:** cal-com/cal.com open source — architectural patterns for RaaS AGI mapping
**Sources:** GitHub CLI direct API inspection + DeepWiki + cal.com handbook + official docs
**Stars:** 40,394 | **Stack:** TypeScript, Next.js, tRPC, Prisma, NestJS, Turborepo, Zod, Vitest, Playwright

---

## Table of Contents

1. [Monorepo Structure](#1-monorepo-structure)
2. [Core Architecture Patterns](#2-core-architecture-patterns)
3. [Scheduling Engine](#3-scheduling-engine)
4. [API Design](#4-api-design)
5. [App Store / Plugin System](#5-app-store--plugin-system)
6. [Webhook System](#6-webhook-system)
7. [Multi-tenancy](#7-multi-tenancy)
8. [Embedding — Atoms SDK](#8-embedding--atoms-sdk)
9. [Infrastructure & Scaling](#9-infrastructure--scaling)
10. [RaaS Patterns](#10-raas-patterns)
11. [Unresolved Questions](#11-unresolved-questions)

---

## 1. Monorepo Structure

**Tooling:** Turborepo + Yarn Workspaces. All code (public OSS + private closed-source) in single repo.

```
cal.com/
├── apps/
│   ├── web/              # Main app — app.cal.com (Next.js 16)
│   ├── api/              # Platform API v2 — NestJS, port 5555
│   ├── api-v1/           # Legacy API (Next.js Pages API)
│   ├── website/          # Marketing site — cal.com
│   ├── swagger/          # Auto-generated OpenAPI spec
│   └── docs/             # Documentation app
├── packages/
│   ├── prisma/           # DB schema + Prisma client (@calcom/prisma)
│   ├── features/         # Domain logic: bookings, workflows, event-types
│   ├── lib/              # Shared utilities (@calcom/lib)
│   ├── ui/               # Component library — Radix + Tailwind (@calcom/ui)
│   ├── app-store/        # Integration marketplace apps
│   ├── platform/
│   │   └── atoms/        # Embed SDK (@calcom/atoms, published to npm)
│   ├── embeds/
│   │   ├── core/         # Vanilla JS embed
│   │   └── react/        # React embed wrapper
│   └── trpc/             # tRPC routers and procedures
└── turbo.json            # Pipeline config (build, lint, test deps)
```

**Key conventions:**
- Local packages referenced as `@calcom/ui: "*"` — no version pinning, no npm publish (except atoms/embed)
- Each app has `.gitkeep` at `/apps/{name}/{name}/.gitkeep` for Vercel deploy script
- `scripts/vercel-deploy.sh` handles monorepo deployment orchestration
- Next.js uses `withTM()` (transpile-modules) to consume local packages

**Source:** [cal.com Handbook — Monorepo/Turborepo](https://handbook.cal.com/engineering/codebase/monorepo-turborepo)

---

## 2. Core Architecture Patterns

### 2.1 Dual API Layer

Two co-existing API systems, not fully migrated:

| Layer | Tech | Auth | Use |
|-------|------|------|-----|
| **tRPC** | `@calcom/trpc` | Session cookie / NextAuth | Internal web app |
| **REST v2** | NestJS (`apps/api`) | OAuth 2.0 / API key (`cal_` prefix) | Platform customers |

Router namespacing in tRPC:
- `viewer.*` — authenticated procedures
- `public.*` — unauthenticated procedures

Conditional routing pattern: `useSchedule` hook selects v2 API for team events when `useApiV2=true`, falls back to tRPC otherwise. Enables incremental migration.

### 2.2 Service Layer Sharing

Both APIs consume shared services — critical for consistency:
- `AvailableSlotsService` — availability calculation
- `BookingsService` — creation + validation
- `EventTypesService` — configuration management

Neither API owns domain logic. Logic lives in `packages/features/`.

### 2.3 Plan-Execute-Verify Analog

Cal.com's booking flow mirrors PEV pattern:
```
1. PLAN   → AvailableSlotsService computes slots (cached Redis)
2. EXECUTE → handleNewBooking validates + persists
3. VERIFY  → Workflow triggers (email/SMS/webhook) fire post-confirmation
```

### 2.4 State Management

- Server state: tRPC queries with SWR-style caching
- UI state: Zustand stores (`BookerStore`, etc.)
- Cache TTL: slots = uncached (always fresh), i18n = 1 year
- Redis: slot availability cache + session storage

---

## 3. Scheduling Engine

### 3.1 Key Prisma Models

```
User
EventType         # config: duration, location, limits, recurrence
  ├── hosts[]     # team members who can host
  ├── schedule    # which availability schedule applies
  └── bookingLimits # max bookings per period
Schedule          # named availability template (e.g. "Work Hours")
  └── availability[] # day-of-week + time ranges
Booking           # state: PENDING | ACCEPTED | CANCELLED | REJECTED
  ├── attendees[]
  └── references[] # external meeting links (Zoom, Google Meet URLs)
Credential        # encrypted OAuth tokens for calendar integrations
  └── encryptedKey # encrypted column
OutOfOffice       # blocks time ranges
```

### 3.2 Slot Generation Algorithm

`AvailableSlotsService` pipeline:
1. Load user's `Schedule` → expand day-of-week rules to date ranges
2. Load existing `Booking` records → mark busy slots
3. Load `OutOfOffice` periods → additional blocks
4. Apply `EventType.bookingLimits` (max per day/week/month)
5. Intersect → available slots
6. Cache result in Redis

**Round-Robin specifics:**
- Union of all hosts' available slots (not intersection)
- Host selected at booking time by: priority (low/medium/high/urgent) → weight (default 100%) → least-recently-booked
- Monthly reset: only current-month bookings counted for distribution fairness
- Groups: can require one host from each group per booking

### 3.3 Event Type Variants

| Type | Description |
|------|-------------|
| One-on-one | Standard single host |
| Collective | All hosts must be available (intersection) |
| Round-Robin | Union of slots, one host assigned at booking |
| Managed | Organization admin creates, propagates to members |
| Dynamic | Multi-user booking via URL param (user1+user2) |

### 3.4 Routing Forms

Pre-booking questionnaire system that routes to correct event type or team member:
- Custom fields (text, select, multiselect, phone, email)
- Conditional logic (if answer = X → route to event Y)
- `routingFormSearchParams` prop in Atoms for programmatic routing
- Wrong assignment reporting webhook: `WRONG_ASSIGNMENT_REPORT`

---

## 4. API Design

### 4.1 REST API v2 (NestJS)

**Pattern:** Date-versioned controllers for backward compat:
```
BookingsController_2024_08_13
SlotsController_2024_04_15
```

URL structure: `api.cal.com/v2/bookings` with `x-cal-api-version` header OR url segment.

**Auth:**
- OAuth 2.0 authorization code flow (platform customers)
- API key (`cal_` prefix) in Authorization header
- Managed user tokens (60-min access / 1-year refresh)

**Key endpoints (v2):**
```
GET  /v2/slots/available          # availability query
POST /v2/bookings                 # create booking
GET  /v2/bookings                 # list bookings
GET  /v2/event-types              # list event types
POST /v2/event-types              # create event type
POST /v2/managed-users            # create managed user
POST /v2/oauth/refresh            # token refresh
```

### 4.2 tRPC Internal API

Procedures used by web app:
```
viewer.bookings.get
viewer.eventTypes.get
viewer.availability.schedule
public.slots.getSchedule          # No auth, public availability
```

### 4.3 Token Lifecycle (Platform)

```
Platform customer creates OAuth client
  → Stores clientId + clientSecret
  → POST /managed-users → gets userId + accessToken + refreshToken
  → Store refreshToken in own DB
  → Frontend: pass accessToken to CalProvider
  → Atoms auto-call /refresh when token expires (60min TTL)
  → Backend refresh endpoint: never expose refreshToken to frontend
```

---

## 5. App Store / Plugin System

### 5.1 Structure

`packages/app-store/` — each integration is a directory:
```
packages/app-store/
├── googlecalendar/
│   ├── index.ts          # AppDeclaration
│   ├── api/              # OAuth callback handlers
│   └── lib/             # CalendarService implementation
├── zoom/
├── stripe/
├── salesforce/
└── _utils/               # Shared OAuth helpers
```

### 5.2 AppDeclaration Pattern

Every app declares metadata + capabilities:
```typescript
{
  name: "Google Calendar",
  slug: "google-calendar",
  type: "google_calendar",
  categories: ["calendar"],
  logo: "...",
  publisher: "Cal.com",
  url: "...",
  description: "...",
  // Capability flags
  isInstalled: false,
  isBuiltin: true,
  // OAuth config
  key: { client_id, client_secret, scopes }
}
```

### 5.3 Credential System

OAuth tokens stored in `Credential` table (encrypted):
- User installs app → OAuth flow → tokens stored as `Credential` record
- `Credential.key` = encrypted JSON (access_token, refresh_token, expiry_date)
- Calendar services receive `Credential` and use tokens for API calls
- Token refresh handled per-integration in each app's `CalendarService`

### 5.4 CalendarService Interface

All calendar apps implement:
```typescript
interface CalendarService {
  createEvent(event: CalendarEvent): Promise<NewCalendarEventType>
  updateEvent(uid: string, event: CalendarEvent): Promise<...>
  deleteEvent(uid: string): Promise<void>
  getAvailability(dateFrom, dateTo, selectedCalendars): Promise<EventBusyDate[]>
  listCalendars(): Promise<IntegrationCalendar[]>
}
```

This abstraction means booking engine doesn't know if it's Google, Outlook, or Apple — just calls the interface.

### 5.5 App Categories

- `calendar` — availability + event creation (Google, Outlook, iCloud)
- `video` — meeting link generation (Zoom, Teams, Google Meet)
- `payment` — collect payment pre/post booking (Stripe)
- `automation` — webhooks, Zapier, Make
- `crm` — Salesforce, HubSpot contact sync
- `analytics` — tracking pixels
- `other` — misc tools

---

## 6. Webhook System

### 6.1 Trigger Events (19 total)

```
Booking lifecycle:    BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RESCHEDULED
                      BOOKING_REQUESTED, BOOKING_REJECTED
Payment:              BOOKING_PAYMENT_INITIATED, BOOKING_PAID
Meeting:              MEETING_STARTED, MEETING_ENDED, INSTANT_MEETING
Recording:            RECORDING_READY, RECORDING_TRANSCRIPTION_GENERATED
Attendance:           BOOKING_NO_SHOW_UPDATED, AFTER_HOSTS_CAL_VIDEO_NO_SHOW
                      AFTER_GUESTS_CAL_VIDEO_NO_SHOW
Forms:                FORM_SUBMITTED, FORM_SUBMITTED_NO_EVENT
Admin:                OOO_CREATED, WRONG_ASSIGNMENT_REPORT
                      DELEGATION_CREDENTIAL_ERROR
```

### 6.2 Payload Design

```json
{
  "triggerEvent": "BOOKING_CREATED",
  "createdAt": "2024-01-01T00:00:00Z",
  "payload": { ...event-specific }
}
```

Versioned via `x-cal-webhook-version: 2021-10-20` header.

### 6.3 Security

HMAC-SHA256 signing:
- Configure shared secret at webhook setup
- Signature in `x-cal-signature-256` header
- Receiver verifies: `HMAC(secret, body) === header`

### 6.4 Custom Payloads

Template syntax for custom payload shape:
```
{{organizer.name}}, {{attendees.0.email}}, {{startTime}}, {{endTime}}
```

### 6.5 Scope

Webhooks configurable at:
- User level (all their bookings)
- EventType level (specific event only)
- Team level

---

## 7. Multi-tenancy

### 7.1 Three-Tier Hierarchy

```
Platform Customer (OAuth client)
  └── Organization (custom domain)
        └── Team
              └── User (member)
```

### 7.2 Organization-Level Isolation

- Custom domains (e.g., `acme.cal.com` or BYOD `schedule.acme.com`)
- Enabled via `ORGANIZATIONS_ENABLED=1` env flag
- DNS routing via Vercel edge or Cloudflare
- Users in org can't see outside org resources
- Managed event types: admin creates, propagates to all members (they can't delete)

### 7.3 Platform Customer Isolation

- Each OAuth client has a `clientId`
- `x-cal-client-id` header propagated through all API calls
- DB queries filtered by customer ownership
- Managed users scoped to their platform customer

### 7.4 Permission Scopes

OAuth scopes for platform:
- `READ_BOOKING` / `WRITE_BOOKING`
- `READ_EVENT_TYPE` / `WRITE_EVENT_TYPE`
- `READ_SCHEDULE` / `WRITE_SCHEDULE`
- `READ_PROFILE` / `WRITE_PROFILE`
- `READ_APP` / `WRITE_APP` (calendar integrations)

### 7.5 Role System (Team level)

- `OWNER` — full control
- `ADMIN` — manage members, event types
- `MEMBER` — personal scheduling only

---

## 8. Embedding — Atoms SDK

### 8.1 Two Embed Strategies

| Strategy | Package | Approach | Use case |
|----------|---------|----------|----------|
| **Iframe embed** | `@calcom/embed-core` | Vanilla JS, postMessage | Simple integration |
| **Atoms** | `@calcom/atoms` | React components, same tree | Deep product integration |

### 8.2 Atoms Architecture

```
CalProvider (root)
  └── AtomsWrapper (context: clientId, accessToken)
        └── BookerPlatformWrapper (exported as Booker)
              ├── useAtomsContext() → gets clientId
              ├── BookerStore (Zustand)
              └── BookerComponent (internal UI)
```

Three-layer design:
1. **Export layer** — `BookerPlatformWrapper` provides context
2. **Integration layer** — orchestrates hooks + state (tRPC vs API v2)
3. **UI layer** — internal `BookerComponent` from web app

### 8.3 Key Booker Props

```typescript
<Booker
  username="john"
  eventSlug="30min"
  isTeamEvent={false}
  teamId={undefined}
  view="MONTH_VIEW" // | WEEK_VIEW | COLUMN_VIEW
  defaultFormValues={{ name: "...", email: "..." }}
  metadata={{}}
  onCreateBookingSuccess={(data) => {}}
  onCreateBookingError={(err) => {}}
  onBookerStateChange={(state) => {}} // 50ms debounce
  rrHostSubsetIds={[]} // limit round-robin hosts
  isBookingDryRun={false} // test without creating
  customClassNames={{}} // full style override
/>
```

### 8.4 Available Atoms (beyond Booker)

- `Connect.GoogleCalendar` — OAuth calendar connection UI
- `AvailabilitySettings` — schedule management UI
- Booking list components
- Event type management

### 8.5 Iframe Embed

```html
<script src="https://cal.com/embed.js"></script>
<script>
  Cal("init", { origin: "https://cal.com" });
  Cal("inline", { elementOrSelector: "#my-cal", calLink: "john/30min" });
  Cal("on", { action: "bookingSuccessful", callback: (e) => {} });
</script>
```

Events: `bookingSuccessful`, `linkFailed`, `calLoaded`, `*` (all)

---

## 9. Infrastructure & Scaling

### 9.1 Deployment Stack

| Component | Tech |
|-----------|------|
| Web app | Vercel (Next.js) |
| Platform API | Vercel / self-hostable |
| Database | PostgreSQL (Prisma) |
| Cache | Redis |
| Background jobs | Cron-based (no queue library) |
| Video | Cal Video (built on Daily.co) |
| Email | Nodemailer (configurable SMTP) |

### 9.2 Background Jobs / Cron

Cal.com uses cron-based jobs (Next.js API routes as cron endpoints) rather than a dedicated queue:
- Workflow reminders (SMS/email before meetings)
- Recording transcription processing
- Out-of-office sync
- No evidence of BullMQ/Redis queues for async booking processing

### 9.3 Caching Strategy

```
Redis:
├── slot availability (per user+eventType+date range)
├── session storage
└── (planned) booking hold/slot reservation

No-cache:
└── booking confirmation (always fresh DB write)

Long-cache (1 year):
└── i18n translation strings
```

### 9.4 Self-Hosting

Full self-host supported via Docker:
```
docker pull calcom/cal.com
```
Requires: PostgreSQL, Redis, SMTP config, optional: Stripe, Zoom credentials

### 9.5 Edge Functions

- Custom domain routing for orgs uses Vercel Edge Middleware
- Slots API designed to be cacheable at edge (immutable for past slots)

### 9.6 Scalability Bottlenecks

- `AvailableSlotsService` is CPU-intensive for large teams (many hosts × many days)
- Redis caching mitigates but doesn't eliminate
- NestJS API v2 runs as separate process → scales independently from web

---

## 10. RaaS Patterns

### 10.1 What Makes cal.com "Scheduling as a Service"

**API-first headless scheduling:**
- Full booking lifecycle via REST v2 — no UI required
- Platform customer owns the UX, cal.com owns the engine
- Managed users = cal.com handles calendar sync, not the customer

**White-label:**
- Custom domains for organizations
- Atoms: fully styled with custom CSS classes
- No cal.com branding required (platform tier)
- HIPAA, SOC2, GDPR compliant

**Programmatic control:**
```
Create user → Set availability → Create event types → Share booking link
All via API. User never logs into cal.com.
```

### 10.2 Managed User Pattern (Core RaaS)

```
Your App                          Cal.com
─────────────────────────────────────────
1. User signs up in your app
2. POST /managed-users ──────────> Creates shadow user
3. Receives accessToken + refreshToken
4. Store refreshToken in your DB
5. Connect Google Calendar ──────> OAuth flow via Atoms
6. Cal stores Credential (encrypted)
7. User's customers book via Booker atom
8. Webhooks notify your app ─────> Handle business logic
```

### 10.3 Routing as a Service

Routing forms enable:
- Pre-booking qualification (CRM-style)
- Conditional assignment to team members
- Wrong assignment correction via webhook
- Integration with CRM data for owner-based routing

**Pattern:** Form → Conditional logic → EventType selection → Booking → Webhook

### 10.4 Slot Reservation Pattern

`isBookingDryRun` + `onReserveSlotSuccess`/`onDeleteSlotSuccess` callbacks enable:
- Soft holds on slots (show as tentative)
- Release if payment fails
- Multi-step checkout with slot guarantee

### 10.5 Mapping to CLI RaaS AGI

| cal.com concept | CLI RaaS analog |
|-----------------|-----------------|
| Managed users | Agent personas with calendar access |
| EventType | Recipe/task template with time constraints |
| Routing form | Intent classification → agent routing |
| Round-robin | Load-balanced agent assignment |
| Webhooks | Event bus → AGI action triggers |
| Availability schedule | Agent availability windows |
| Booking | Task assignment with time commitment |
| `handleNewBooking` | Mission dispatcher |
| tRPC procedures | Internal AGI command bus |
| REST v2 API | External API surface for clients |
| Credential system | OAuth token vault for agent integrations |

---

## 11. CI/CD Pipeline (Verified via GitHub CLI)

### 11.1 Workflow Count: 60+ files in `.github/workflows/`

| Category | Key Workflows |
|----------|--------------|
| Build verify | `all-checks.yml`, `api-v1-production-build.yml`, `api-v2-production-build.yml`, `production-build-without-database.yml` |
| Unit/integration | `unit-tests.yml`, `integration-tests.yml`, `api-v2-unit-tests.yml` |
| E2E | `e2e.yml`, `e2e-app-store.yml`, `e2e-embed.yml`, `e2e-atoms.yml`, `performance-tests.yml` |
| Quality | `lint.yml`, `check-types.yml`, `check-api-v2-breaking-changes.yml`, `check-prisma-migrations.yml`, `security-audit.yml` |
| Cron | `cron-webhooks-triggers.yml`, `cron-bookingReminder.yml`, `cron-scheduleEmailReminders.yml`, +6 more |
| Release | `draft-release.yml`, `changesets.yml`, `release-docker.yaml` |
| DX | `i18n.yml`, `nextjs-bundle-analysis.yml`, `cleanup.yml`, `labeler.yml` |

### 11.2 Unit Test Strategy

- **Vitest** (replaced Jest), not `--isolate` for speed
- Multi-TZ: `TZ=UTC` + `TZ=America/Los_Angeles VITEST_MODE=timezone`
- `yarn prisma generate` before tests run
- Runtime: runs on `blacksmith-4vcpu-ubuntu-2404` (not standard GH runners)

### 11.3 E2E Strategy (Playwright)

- **Matrix sharding**: 8 shards × 4 workers per shard
- **Docker services** in CI: Postgres 13 + Mailhog (email testing)
- **Separate projects**: `@calcom/web`, `@calcom/app-store`, `@calcom/embed-core`, `@calcom/embed-react`
- Artifacts: blob reports per shard → merged via `merge-reports.yml`

### 11.4 CI Caching Stack

Custom composite actions:
- `.github/actions/cache-checkout` — sparse checkout cache
- `.github/actions/yarn-install` — node_modules cache
- `.github/actions/cache-db` — Prisma migration cache
- `.github/actions/cache-build` — Turbo build cache
- `TURBO_TOKEN` + `TURBO_TEAM` → remote cache on Vercel Turbo

### 11.5 Env Validation

Before `dev`: `dotenv-checker --schema .env.example --env .env` fails fast. Two env files: `.env` (common) + `.env.appStore` (integration API keys). Turbo `globalEnv[]` has 200+ env vars — cache invalidated on any change.

---

## 12. Direct GitHub Findings (Not in Docs)

### 12.1 Tasker System (Async Jobs)

```typescript
// packages/features/tasker/tasker.ts
interface Tasker {
  create<K>(type: K, payload: TaskPayloads[K], options?: {
    scheduledAt?: Date;
    maxAttempts?: number;
    referenceUid?: string;
  }): Promise<string>;
  cancel(id: string): Promise<string>;
  cancelWithReference(uid: string, type: TaskTypes): Promise<string | null>;
  cleanup(): Promise<void>;
}
```

Typed task registry — all task types declared:
```
sendWebhook, sendSms, triggerHostNoShowWebhook, triggerGuestNoShowWebhook,
triggerFormSubmittedNoEventWebhook, triggerFormSubmittedNoEventWorkflow,
translateEventTypeData, translateWorkflowStepData, createCRMEvent,
sendWorkflowEmails, scanWorkflowBody, scanWorkflowUrls, sendAnalyticsEvent,
executeAIPhoneCall, bookingAudit, sendAwaitingPaymentEmail,
sendProrationInvoiceEmail, webhookDelivery, ...
```

**Factory pattern** (`tasker-factory.ts`):
```typescript
class TaskerFactory {
  createTasker(type?: TaskerTypes): Tasker {
    if (type === "internal") return new InternalTasker();
    return new InternalTasker(); // Redis/SQS/TriggerDev planned
  }
}
```
Current: only `InternalTasker` active. TriggerDev, Redis backends are TODOs.

### 12.2 Dependency Injection Pattern

`packages/features/di/` has containers, tokens, modules — IoC container for shared services. Enables testing with mock implementations.

### 12.3 Repository Pattern in Bookings

```
packages/features/bookings/repositories/
├── IBookingRepository.ts       ← Interface
├── BookingRepository.ts        ← Prisma implementation
├── IAttendeeRepository.ts
├── PrismaBookingAttendeeRepository.ts
└── WrongAssignmentReportRepository.ts
```

Clean separation — business logic never imports Prisma directly.

### 12.4 App-Store Build Pipeline (Code Generation)

`turbo.json` inputs for `@calcom/app-store-cli#build`:
```json
"inputs": [
  "../../packages/app-store/**/package.json",
  "../../packages/app-store/**/config.json",
  "../../packages/app-store/**/api/**",
  "../../packages/app-store/**/components/**",
  "../../packages/app-store/**/lib/**",
  "../../packages/app-store/**/pages/**",
  "../../packages/app-store-cli/src/**"
]
```
Outputs: `*.generated.ts` / `*.generated.tsx` files (committed to git).

### 12.5 API v2 NestJS Module List (from `apps/api/v2/src/modules/`)

```
api-keys, apps, atoms, auth, billing, booking-seat, cal-unified-calendars,
conferencing, credentials, deployments, destination-calendars, email,
endpoints.module.ts, event-types, jwt, kysely, memberships, oauth-clients,
ooo, organizations, prisma, profiles, redis, roles, router, routing-forms,
selected-calendars, slots, stripe, teams, timezones, tokens, users,
verified-resources, webhooks, workflows
```

Full NestJS DI — each module encapsulates its own controller, service, repository.

### 12.6 Webhook Payload Signing (actual code)

```typescript
// packages/features/webhooks/lib/sendPayload.ts
import { createHmac } from "node:crypto";
// HMAC-SHA256 over body, secret configured per webhook subscription
// Content types: application/json | application/x-www-form-urlencoded
// Handlebars templating for custom payload shapes
```

### 12.7 App Env Vars via Zod (no hardcoded envs in apps)

From `CONTRIBUTING.md`:
> No env variables should be added by an app. They should be added in `zod.ts` and then they would be automatically available to be modified by the cal.com app admin.

Pattern: `packages/app-store/<app>/zod.ts` declares schema → admin UI auto-generates form fields.

---

## 13. Patterns Applicable to mekong-cli (Updated)

| Cal.com Pattern | mekong-cli Applicability | Priority |
|-----------------|--------------------------|----------|
| `app-store-cli` (Ink/meow) to scaffold integrations | `mekong agent:create` CLI scaffolding agents | HIGH |
| Build-time code-gen from metadata → typed registry | Generate `AGENT_REGISTRY` from `_metadata.py` files | HIGH |
| `Tasker` interface + factory (swappable backends) | `RecipeExecutor` backends: Internal → Redis/TriggerDev | HIGH |
| Repository pattern (Interface + Prisma impl) | `IRecipeRepository` → `SqlAlchemyRecipeRepository` | MEDIUM |
| Feature-domain packages (`features/bookings/`, `features/webhooks/`) | `src/features/webhooks/`, `src/features/tasks/` | MEDIUM |
| Turbo `globalEnv[]` cache busting | Turbo/Pants env-aware caching for Python | LOW |
| `dotenv-checker` before `dev` starts | `python3 -m mekong env-check` pre-flight | MEDIUM |
| Multi-TZ test runs in CI | `TZ=Asia/Ho_Chi_Minh pytest` matrix | LOW |
| E2E shard matrix (8×4 workers) | `pytest-xdist -n auto` for integration tests | LOW |
| Changeset-based releases | `commitizen` + `semantic-release` for mekong-cli | LOW |
| Webhook HMAC signing | Already in mekong webhook system | — |
| App metadata in `zod.ts` → admin auto-config | Agent config in Pydantic models → admin discovery | MEDIUM |
| DI container for testability | `src/features/di/` with injectable services | MEDIUM |

---

## 14. Unresolved Questions

1. **Queue architecture** — Does cal.com use any async queue (BullMQ, etc.) for booking processing, or is everything synchronous in the request cycle? Cron jobs are confirmed but booking creation path unclear.

2. **Slot reservation TTL** — How long does a slot hold last? No explicit TTL found in docs. Critical for avoiding double-bookings during payment flow.

3. **`packages/app-store` build process** — How are third-party apps (community submissions) bundled and enabled? Is there a runtime plugin loader or compile-time inclusion only?

4. **Database sharding** — For enterprise/org tenants, is there any tenant-per-schema isolation or is it all row-level filtering?

5. **Cal Video architecture** — Daily.co dependency: does cal.com wrap Daily's API directly or has custom WebRTC infra? Relevant for offline/on-premise deployments.

6. **Routing form conditional engine** — How complex can routing logic get? Is there a rule engine or just simple if/then? JSONLogic or custom?

7. **Instant meetings** — `INSTANT_MEETING` webhook trigger: how does this differ from regular booking? WebRTC dial-in pattern unclear.

8. **Federation/delegation credentials** — `DELEGATION_CREDENTIAL_ERROR` webhook suggests a delegation model. Unclear how admin-delegated calendar access works.

---

## Sources

- [cal.com Handbook — Monorepo/Turborepo](https://handbook.cal.com/engineering/codebase/monorepo-turborepo)
- [DeepWiki — cal.com Architecture](https://deepwiki.com/calcom/cal.com)
- [DeepWiki — Platform API & Atoms](https://deepwiki.com/calcom/cal.com/8.2-platform-api-integration)
- [cal.com Platform Quickstart](https://cal.com/docs/platform/quickstart)
- [cal.com Webhook Docs](https://cal.com/docs/developing/guides/automation/webhooks)
- [GitHub — calcom/cal.com](https://github.com/calcom/cal.com)
- [npm — @calcom/atoms](https://www.npmjs.com/package/@calcom/atoms)
- [GitHub — calcom/atoms-examples](https://github.com/calcom/atoms-examples)
