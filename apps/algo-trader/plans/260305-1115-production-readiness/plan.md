---
title: "Rừng Chiến Lược - Production Readiness (4→10)"
description: "Nâng production score từ 72→90+ qua 5 phases: monitoring, logging, tests, deployment, alerting"
status: pending
priority: P0
effort: 5 days
branch: master
tags: [production, monitoring, testing, deployment]
created: 2026-03-05
---

# Rừng Chiến Lược - Production Readiness Plan

**Target:** 72/100 → 90+/100 (Production Grade)

## Current State (72/100)

| Front | Score | Gap |
|-------|-------|-----|
| Test Coverage | 45% | → 70%+ |
| Logging | ⚠️ 78 console.log | → winston 100% |
| Monitoring | ❌ None | → Health checks |
| Deployment | ❌ Manual | → CI/CD validated |
| Alerting | ❌ None | → On-call ready |

---

## Phase 1: Monitoring & Health Checks (P0 - 1 day)

**Goal:** Visibility into system health

| Task | Files | Acceptance |
|------|-------|------------|
| Health check endpoints | `src/core/http-health-check-server.ts` | `/health`, `/ready`, `/live` endpoints |
| Heartbeat monitoring | `src/netdata/HealthManager.ts` | 5-min heartbeat to webhook |
| Error tracking | `src/core/error-tracking-service.ts` | NEW: Sentry-style service |

**Verification:** `curl localhost:3000/health` → 200 OK

**Rollback:** Disable health server in config

---

## Phase 2: Logging Standardization (P1 - 1 day)

**Goal:** Zero console.log in production

| Task | Files | Acceptance |
|------|-------|------------|
| Winston config | `src/utils/logger.ts` | JSON format, log levels |
| Replace console.log | 67 files using logger | grep `console\.` = 0 |
| Structured logging | All logs | JSON with context |

**Verification:** `grep -r "console\.(log|warn|error)" src --include="*.ts"` = 0

**Rollback:** Revert logger changes

---

## Phase 3: Test Coverage Critical Path (P1 - 2 days)

**Goal:** 45% → 70%+ coverage

| Module | Files | Tests | Owner |
|--------|-------|-------|-------|
| Core | SignalGenerator, StrategyEnsemble | 15 tests | tester |
| Auth | tenant-auth, rate-limiter | 10 tests | tester |
| Strategies | BaseStrategy, 5 strats | 10 tests | tester |
| Reporting | ConsoleReporter, HtmlReporter | 8 tests | tester |

**Verification:** `npm test --coverage` → 70%+ lines

**Rollback:** N/A (tests additive only)

---

## Phase 4: Deployment Validation (P2 - 0.5 day)

**Goal:** CI/CD smoke tests

| Task | Files | Acceptance |
|------|-------|------------|
| Smoke tests | `tests/smoke/` | 5 scenarios |
| Rollback automation | `.github/workflows/deploy.yml` | Auto-rollback on fail |
| Production health | Post-deploy hook | Auto-verify /health |

**Verification:** Push → CI/CD GREEN → Production 200

**Rollback:** GitHub Actions rollback job

---

## Phase 5: Alerting & On-Call (P2 - 0.5 day)

**Goal:** Alert on incidents

| Task | Files | Acceptance |
|------|-------|------------|
| Alert thresholds | `src/core/alert-rules-engine.ts` | CPU, error rate, latency |
| Notification channels | Telegram, email | 2 channels working |
| Runbook docs | `docs/runbooks/` | 5 runbooks |

**Verification:** Trigger alert → Telegram notification < 1 min

**Rollback:** Disable alerts in config

---

## Success Criteria

- [ ] Health checks: `/health`, `/ready`, `/live` all 200
- [ ] Logging: 0 console.log statements
- [ ] Tests: 70%+ coverage (currently 45%)
- [ ] Deployment: CI/CD auto-deploy + rollback
- [ ] Alerting: Telegram alerts working

## Dependencies

- Phase 1 must complete before Phase 5
- Phase 2 unblocks Phase 3 (cleaner test output)
- Phase 4 requires Phase 1 (health endpoints)

## Risks

| Risk | Mitigation |
|------|------------|
| Test coverage slow | Focus on critical path only |
| Logger migration breaks output | Keep backward compat |
| Alert spam | Threshold tuning first week |

---

## Unresolved Questions

1. Should we use Sentry.io or self-host error tracking?
2. What's the target RTO/RPO for this trading system?
3. Should alerts go to Telegram only or also email/SMS?
