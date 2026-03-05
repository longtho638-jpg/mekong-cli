# 🚀 Production Deployment Optimization Plan

> **Score: 4 → 10** - Reliability, Monitoring, Rollback Strategies
> Ref: `.github/workflows/ci.yml`, `algo-trader-deploy.yml`

---

## Current State (Score: 4/10)

### ✅ What Works
- GitHub Actions CI/CD configured
- Docker build & push to GCP Artifact Registry
- Cloud Run deployment automated
- Basic health check post-deploy

### ❌ Gaps (4→10)
| Gap | Impact | Priority |
|-----|--------|----------|
| No automated rollback | Downtime if deploy fails | 🔴 Critical |
| No canary/blue-green | Risky deployments | 🔴 Critical |
| Limited health checks | False positives | 🟡 High |
| No Slack notifications | Slow incident response | 🟡 High |
| No deployment metrics | Can't measure MTTR | 🟡 High |
| No manual approval gate | Accidental prod deploys | 🟢 Medium |

---

## Target State (Score: 10/10)

### 1. Automated Rollback Strategy

```yaml
rollback:
  name: Auto-Rollback on Failure
  runs-on: ubuntu-latest
  if: failure()
  steps:
    - name: Get Previous Revision
      run: |
        PREV_REV=$(gcloud run services describe $SERVICE \
          --region $REGION --format 'value(status.observedGeneration)')
        echo "PREV_REV=$PREV_REV" >> $GITHUB_ENV

    - name: Rollback
      run: |
        gcloud run services update-traffic $SERVICE \
          --to-revisions=previous=100 \
          --region $REGION
```

### 2. Canary Deployment (10% → 50% → 100%)

```yaml
canary-steps:
  - 10% traffic, 5 min wait
  - If error rate < 1% → 50%
  - If error rate < 1% → 100%
  - Else → Auto-rollback
```

### 3. Enhanced Health Checks

```yaml
health-checks:
  - /health (liveness)
  - /ready (readiness)
  - /health/deep (database, APIs)
  - Synthetic transactions (e2e smoke test)
```

### 4. Slack Notifications

```yaml
notify:
  on_failure: |
    🚨 Deploy FAILED: {{service}}
    Commit: {{sha}} | Author: {{author}}
    Error: {{error}}
    Rollback: {{rollback_status}}

  on_success: |
    ✅ Deploy SUCCESS: {{service}}
    URL: {{url}} | Duration: {{duration}}
```

### 5. Deployment Metrics (Cloud Monitoring)

```yaml
metrics:
  - Deployment frequency
  - MTTR (Mean Time To Recovery)
  - Change failure rate
  - Lead time for changes
```

---

## Implementation Phases

### Phase 1: Auto-Rollback (Critical)
- [ ] Add rollback step on failure
- [ ] Store previous stable revision
- [ ] Test rollback in staging first

### Phase 2: Enhanced Health (Critical)
- [ ] Add /ready endpoint
- [ ] Add /health/deep with DB check
- [ ] Add smoke test API calls

### Phase 3: Notifications (High)
- [ ] Slack webhook integration
- [ ] PagerDuty for critical failures
- [ ] Email digest for stakeholders

### Phase 4: Canary (High)
- [ ] 10% → 50% → 100% traffic shifting
- [ ] Error rate monitoring per step
- [ ] Auto-abort on threshold breach

### Phase 5: Metrics & Dashboard (Medium)
- [ ] Cloud Monitoring dashboard
- [ ] DORA metrics tracking
- [ ] Weekly deployment report

---

## Quick Wins (Do Today)

1. **Add manual approval for prod**:
```yaml
environment:
  name: production
  url: https://algo-trader.run.app
```

2. **Add timeout to prevent hanging**:
```yaml
timeout-minutes: 30
```

3. **Add concurrency control**:
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

---

## Rollback Runbook

```bash
# Manual rollback (if auto fails)
gcloud run services update-traffic algo-trader \
  --to-revisions=previous=100 \
  --region us-central1

# Verify rollback
gcloud run services describe algo-trader \
  --region us-central1 \
  --format 'value(status.traffic[0].revisionName)'
```

---

## Verification Checklist

After each deploy:
- [ ] Health check passes (HTTP 200)
- [ ] Error rate < 1% (5 min window)
- [ ] Latency p99 < 500ms
- [ ] No increase in 5xx errors
- [ ] Synthetic transactions pass

---

_Next: Implement Phase 1 (Auto-Rollback) in `algo-trader-deploy.yml`_
