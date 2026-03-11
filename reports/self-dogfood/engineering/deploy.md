# Deployment Status Report
Generated: 2026-03-11

## Summary
Mekong CLI v5.0.0 — multi-target deployment across 4 infrastructure layers.

---

## Layer 1: RaaS Gateway — Fly.io (Primary Backend)

**File:** `fly.toml`
**App:** `agencyos-gateway`
**Region:** `sin` (Singapore)

### Config
```toml
[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1

[mounts]
  source = "agencyos_data"
  destination = "/data"   # SQLite + tenant DB
```

### Env Vars Set on Fly
| Var | Value |
|-----|-------|
| `API_HOST` | `0.0.0.0` |
| `API_PORT` | `8000` |
| `LOG_LEVEL` | `INFO` |
| `OLLAMA_URL` | `http://localhost:11434` |
| `DATABASE_URL` | `/data/tenants.db` |
| `ALLOW_OPUS_TIERS` | `growth,premium` |

### Status
- Dockerfile present at root
- `force_https = true` — SSL enforced
- Persistent volume for SQLite (`/data`)
- Auto-stop/start for cost savings (shared CPU)

---

## Layer 2: Edge Gateway — Cloudflare Workers

**Project:** `apps/raas-gateway`
**Deploy command:** `wrangler deploy`

### Secrets Required
```bash
wrangler secret put OPENCLAW_URL
wrangler secret put SERVICE_TOKEN
```

### Role
- Edge auth + rate limiting before requests reach Fly.io backend
- KV-based quota enforcement

---

## Layer 3: Landing Page — Vercel

**Project:** `apps/agencyos-landing`
**Framework:** Next.js
**Trigger:** Push to `main`

### Security Headers (vercel.json)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Env Vars Required
- `NEXT_PUBLIC_POLAR_PUBLISHABLE_KEY` (payment)
- `POLAR_SECRET_KEY`

---

## Layer 4: SaaS Dashboard — Undeployed

**Project:** `apps/saas-dashboard`
**Framework:** Next.js 15 (new, untracked in git)
**Status:** Local dev only — no Vercel project configured yet

---

## Python CLI — PyPI

**Package:** `mekong-cli`
**Version:** 5.0.0 (pyproject.toml) — was 3.0.0 in VERSION file (fixed)
**Install:** `pip install mekong-cli`

---

## Deploy Flow (All Layers)

```
git push origin main
  → GitHub Actions CI
  → Vercel auto-deploys landing
  → Fly.io: manual `fly deploy` or CI step
  → CF Workers: manual `wrangler deploy`
```

## Gaps / Risks
- VERSION mismatch fixed (3.0.0 → 5.0.0)
- `apps/saas-dashboard/` not yet deployed
- Fly.io CI deploy step not confirmed in GitHub Actions
- CF Workers deploy not automated in CI
- No healthcheck endpoint verified in production
