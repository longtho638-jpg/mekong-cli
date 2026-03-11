# Engineering: Deployment Configuration Review — Mekong CLI v5.0

## Command: /deploy
## Date: 2026-03-11

---

## Source: mekong/infra/

```
mekong/infra/
├── architecture.yaml       — 4-layer architecture definition
├── scaffold.sh             — Infrastructure scaffolding script
└── templates/
    ├── cf-pages/           — Cloudflare Pages template
    ├── cf-workers/         — Cloudflare Workers template
    ├── vercel-app/         — Vercel SSR app template
    └── fly-backend/        — Fly.io backend template
```

---

## architecture.yaml Analysis

4-layer platform stack defined:

| Layer | Platform | Cost | Deploy Method |
|-------|----------|------|---------------|
| frontend | Cloudflare Pages | Free | git push → auto build |
| edge-api | Cloudflare Workers | Free (100K req/day) | wrangler deploy |
| app | Vercel or CF Pages SSR | Free hobby | git push → auto deploy |
| backend | Fly.io | Free (3 VMs) | fly deploy |

Scale tiers defined: solo, startup, growth, scale
- solo: frontend only ($0)
- startup: frontend + edge-api ($0)
- growth: frontend + edge-api + app ($0)
- scale: all 4 layers ($0-20/mo)

---

## scaffold.sh Analysis (50 lines reviewed)

Script uses `set -euo pipefail` — good error handling.
Template variable: `{{PROJECT_NAME}}` replaced via `sed -i ''`.

**Issue 1: macOS-specific sed**
```bash
sed -i '' "s/{{PROJECT_NAME}}/$PROJECT/g" ...
```
`sed -i ''` is macOS-only. GNU/Linux `sed -i` (no empty string) differs.
CI runs on ubuntu-latest — this script will fail in CI if called there.
Fix: use `sed -i.bak "s/.../.../g" file && rm file.bak` for portability.

**Issue 2: No staging environment**
architecture.yaml defines production layers only. No staging/preview environment configuration.
Mekong CLI deploys to production via `git push` with no staging gate.
Recommendation: Add `staging` scale tier with separate domains/KV namespaces.

**Issue 3: Cloudflare Workers CPU limit**
architecture.yaml documents "10ms CPU/req" limit for CF Workers.
FastAPI Python backend cannot run on CF Workers (Python runtime unavailable on Workers standard).
Edge-api layer is appropriate for lightweight JS/WASM only.
The actual Python API runs on Fly.io backend, not CF Workers.

---

## CI Deploy Workflows Found

From `.github/workflows/`:
- `deploy-cloudflare.yml` — CF Pages/Workers deployment
- `deploy-landing.yml` — Landing page deployment
- `ci-deploy.yml` (in infra/templates/) — Template CI/CD config

### ci.yml Deploy Jobs
Main `ci.yml` (149 lines) runs:
1. Backend (Python) — lint + test
2. AGI Benchmarks — benchmark suite
No explicit deploy job in ci.yml — deployment triggered separately.

---

## Missing Staging Infrastructure

### Current State
- Production: agencyos.network + Fly.io backend
- Staging: not defined in architecture.yaml or scaffold.sh
- Preview: Vercel PR previews (if Vercel is used)

### Impact
- Every merge to main deploys directly to production
- No smoke test on staging before production promotion
- Risk: breaking changes reach production without buffer

---

## Fly.io Backend Configuration
- Free tier: 3 shared VMs, 256MB RAM each, 3GB volume
- Python FastAPI gateway runs here
- `fly deploy` is the deploy command
- No `fly.toml` reviewed but template exists at `templates/fly-backend/`

---

## Deployment Security Observations
- BANNED: `vercel --prod`, `vercel deploy` (per CLAUDE.md)
- Only `git push` triggers deploys — good GitOps practice
- Secrets managed via Fly.io secrets / CF environment variables
- No `.env` files committed — confirmed by gitignore patterns

---

## Recommendations

1. **Fix sed portability:** Replace macOS-specific `sed -i ''` with portable alternative
2. **Add staging tier:** Define staging scale in architecture.yaml with separate domain/namespace
3. **Add staging gate in CI:** Require staging smoke test before production promotion
4. **Clarify CF Workers limitation:** Document Python-incompatibility explicitly in architecture.yaml
5. **Add health check post-deploy:** After fly deploy, curl /health and fail CI if non-200
6. **Document rollback procedure:** scaffold.sh has no rollback; add `fly releases` + `fly deploy --image` example

---

## Summary
4-layer infra is well-conceived and $0-cost at startup scale.
Critical gaps: no staging environment (merges go straight to prod),
macOS-only sed in scaffold.sh breaks Linux CI, and CF Workers layer
cannot run the Python FastAPI backend it's positioned to host.
