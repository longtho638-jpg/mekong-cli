# Phase 05: Agent Marketplace Registry — AgencyOS Web Dashboard

## Context Links
- Existing: `apps/agencyos-web/app/dashboard/` (Next.js, routes: agents, missions, revenue, settings)
- Existing: `src/raas/registry.py` (Recipe/Agent registry API, SQLite backend)
- Existing: `packages/core/vibe-agents/src/registry.ts` (AGENT_REGISTRY array)
- Existing: `packages/core/vibe-agents/src/types.ts` (AgentDefinition, BaseAgent)
- Existing: `apps/agencyos-web/components/dashboard/` (dashboard UI components)

## Parallelization
- **SONG SONG** voi Phase 01, 02, 03, 04
- File ownership: `apps/agencyos-web/app/dashboard/marketplace/` (NEW), `apps/agencyos-web/components/marketplace/` (NEW)
- KHONG cham: `src/core/` (Phase 01+02+03), `packages/memory/` (Phase 01), `packages/observability/` (Phase 03), `apps/openclaw-worker/` (Phase 04)

## Overview
- **Priority:** P3
- **Status:** pending
- **Mo ta:** Tao Agent Marketplace page trong AgencyOS dashboard. V1 READ-ONLY: list agents/recipes tu registry, hien thi stats (success rate, usage count, cost). Chua co install/publish — chi browse va view details.

## Key Insights
- `src/raas/registry.py` da co API: `GET /raas/registry/recipes`, `GET /raas/registry/agents`
- Registry tra ve: name, description, version, author, tags, usage_count
- agencyos-web dung: Next.js 15, shadcn/ui, Tailwind CSS
- V1 scope: 3 pages — marketplace list, agent detail, recipe detail
- Data source: fetch tu RaaS API (`/raas/registry/`) — KHONG duplicate logic

## Requirements

### Functional
- FR1: `/dashboard/marketplace` — grid view tat ca agents va recipes
- FR2: Search + filter by tag, phase (plan/code/ship), sort by usage/rating
- FR3: `/dashboard/marketplace/agents/[id]` — agent detail: definition, capabilities, success KPIs, usage stats
- FR4: `/dashboard/marketplace/recipes/[id]` — recipe detail: steps, verification criteria, run history
- FR5: Badge system: "Popular" (>100 runs), "Reliable" (>90% success), "New"

### Non-functional
- NFR1: SSR cho marketplace list (SEO, fast load)
- NFR2: Responsive: desktop grid + mobile list
- NFR3: Loading skeletons cho data fetch
- NFR4: Empty state khi registry trong

## Architecture

```
apps/agencyos-web/
├── app/dashboard/marketplace/
│   ├── page.tsx                    # Marketplace list (SSR)
│   ├── agents/
│   │   └── [id]/page.tsx           # Agent detail
│   └── recipes/
│       └── [id]/page.tsx           # Recipe detail
├── components/marketplace/
│   ├── marketplace-grid.tsx        # Agent/Recipe card grid
│   ├── marketplace-card.tsx        # Individual card component
│   ├── marketplace-search.tsx      # Search + filter bar
│   ├── agent-detail-view.tsx       # Agent detail component
│   ├── recipe-detail-view.tsx      # Recipe detail component
│   └── badge.tsx                   # Popular/Reliable/New badges
└── lib/
    └── (existing api utils)
```

### Data Flow
```
marketplace/page.tsx
  → fetch('/raas/registry/agents') + fetch('/raas/registry/recipes')
  → MarketplaceGrid renders cards
  → Click card → /dashboard/marketplace/agents/[id]
  → fetch('/raas/registry/agents/{id}')
  → AgentDetailView renders full info
```

## Related Code Files

### Modify
- KHONG modify existing files — tat ca la NEW files

### Create
| File | Purpose |
|------|---------|
| `apps/agencyos-web/app/dashboard/marketplace/page.tsx` | Marketplace list page (SSR) |
| `apps/agencyos-web/app/dashboard/marketplace/agents/[id]/page.tsx` | Agent detail page |
| `apps/agencyos-web/app/dashboard/marketplace/recipes/[id]/page.tsx` | Recipe detail page |
| `apps/agencyos-web/components/marketplace/marketplace-grid.tsx` | Card grid layout |
| `apps/agencyos-web/components/marketplace/marketplace-card.tsx` | Individual card |
| `apps/agencyos-web/components/marketplace/marketplace-search.tsx` | Search + filter |
| `apps/agencyos-web/components/marketplace/agent-detail-view.tsx` | Agent detail |
| `apps/agencyos-web/components/marketplace/recipe-detail-view.tsx` | Recipe detail |
| `apps/agencyos-web/components/marketplace/badge.tsx` | Status badges |

