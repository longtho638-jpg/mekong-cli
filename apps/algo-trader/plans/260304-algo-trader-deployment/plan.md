# Algo Trader Deployment Plan — 100/100 Binh Phap

**Date:** 2026-03-04
**Status:** In Progress
**Goal:** Deploy Algo Trader — fix tests, Dockerfile, health check, Binh Phap gates

---

## Quick Status

| Phase | Status | Owner |
|-------|--------|-------|
| 1. Fix Jest OOM | ⏳ Pending | fullstack-developer |
| 2. Health Endpoint | ⏳ Pending | backend-developer |
| 3. Binh Phap Gates | ⏳ Pending | code-reviewer |
| 4. Docker Build | ⏳ Pending | devops |
| 5. Final Verify | ⏳ Pending | tester |

---

## Phase 1: Fix Jest OOM (SIGKILL)

**Problem:** 3 test suites fail with SIGKILL (out of memory)

**Solution:**
1. Update `jest.config.js`:
   - `maxWorkers: 1` (giảm từ default)
   - `workerIdleMemoryLimit: 0.5`
2. Add test script flag: `--maxWorkers=1 --workerIdleMemoryLimit=500`

**Files to modify:**
- `jest.config.js`
- `package.json` (test script)

**Verification:**
```bash
npm test --maxWorkers=1  # All tests pass
```

---

## Phase 2: Health Endpoint

**Problem:** Dockerfile HEALTHCHECK cần `/health` endpoint

**Solution:**
1. Check if `src/api/routes/health.ts` exists
2. If not, create minimal health endpoint
3. Ensure server listens on port 3000

**Files to check:**
- `src/index.ts` (main server)
- `src/api/routes/` (routes folder)

**Verification:**
```bash
curl http://localhost:3000/health  # Returns 200 OK
```

---

## Phase 3: Binh Phap Quality Gates

**6 Fronts verification:**

```bash
# 1. Tech Debt — 0 TODO/FIXME
grep -r "TODO\|FIXME" src | wc -l  # = 0

# 2. Type Safety — 0 any types
grep -r ": any" src --include="*.ts" | wc -l  # = 0

# 3. Build — passes
npm run build  # exit 0

# 4. Tests — all pass
npm test  # 100% pass

# 5. Security — no secrets
grep -r "API_KEY\|SECRET" src --include="*.ts" | wc -l  # = 0

# 6. Console logs — removed
grep -r "console\." src --include="*.ts" | wc -l  # = 0
```

---

## Phase 4: Docker Build

**Build and verify:**

```bash
# Build image
docker build -t algo-trader:latest .

# Run container
docker run -d --name algo-test algo-trader:latest

# Check health
docker exec algo-test curl http://localhost:3000/health

# Cleanup
docker stop algo-test && docker rm algo-test
```

---

## Phase 5: Final Verification

**Report format:**

```
## Verification Report
- Build: ✅ exit code 0
- Tests: ✅ [N] tests passed
- Docker: ✅ build success
- Health: ✅ HTTP 200
- Binh Phap: ✅ 6/6 fronts
- Timestamp: [time]
```

---

## Dependencies

```
Phase 1 → Phase 5 (tests must pass)
Phase 2 → Phase 4 (health needed for Docker)
Phase 3 → Phase 5 (gates must pass)
Phase 4 → Phase 5 (Docker must build)
```
