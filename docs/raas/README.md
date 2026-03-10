# RaaS Platform — Genesis 1M Monorepo

> **DOANH TRẠI ĐÃ SẴN SÀNG** — Full-stack RaaS platform scaffold

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS, Shadcn UI |
| Backend | FastAPI, Python 3.11+, Pydantic v2 |
| Database | PostgreSQL 16, Prisma ORM |
| Agents | Shared `packages/openclaw-agents` SDK |
| Container | Docker + docker-compose |

## Quick Start

### Development (Local)

```bash
# Install dependencies
pnpm install

# Start frontend only (port 3000)
pnpm dev:web

# Start backend only (port 8000) - requires Python 3.11+
pnpm dev:api

# Start both with turbo
pnpm dev
```

### Docker (Full Stack)

```bash
# Start all services (db + api + web)
docker-compose -f docker-compose.raas.yml up

# Access:
# - Frontend: http://localhost:3001
# - Backend: http://localhost:8001/health
# - PostgreSQL: localhost:5433
```

## Project Structure

```
mekong-cli/
├── apps/
│   ├── web/                      # Next.js 14 frontend (:3000)
│   │   ├── src/app/              # App Router
│   │   ├── components/ui/        # Shadcn components
│   │   └── lib/                  # Utilities
│   └── api/                      # FastAPI backend (:8000)
│       ├── app/
│       │   └── main.py           # FastAPI app + /health
│       └── prisma/
│           └── schema.prisma     # Database schema
├── packages/
│   └── openclaw-agents/          # Shared agent SDK
│       └── src/index.ts
├── docker-compose.raas.yml       # RaaS services
├── turbo.json                    # Turborepo config
└── pnpm-workspace.yaml           # Workspace config
```

## Verification

```bash
# Frontend build
cd apps/web && pnpm build

# Backend health check
curl http://localhost:8000/health
# Expected: {"status":"ok","message":"RaaS API is running"}

# Docker full stack
docker-compose -f docker-compose.raas.yml up
# Frontend: http://localhost:3001
# Backend: http://localhost:8001
```

## Success Criteria

- ✅ `pnpm install` → all workspaces installed
- ✅ `pnpm dev:web` → frontend :3000 running
- ✅ `pnpm dev:api` → backend :8000 /health OK
- ✅ Landing page renders with Shadcn Button
- ✅ Prisma schema defined (User model)
- ✅ Docker compose up → all services running

## Next Steps

1. **Authentication** — Supabase Auth or Better Auth
2. **Dashboard** — `/dashboard` route with user management
3. **Agent Integration** — Wire `openclaw-agents` into frontend
4. **CI/CD** — GitHub Actions for build + deploy
5. **Production Deploy** — Vercel (frontend) + Railway/Fly.io (backend)

---

**Genesis Date:** 2026-02-17
**Status:** Phase 1 Complete ✅
