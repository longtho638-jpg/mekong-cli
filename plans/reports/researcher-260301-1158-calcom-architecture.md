# Cal.com Architecture Research Report
**Date:** 2026-03-01 | **Project:** mekong-cli RaaS AGI CLI
**Focus:** Scheduling platform patterns applicable to autonomous task execution

---

## Executive Summary
Cal.com's architecture emphasizes **modular integration patterns, dual-layer API design, and event-driven state management**. Key learnings: monorepo with generated metadata registries, tRPC for internal type-safety, REST v2 for platform extensibility, and a validation-first booking pipeline.

---

## 1. Monorepo Package Organization Pattern

**Structure:** Yarn workspaces + Turborepo, 21 packages + 2 apps

| Package Type | Examples | Pattern |
|---|---|---|
| Core Services | `lib`, `prisma`, `features`, `platform` | Business logic layer, database schema, service implementations |
| API Layers | `trpc`, `app-store` | tRPC procedures + REST adapters |
| Support | `config`, `types`, `tsconfig`, `i18n`, `emails` | Shared infrastructure, type defs, translations |
| Features | `ee`, `features` | Experimental/enterprise features loaded by flag |

**Lesson for mekong-cli:** Split `src/core/` into packages: `@mekong/executor`, `@mekong/planner`, `@mekong/verifier`, `@mekong/agents`. Create `packages/shared-types` for cross-agent contracts.

---

## 2. Plugin/App System (Registry Pattern)

**Cal.com's Approach:**
- `packages/app-store/` contains 150+ integration directories (googlecalendar, zoom, stripe, etc.)
- Generated metadata files: `apps.metadata.generated.ts`, `apps.schemas.generated.ts` auto-catalog all apps
- Central registry (`_appRegistry.ts`) enables dynamic app discovery without modifying core
- Each app = self-contained dir with config, adapters, UI components

**Implementation Pattern:**
```
/packages/app-store/
  ├── googlecalendar/
  │   ├── metadata.ts (capability declarations)
  │   ├── services.ts (calendar adapter)
  │   └── schema.ts (OAuth scopes, required fields)
  └── (150+ more apps...)
```