## Implementation Steps

1. **Tao route structure** `app/dashboard/marketplace/`
   - `page.tsx` — server component, fetch registry data
   - Nested routes cho agents/[id] va recipes/[id]

2. **Implement marketplace-card.tsx** (~60 lines)
   - Props: `{ type: 'agent'|'recipe', name, description, tags, usageCount, successRate }`
   - shadcn Card component voi: icon, title, description, tags, stats footer
   - Badge overlay: Popular/Reliable/New

3. **Implement marketplace-grid.tsx** (~50 lines)
   - Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
   - Loading skeleton state
   - Empty state: "Chua co agent/recipe nao"

4. **Implement marketplace-search.tsx** (~70 lines)
   - Search input (debounced, 300ms)
   - Tag filter: dropdown multi-select
   - Phase filter: plan | code | ship
   - Sort: usage (desc) | success rate (desc) | newest

5. **Implement marketplace/page.tsx** (~80 lines)
   - Server component: fetch agents + recipes tu RaaS API
   - Tabs: "Agents" | "Recipes" | "Tat ca"
   - Compose: MarketplaceSearch + MarketplaceGrid
   - Error boundary voi retry

6. **Implement agent-detail-view.tsx** (~80 lines)
   - Header: name, phase badge, description
   - Capabilities list
   - Success KPIs table
   - Usage stats chart (shadcn chart hoac simple bar)
   - Run history (recent 10 runs)

7. **Implement recipe-detail-view.tsx** (~80 lines)
   - Header: name, version, author
   - Steps list voi verification criteria
   - Usage count + success rate
   - Tags

8. **Implement badge.tsx** (~30 lines)
   - `Popular`: usageCount > 100 → orange badge
   - `Reliable`: successRate > 90 → green badge
   - `New`: createdAt < 7 days → blue badge

9. **Add sidebar link** trong dashboard layout
   - Them "Marketplace" link vao dashboard sidebar navigation
   - Icon: Store hoac Package icon tu lucide-react

## Todo List
- [ ] Tao `app/dashboard/marketplace/` route structure
- [ ] Implement `marketplace-card.tsx`
- [ ] Implement `marketplace-grid.tsx` voi loading skeleton
- [ ] Implement `marketplace-search.tsx` voi debounce
- [ ] Implement `marketplace/page.tsx` (SSR)
- [ ] Implement `agents/[id]/page.tsx`
- [ ] Implement `recipes/[id]/page.tsx`
- [ ] Implement `agent-detail-view.tsx`
- [ ] Implement `recipe-detail-view.tsx`
- [ ] Implement `badge.tsx`
- [ ] Add sidebar navigation link
- [ ] Test: marketplace page renders voi mock data
- [ ] Test: responsive layout (mobile/desktop)

## Success Criteria
- `/dashboard/marketplace` render grid of agents + recipes
- Search filter hoat dong voi debounce
- Agent detail page hien thi full definition + stats
- Recipe detail page hien thi steps + verification criteria
- Badges hien thi dung: Popular/Reliable/New
- Mobile responsive: cards stack vertically
- Empty state hien thi khi registry trong
- `pnpm --filter agencyos-web build` — 0 errors

## Conflict Prevention
- **KHONG cham** `src/core/` (Phase 01+02+03 owns)
- **KHONG cham** `packages/` (Phase 01+03 owns)
- **KHONG cham** `apps/openclaw-worker/` (Phase 04 owns)
- **KHONG cham** existing `apps/agencyos-web/app/dashboard/agents/` (existing route)
- **KHONG cham** existing `apps/agencyos-web/app/dashboard/missions/` (existing route)
- Tat ca files la NEW — zero conflict risk

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| RaaS registry API chua deploy | Use mock data cho development, feature flag toggle |
| agencyos-web build broken tu existing code | Run build check truoc khi add new routes |
| shadcn components khong compatible | agencyos-web da dung shadcn — check existing components.json |
| Marketplace data empty (no agents registered) | Seed 5-10 default agents tu AGENT_REGISTRY |

## Security Considerations
- READ-ONLY v1: khong co write operations (no CSRF risk)
- API calls tu server component (secrets khong expose client)
- Registry data la public (agent definitions, khong co user data)
- Rate limit tren RaaS API da co (tu existing gateway)
