# 🏯 CI/CD Infrastructure Strategic Plan
> **Binh Pháp Analysis - Deploy Workflow Unification**

**Date:** 2026-01-28
**Status:** 🔴 CRITICAL - Production Deploy FAILED
**Analyst:** binh-phap-strategist (Antigravity IDE)

---

## 📋 EXECUTIVE SUMMARY

**ISSUE:** Dual deployment workflows causing confusion and failures
- `.github/workflows/deploy.yml` → GCP Cloud Run (missing secrets)
- `.github/workflows/deploy-production.yml` → Vercel (working)

**ROOT CAUSE:** Architecture drift - Backend evolved to GCP, Frontend to Vercel, but workflows not unified.

**RECOMMENDATION:** **HYBRID STRATEGY** - Specialized deployment per component type.

---

## CHƯƠNG 1: KẾ HOẠCH (Strategic Assessment)

### Ngũ Sự Analysis (5 Factors)

| Factor | Current State | Ideal State | Gap |
|--------|---------------|-------------|-----|
| **Đạo (Mission)** | Mixed signals (GCP vs Vercel) | Clear deployment strategy | HIGH |
| **Thiên (Timing)** | CI failing on every push | Pass 100% on main | CRITICAL |
| **Địa (Position)** | Backend=Python, Frontend=Next.js | Backend=GCP, Frontend=Vercel | MEDIUM |
| **Tướng (Leadership)** | Two competing workflows | Single source of truth | HIGH |
| **Pháp (Method)** | Manual secret management | Automated, documented | HIGH |

### WIN-WIN-WIN Validation

```
┌───────────────────────────────────────────────────┐
│  👑 ANH (Owner) WIN gì?                           │
│  → CI passes, deploys work, sleep better         │
│                                                   │
│  🏢 AGENCY WIN gì?                                │
│  → Reliable infrastructure, less toil             │
│                                                   │
│  🚀 STARTUP/CLIENT WIN gì?                        │
│  → Fast deployments, zero downtime               │
│                                                   │
│  ✅ ALL 3 WIN → PROCEED                          │
└───────────────────────────────────────────────────┘
```

---

## CHƯƠNG 2: TÁC CHIẾN (Execution Plan)

### CURRENT ARCHITECTURE DISCOVERY

#### Backend (Python FastAPI)
- **Location:** `/backend`
- **Runtime:** Python 3.11 + FastAPI + SQLAlchemy
- **Target Platform:** GCP Cloud Run (asia-southeast1)
- **Evidence:**
  - `cloudbuild.yaml` exists (uses `gcr.io/$PROJECT_ID/agencyos-api`)
  - `backend/app.yaml` exists (Cloud Run config)
  - Port: 8080 (cloudbuild) vs 8000 (deploy.yml) ❌ **CONFLICT**

#### Frontend (Next.js Monorepo)
- **Location:** `/apps/dashboard`, `/apps/docs`, `/apps/web`, `/apps/landing`
- **Runtime:** Node 20 + pnpm + Turborepo
- **Target Platform:** Vercel
- **Evidence:**
  - Multiple `vercel.json` files in each app
  - `deploy-production.yml` uses Vercel CLI
  - Root `vercel.json` has `deploymentEnabled.main: false` (manual control)

### SECRETS INVENTORY

#### Missing Secrets (GCP Deployment)
```bash
# Required for deploy.yml
GCP_SA_KEY          # Service Account JSON key
GCP_PROJECT_ID      # GCP Project ID (e.g., agencyos-production)
VERCEL_DEPLOY_HOOK  # Webhook URL for Vercel trigger
```

#### Existing Secrets (Vercel Deployment)
```bash
# Already configured in deploy-production.yml
VERCEL_ORG_ID
VERCEL_PROJECT_ID
VERCEL_TOKEN
SLACK_WEBHOOK_URL (optional)
```

---

## CHƯƠNG 3: MƯU CÔNG (Win-Without-Fighting)

### RECOMMENDED STRATEGY: Hybrid Specialized Deployment

**Philosophy:** "Không đánh mà thắng" - Don't fight the platform strengths.

#### Backend → GCP Cloud Run
**Why GCP?**
- Python backend needs persistent instances for background jobs
- Cloud Run auto-scales with CPU/memory control
- `cloudbuild.yaml` and `app.yaml` already exist
- Asia region proximity (asia-southeast1)

#### Frontend → Vercel
**Why Vercel?**
- Next.js is Vercel's native platform
- Edge network for global CDN
- Preview deployments for PRs
- Zero-config TypeScript/React builds

#### Decision Matrix

