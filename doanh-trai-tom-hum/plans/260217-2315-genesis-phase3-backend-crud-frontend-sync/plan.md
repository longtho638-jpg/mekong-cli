# GENESIS Phase 3 — Backend CRUD + Frontend Sync

**Date:** 2026-02-17 23:15
**Status:** 🔥 ACTIVE
**Complexity:** STRATEGIC (Full-stack monorepo integration)
**Timeout:** 60 phút

---

## 🎯 MISSION OBJECTIVE

Triển khai full-stack CRUD system cho Mission management:
1. **Database Schema** (packages/db) — Prisma Mission model
2. **Backend API** (apps/api) — 4 CRUD endpoints với Hono.js
3. **Frontend Dashboard** (apps/web) — Mission list + create form với Next.js 14

---

## 📊 RESEARCH FINDINGS (Self-Analyzed)

### 1. Prisma Schema Strategy
**Decision:** Dùng `String @id @default(cuid())` để consistent với existing User/Subscription models.

**Enum Style:** UPPER_CASE (matching existing UserRole, SubscriptionPlan patterns)

**Indexes:** `@@index([status])`, `@@index([priority])` cho common filters.

### 2. Hono.js API Pattern
**Route Structure:** Inline routes trong `src/index.ts` (monolithic approach, simple cho 4 endpoints)

**Validation:** Manual validation (avoid adding zod dependency cho scope nhỏ)

**Error Format:**
```typescript
{ success: false, error: { message: string, code: string } }
{ success: true, data: T }
```

### 3. Next.js 14 Data Fetching
**Component Split:**
- **Server Component:** Mission list fetch + initial render
- **Client Component:** Create form modal (needs useState)

**Loading:** `loading.tsx` file trong app/dashboard/

**Error:** `error.tsx` file với retry button

### 4. Turborepo Workspace Linking
**Syntax:**
```json
// apps/api/package.json
"dependencies": {
  "@lobster/db": "workspace:*"
}
```

**Build Order:** Turbo handles via `^build` dependency — db builds first.

### 5. Prisma Client Generation
**Timing:** Run `pnpm db:generate` ONCE after schema changes, BEFORE build.

**No postinstall needed** — manual trigger via Makefile/scripts.

### 6. Docker PostgreSQL
**DATABASE_URL:** `postgresql://lobster:lobster_secret_2026@db:5432/lobster_empire` (already correct in docker-compose.yml)

**Local Dev:** Create `.env` với `DATABASE_URL=postgresql://lobster:lobster_secret_2026@localhost:5432/lobster_empire`

### 7. CORS Config
**Current Setup:** `app.use("*", cors())` — accepts all origins (OK for dev, tighten for prod later)

**Adequate for now** — Next.js localhost:3000 can call API.

### 8. Form Handling
**Decision:** Native form với `useState` (simple, no RHF overhead)

**Modal:** Native `<dialog>` element (modern, no library needed)

**Validation:** Client-side basic checks + server-side in API

### 9. Error Boundaries
**API Error Format:**
```typescript
try {
  // ... prisma op
  return c.json({ success: true, data: mission })
} catch (e) {
  return c.json({ success: false, error: { message: e.message, code: 'INTERNAL_ERROR' } }, 500)
}
```

**Frontend:** error.tsx với generic error message + retry button

### 10. Build Verification
**Strategy:**
1. `pnpm db:generate` — Generate Prisma Client
2. `pnpm build` — Turbo builds all workspaces
3. Type-check: `tsc --noEmit` (implicit in build)
4. Manual smoke test: Start API → curl endpoints

---

## 📁 FILES TO MODIFY (Max 10)

1. `packages/db/prisma/schema.prisma` — Add Mission model + enums
2. `packages/db/package.json` — Verify dependencies
3. `apps/api/package.json` — Add @lobster/db dependency
4. `apps/api/src/index.ts` — Add 4 CRUD endpoints
5. `apps/web/package.json` — Add @lobster/db dependency (for types)
6. `apps/web/app/dashboard/page.tsx` — Create dashboard with mission list
7. `apps/web/app/dashboard/loading.tsx` — Loading skeleton
8. `apps/web/app/dashboard/error.tsx` — Error boundary
9. `.env` (new file) — Local DATABASE_URL
10. `Makefile` (modify) — Add db:generate shortcut

**Total:** 9 files modified + 1 new = 10 files ✅

---

## 🗺️ IMPLEMENTATION PHASES

| Phase | Description | Priority | Deps |
|-------|-------------|----------|------|
| [Phase 01](./phase-01-database-schema.md) | Prisma Mission model + enums | 🔴 HIGH | None |
| [Phase 02](./phase-02-prisma-generate.md) | Generate Prisma Client + verify types | 🔴 HIGH | Phase 01 |
| [Phase 03](./phase-03-api-workspace-setup.md) | Link @lobster/db to apps/api | 🟡 MEDIUM | Phase 02 |
| [Phase 04](./phase-04-api-crud-endpoints.md) | Implement 4 CRUD endpoints | 🔴 HIGH | Phase 03 |
| [Phase 05](./phase-05-web-workspace-setup.md) | Link @lobster/db to apps/web | 🟡 MEDIUM | Phase 02 |
| [Phase 06](./phase-06-dashboard-ui.md) | Build dashboard page + mission list | 🔴 HIGH | Phase 05 |
| [Phase 07](./phase-07-create-form.md) | Create mission form modal | 🟡 MEDIUM | Phase 06 |
| [Phase 08](./phase-08-docker-verification.md) | Test Docker Compose stack | 🟢 LOW | Phase 04 |
| [Phase 09](./phase-09-build-verification.md) | Verify pnpm build passes | 🔴 HIGH | Phase 07 |
| [Phase 10](./phase-10-manual-testing.md) | Full CRUD flow manual test | 🔴 HIGH | Phase 09 |

---

## ⚡ SUCCESS CRITERIA

- [x] Research completed (inline)
- [ ] packages/db/prisma/schema.prisma has Mission model
- [ ] Prisma Client generated successfully
- [ ] apps/api has GET/POST/PATCH/DELETE /api/missions endpoints
- [ ] apps/web/app/dashboard/page.tsx renders mission list
- [ ] docker-compose up starts PostgreSQL + API
- [ ] pnpm run build completes with 0 errors
- [ ] Manual test: Full CRUD cycle works (Create → Read → Update → Delete)

---

## 🚨 CONSTRAINTS & RISKS

**Constraints:**
- Max 10 files modified ✅
- No breaking changes to existing health endpoint ✅
- Turbo pipeline unchanged (db:generate already exists) ✅
- Tiếng Việt responses ✅

**Risks:**
1. **Prisma Client not generated before API build** → Mitigation: Explicit db:generate step in Phase 02
2. **Type errors across workspaces** → Mitigation: Phase 03/05 verify imports before implementation
3. **Docker port conflicts** → Mitigation: Phase 08 docker-compose down first
4. **CORS issues** → Mitigation: Existing wildcard CORS already handles it

---

## 📝 NEXT STEPS

1. Read Phase 01 details → Implement Mission schema
2. Run `pnpm db:generate` → Verify Prisma Client
3. Proceed sequentially through Phase 03-10

**Estimated Duration:** 45-55 phút (trong 60 phút timeout)

---

_Plan created: 2026-02-17 23:15 | COMMANDER RULE 13: Self-research mode (researchers unavailable)_