**Lesson for mekong-cli:**
- Create `packages/skill-registry/` with metadata generation similar to cal.com's `apps.metadata.generated.ts`
- Each skill is a self-contained package with `manifest.ts`, `executor.ts`, `schema.ts`
- Auto-generate `SKILLS_REGISTRY.md` from metadata (mirrors cal.com's approach)

---

## 3. Dual-Layer API Design (tRPC + REST)

**Cal.com's Pattern:**
- **Internal:** tRPC procedures (`viewer.*` authenticated, `public.*` unauthenticated) for web app
- **External:** NestJS REST v2 (`/v2/bookings`, `/v2/event-types`) for platform OAuth clients
- **Shared Logic:** Both APIs consume identical services from `@calcom/features`

**tRPC Layer Benefits:**
- End-to-end type safety between frontend and procedures
- Caching strategies (session bypass, 5min feature cache, no schedule cache)
- Request batching, centralized error handling

**Lesson for mekong-cli:**
- Keep `RecipePlanner.plan()`, `RecipeExecutor.execute()`, `RecipeVerifier.verify()` as tRPC procedures
- Expose REST endpoints for external integrations (Telegram webhook, Antigravity API calls)
- Share execution logic between internal CLI and external platform APIs

---

## 4. Service-Based Architecture (Booking Pipeline Pattern)

**Validation-First Flow:**
1. **Authentication Check** → EventType.bookingRequiresAuthentication
2. **Field Validation** → hasRequiredBookingFieldsResponses()
3. **Event Type Resolution** → By ID | By Username+Slug | By Team+Slug
4. **Type Routing** → Regular | Recurring | Instant | Seated bookings
5. **Availability Verification** → AvailableSlotsService (Redis cache + PostgreSQL query)
6. **Slot Confirmation** → Re-verify time slot available (prevent race conditions)
7. **Creation** → Create Booking record (ACCEPTED or PENDING status)
8. **Integration** → EventManager creates calendar events
9. **Notifications** → Emails + webhooks triggered

**Key Patterns:**
- **Multi-strategy resolution** (ID, slug, team slug) mirrors goal→recipe matching in mekong-cli
- **Availability service** with Redis caching prevents double-booking (lesson: use cache for slot verification)
- **Dry-run mode** for testing without side effects (mirrors mekong-cli `--dry-run`)

**Lesson for mekong-cli:**
- Apply validation pipeline to recipe execution: schema validation → plan validation → step-by-step verification
- Use Redis/cache layer for result deduplication (prevent re-running same task)
- Implement "dry-run" for plan preview without executing shell commands

---

## 5. Credential & OAuth Management Pattern

**Cal.com Approach:**
- Credentials stored in database with OAuth provider metadata
- OAuth guard manages "platform-managed users" for multi-tenant scenarios
- Each integration app declares OAuth scopes in `schema.ts`
- Tokens rotated via refresh token exchange

**Lesson for mekong-cli:**
- Store Telegram API keys, Anthropic tokens, Git credentials in Supabase via `CredentialStore`
- Use same pattern for external tool credentials (Stripe, Airtable, GitHub API)
- Each skill can declare required credentials in manifest

---

## 6. Event-Driven Architecture (Implicit)

**Cal.com's Pattern:**
- `handleNewBooking()` → EventManager → Calendar events
- Webhooks triggered post-booking (internal notification bus)
- Email service decoupled (async)
- Services operate on immutable `Booking` records

**Lesson for mekong-cli:**
- `orchestrator.execute(recipe)` → emit events: `recipe.started`, `step.completed`, `step.failed`, `recipe.verified`
- Webhook handler listens to recipe completion → triggers next mission in Tôm Hùm queue
- Task queue treats missions as immutable records in `tasks/processed/`

---

## 7. Backward Compatibility via Date-Versioned Controllers

**Cal.com's Strategy:**
- REST API controllers named by date: `BookingsController_2024_08_13`
- New API versions added without deprecating old ones
- Enables gradual migration of clients

**Lesson for mekong-cli:**
- Recipe schema versions: `RecipeV1`, `RecipeV2` in manifest
- Orchestrator auto-detects recipe version and routes to correct executor
- Support multiple tRPC procedure versions (`viewer.recipes.executeV1`, `viewer.recipes.executeV2`)

---

## 8. Testing Strategy

**Cal.com Uses:**
- **E2E:** Playwright with HTML reporting
- **Unit:** Vitest
- **Dry-run:** Booking dry-run mode for validation without side effects

**Lesson for mekong-cli:**
- Add dry-run mode to RecipeExecutor (plan only, no shell exec)
- Use Playwright for end-to-end mission testing (Tôm Hùm daemon + CC CLI workflow)
- Keep unit tests lightweight (62 tests, ~2.5min runtime target)

---

## Patterns Applicable to Mekong-CLI

| Cal.com Pattern | Mekong-CLI Application |
|---|---|
| App registry + metadata generation | Skill registry + auto-generated SKILLS_REGISTRY.md |
| Dual API (tRPC + REST) | Internal tRPC + Telegram/Antigravity REST endpoints |
| Service-based validation pipeline | RecipePlanner → Executor → Verifier chain |
| Event-driven notifications | recipe.started/completed webhooks → Tôm Hùm next mission |
| Credential management | CredentialStore for Telegram, Anthropic, Git tokens |
| Date-versioned API endpoints | Recipe schema versions (V1, V2) |
| Caching layer for availability | Redis cache for deduplicated task execution (prevent reruns) |
| Modular monorepo | `@mekong/executor`, `@mekong/planner`, `@mekong/skills-core` packages |

---

## Unresolved Questions

1. How does cal.com handle long-running booking operations (video sync, calendar polling)?
2. Does cal.com use message queues (Bull/BullMQ) for async jobs, or async/await?
3. Multi-tenancy enforcement: does cal.com validate team.id on every query?
4. How are app credentials encrypted in the database?
5. Rate limiting strategy for OAuth clients on REST v2?

---

**Sources:**
- [Cal.com Repository](https://github.com/calcom/cal.com)
- [Booking Lifecycle | DeepWiki](https://deepwiki.com/calcom/cal.com/3-api-architecture)
- [Booking Creation and Validation | DeepWiki](https://deepwiki.com/calcom/cal.com/3.2-booking-creation-and-validation)
- [Cal.com API Guide](https://meetergo.com/en/magazine/cal-com-api)
- [Team Management | DeepWiki](https://deepwiki.com/calcom/cal.com/3.2-managed-users-and-oauth)