| Component | Platform | Reason | Alternatives Rejected |
|-----------|----------|--------|----------------------|
| Backend API | GCP Cloud Run | Python + Background Jobs | App Engine (more expensive), Vercel Functions (cold starts) |
| Dashboard UI | Vercel | Next.js Edge Optimization | GCP Cloud Run (overkill for static), Netlify (less Next.js support) |
| Docs Site | Vercel | Astro SSG + MDX | GitHub Pages (no preview), Cloudflare Pages (less integration) |
| Landing Page | Vercel | Marketing site with A/B testing | Same as above |

---

## CHƯƠNG 4: HÌNH THẾ (Infrastructure Positioning)

### Proposed Workflow Architecture

```
GitHub Push → Main Branch
       ↓
   [deploy-unified.yml]
       ↓
   ┌─────────────────────────────────┐
   │  Job 1: Validate               │
   │  - Typecheck (Turborepo)       │
   │  - Lint (ESLint + Ruff)        │
   │  - Test (Vitest + Pytest)      │
   └─────────────────────────────────┘
       ↓
   ┌──────────────────────┬──────────────────────┐
   │                      │                      │
[Job 2a: Backend]    [Job 2b: Frontend]
   │                      │
GCP Cloud Run        Vercel Edge
   │                      │
   ├─ Build Docker       ├─ Build Next.js apps
   ├─ Push to GCR        ├─ Deploy to Vercel
   └─ Deploy to asia-    └─ Publish to Edge
      southeast1
```

### Secrets Setup Commands

```bash
# GCP Backend Secrets
gh secret set GCP_PROJECT_ID --body "agencyos-production-12345"
gh secret set GCP_SA_KEY --body "$(cat ~/Downloads/agencyos-sa-key.json)"

# Vercel Frontend Secrets (already exist, verify)
gh secret list | grep VERCEL

# Optional: Notifications
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/..."
```

---

## CHƯƠNG 5: QUÂN TRANH (Speed Execution)

### Phase 1: Immediate Fix (30 minutes)

**Objective:** Make CI pass TODAY.

#### Option A: Disable GCP Deployment (Fast)
```yaml
# .github/workflows/deploy.yml
# Comment out lines 54-93 (deploy job)
# OR delete deploy.yml entirely
```

**Pros:** CI passes immediately
**Cons:** No backend deployment until secrets added

#### Option B: Add GCP Secrets (Recommended)
```bash
# 1. Create GCP Service Account
gcloud iam service-accounts create agencyos-deployer \
  --display-name="AgencyOS GitHub Deployer"

# 2. Grant permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:agencyos-deployer@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# 3. Generate key
gcloud iam service-accounts keys create sa-key.json \
  --iam-account=agencyos-deployer@PROJECT_ID.iam.gserviceaccount.com

# 4. Add to GitHub
gh secret set GCP_SA_KEY < sa-key.json
gh secret set GCP_PROJECT_ID --body "PROJECT_ID"
```

**Pros:** Full deployment works
**Cons:** Requires GCP access

### Phase 2: Workflow Unification (2 hours)

**Goal:** Single `deploy-production.yml` that handles both platforms.

```yaml
name: Deploy Production (Unified)

on:
  push:
    branches: [main]

jobs:
  validate:
    # ... existing validation steps ...

  deploy-backend:
    needs: validate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: agencyos-backend
          region: asia-southeast1
          image: gcr.io/${{ secrets.GCP_PROJECT_ID }}/agencyos-api:${{ github.sha }}

  deploy-frontend:
    needs: validate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Phase 3: Monitoring & Alerts (1 hour)

```bash
# Add deployment status checks
- name: Health Check Backend
  run: curl -f https://agencyos-backend-xxx.run.app/health || exit 1

- name: Health Check Frontend
  run: curl -f https://agencyos.network || exit 1
```

---

## CHƯƠNG 6: HƯ THỰC (Conflict Resolution)

### Port Conflict: 8080 vs 8000

**Problem:** `cloudbuild.yaml` uses port 8080, but `deploy.yml` uses 8000.

**Root Cause:** Backend FastAPI defaults to 8000, but Cloud Run expects 8080.

**Solution:**
```python
# backend/api/main.py
import os
PORT = int(os.getenv("PORT", 8000))  # Cloud Run sets $PORT automatically

if __name__ == "__main__":
    uvicorn.run("backend.api.main:app", host="0.0.0.0", port=PORT)
```

**Standardize to:** Port 8080 everywhere (Cloud Run standard).

### Workflow Duplication

**Problem:** Two workflows (`deploy.yml` + `deploy-production.yml`) create confusion.

**Solution:**
1. Rename `deploy-production.yml` → `deploy-unified.yml`
2. Delete `deploy.yml` (or archive to `.github/workflows/archive/`)
3. Update documentation to reference single workflow

---

## CHƯƠNG 7: CỬU BIẾN (Adaptation Strategy)

### Contingency Plans

| Scenario | Response |
|----------|----------|
| **GCP quota exceeded** | Temporarily disable backend deploy, manual deploy via `gcloud` |
| **Vercel outage** | Cloudflare Pages backup (requires setup) |
| **GitHub Actions down** | Manual deploy scripts in `/scripts/deploy-manual.sh` |
| **Secrets compromised** | Rotate immediately, force re-deploy |

---

## 📊 METRICS & SUCCESS CRITERIA

### Definition of Done

- [ ] All GitHub secrets configured
- [ ] CI passes on `main` branch push
- [ ] Backend deploys to GCP Cloud Run successfully
- [ ] Frontend deploys to Vercel successfully
- [ ] Health checks pass post-deployment
- [ ] Single source of truth workflow file
- [ ] Documentation updated in `docs/deployment.md`

### KPIs (Key Performance Indicators)

| Metric | Current | Target |
|--------|---------|--------|
| CI Pass Rate | 0% (failing) | 100% |
| Deploy Time | N/A | < 5 minutes |
| Manual Intervention | 100% | 0% |
| Rollback Time | N/A | < 1 minute |

---

## 🛠️ IMPLEMENTATION CHECKLIST

### Immediate (Today)

```bash
# 1. Verify GCP project exists
gcloud projects list | grep agencyos

# 2. Add secrets (if GCP access available)
# See Phase 1 Option B commands above

# 3. OR disable deploy.yml temporarily
git mv .github/workflows/deploy.yml .github/workflows/deploy.yml.disabled
git commit -m "fix(ci): temporarily disable GCP deploy until secrets added"
git push
```

### Short-term (This Week)

- [ ] Unify workflows into `deploy-unified.yml`
- [ ] Fix port conflict (standardize to 8080)
- [ ] Add health checks
- [ ] Document deployment process
- [ ] Test rollback procedure

### Long-term (Next Sprint)

- [ ] Add preview deployments for PRs
- [ ] Implement blue-green deployment
- [ ] Add performance monitoring
- [ ] Set up automated backups

---

## 🚨 RISK ASSESSMENT

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Missing GCP credentials | HIGH | HIGH | Use Vercel-only deployment for now |
| Port mismatch breaks health checks | MEDIUM | MEDIUM | Standardize to 8080, test locally |
| Workflow complexity increases | LOW | MEDIUM | Thorough documentation + runbooks |
| Vercel costs exceed free tier | MEDIUM | LOW | Monitor usage, set up billing alerts |

---

## 📚 DOCUMENTATION REQUIREMENTS

### Files to Update

1. **`docs/deployment.md`**
   - Remove references to dual workflows
   - Add GCP secret setup instructions
   - Add Vercel CLI usage examples

2. **`README.md`**
   - Update deployment section
   - Add CI/CD status badge

3. **`.env.example`**
   - Add `PORT=8080` for Cloud Run compatibility

4. **`backend/README.md`**
   - Document Cloud Run deployment process
   - Add troubleshooting section

---

## 🎯 NEXT STEPS

### For Anh (Owner)

1. **Decision Required:** Do you have GCP access to create service account?
   - **YES:** Proceed with Phase 1 Option B (Add GCP secrets)
   - **NO:** Proceed with Phase 1 Option A (Disable GCP deploy temporarily)

2. **Approve this plan** before execution begins.

3. **Provide:**
   - GCP Project ID (or confirm we should create new project)
   - Preferred GCP region (default: asia-southeast1)
   - Budget constraints for Cloud Run

### For Agent Execution

```bash
# After approval, execute:
/delegate "Implement CI/CD unification per .claude/plans/cicd-infrastructure-plan.md"

# Or manual execution:
1. Read this plan
2. Choose Phase 1 option (A or B)
3. Execute selected option
4. Commit and push changes
5. Verify CI passes
6. Report back with results
```

---

## 📖 REFERENCES

- [GCP Cloud Run Deployment](https://cloud.google.com/run/docs/deploying)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Binh Pháp Chapter 7: Quân Tranh](/.claude/rules/01-strategy/13-chapters/07-quan-tranh.md)

---

**Plan Created:** 2026-01-28
**Agent:** binh-phap-strategist
**Approval Required:** YES ✋
**Estimated Effort:** 3-5 hours (full implementation)

🏯 **"Thắng từ trong chuẩn bị"** - Victory is in the preparation.
