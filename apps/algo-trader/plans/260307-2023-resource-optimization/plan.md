---
title: "Resource Optimization Plan - Algo Trader"
description: "Build caching, artifact cleanup, bundle reduction, disk monitoring"
status: pending
priority: P2
effort: 8h
branch: master
tags: [optimization, build, ci-cd, performance]
created: 2026-03-07
---

# Resource Optimization Plan - Algo Trader

## Overview

**Current State Analysis:**

| Component | Status | Issue |
|-----------|--------|-------|
| TypeScript Build | ❌ No caching | Full rebuild every time |
| Worker Build | ❌ No cache strategy | Re-compiles unchanged code |
| Dashboard Build | ❌ No code splitting | Single large bundle |
| CI/CD | ❌ No artifact cleanup | 7-day retention, no size limits |
| Disk Monitoring | ❌ None | No pre-build space checks |

**Targets:**
- Disk usage <80%
- Build time -30%
- Bundle size -20%

---

## Phase 1: Ephemeral Build Caching

**Priority:** P1 | **Effort:** 2h

### Tasks

- [ ] **1.1** Create Cloudflare KV namespace for build cache
  ```toml
  # wrangler.toml
  [[kv_namespaces]]
  binding = "BUILD_CACHE"
  id = "<namespace-id>"
  preview_id = "<preview-namespace-id>"
  ```

- [ ] **1.2** Create R2 bucket for large artifacts
  ```toml
  [[r2_buckets]]
  binding = "ARTIFACT_STORE"
  bucket_name = "algo-trader-artifacts"
  ```

- [ ] **1.3** Implement hash-based cache key strategy
  ```typescript
  // src/utils/build-cache.ts
  const cacheKey = hash([
    packageJson.version,
    gitSha,
    tsconfigHash,
    sourceFilesHash
  ]);
  ```

- [ ] **1.4** Update wrangler.toml with cache bindings
  - Add `[vars]` for cache configuration
  - Add environment-specific bindings

- [ ] **1.5** Integration script for build process
  ```bash
  # scripts/build-with-cache.sh
  CACHED=$(get-cache $CACHE_KEY)
  if [ -n "$CACHED" ]; then
    echo "Build cache HIT"
    restore-build "$CACHE_KEY"
  else
    npm run build
    save-cache "$CACHE_KEY" dist/
  fi
  ```

**Files to Create:**
- `src/utils/build-cache.ts`
- `scripts/build-with-cache.sh`

**Files to Modify:**
- `wrangler.toml`
- `dashboard/wrangler.toml`

---

## Phase 2: CI Artifact Cleanup

**Priority:** P1 | **Effort:** 2h

### Tasks

- [ ] **2.1** Add post-build cleanup step to CI
  ```yaml
  - name: Cleanup old artifacts
    run: |
      find dist -type f -mtime +7 -delete
      find dashboard/dist -type f -mtime +7 -delete
  ```

- [ ] **2.2** Implement cache retention policy
  ```bash
  # scripts/cleanup-cache.sh
  find ~/.cache -type d -name "algo-trader-*" -mtime +7 -exec rm -rf {} \;
  ```

- [ ] **2.3** Add Vercel cleanup hooks
  ```javascript
  // scripts/vercel-cleanup.js
  // Remove old deployments via Vercel API
  ```

- [ ] **2.4** Update GitHub Actions retention
  ```yaml
  - uses: actions/upload-artifact@v4
    with:
      retention-days: 3  # Reduce from 7
      if-no-files-found: error
  ```

- [ ] **2.5** Add disk space report after build
  ```yaml
  - name: Disk usage report
    run: |
      echo "=== Disk Usage ==="
      df -h .
      du -sh dist/ dashboard/dist/
  ```

**Files to Create:**
- `scripts/cleanup-cache.sh`
- `scripts/vercel-cleanup.js`

**Files to Modify:**
- `.github/workflows/ci-cd.yml`

---

## Phase 3: Bundle Size Reduction

**Priority:** P2 | **Effort:** 3h

### Tasks

- [ ] **3.1** Configure Vite manualChunks
  ```typescript
  // dashboard/vite.config.ts
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-core': ['react', 'react-dom'],
          'vendor-trading': ['ccxt', 'technicalindicators'],
          'vendor-ui': ['@radix-ui', 'class-variance-authority'],
          'vendor-viz': ['recharts', 'framer-motion']
        }
      }
    }
  }
  ```

- [ ] **3.2** Enable tree-shaking optimization
  ```typescript
  // vite.config.ts
  build: {
    target: 'esnext',
    cssMinify: true,
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false
      }
    }
  }
  ```

- [ ] **3.3** Implement code splitting for dashboard routes
  ```typescript
  // dashboard/src/App.tsx
  const TradingView = lazy(() => import('./pages/TradingView'));
  const ArbitrageView = lazy(() => import('./pages/Arbitrage'));
  ```

- [ ] **3.4** Add bundle analysis to build
  ```bash
  # package.json
  "analyze": "vite-bundle-visualizer"
  ```

- [ ] **3.5** Add bundle size check to CI
  ```yaml
  - name: Bundle size check
    run: |
      npm run dashboard:build
      npx bundlewatch --config .bundlewatch.config.js
  ```

**Files to Create:**
- `.bundlewatch.config.js`

**Files to Modify:**
- `dashboard/vite.config.ts`
- `package.json`
- `dashboard/src/App.tsx`

---

## Phase 4: Real-time Disk Monitoring

**Priority:** P2 | **Effort:** 1h | **Status:** COMPLETED

### Tasks

- [x] **4.1** Create disk monitoring script
- [x] **4.2** Add pre-build space check
- [x] **4.3** Integrate with build scripts
- [x] **4.4** Add logging/alerting
- [x] **4.5** Add GitHub Actions disk check

**Files Created:**
- `scripts/disk-monitor.ts` - TypeScript disk monitoring script
- `scripts/pre-build-check.sh` - Bash pre-build check
- `src/utils/disk-logger.ts` - Winston logger for telemetry

**Files Modified:**
- `package.json` - Added disk:check scripts, prebuild hook
- `.github/workflows/ci-cd.yml` - Added disk space check step

---

## Success Criteria

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Disk Usage | Unknown | <80% | `df -h /` |
| Build Time (full) | ~60s | <42s (-30%) | `time npm run build` |
| Build Time (cached) | N/A | <10s | `time npm run build:fast` |
| Dashboard Bundle | Unknown | -20% | `du -sh dashboard/dist/` |
| CI Artifact Size | Unknown | <100MB | Artifact upload size |

---

## RaaS Gateway v2.0.0 Compatibility

**Notes:**

1. **KV/R2 bindings** must match RaaS Gateway secrets structure
2. **Cache invalidation** should trigger on `RAAS_VERSION` change
3. **Disk monitoring** alerts should route to RaaS telemetry
4. **Bundle splitting** must preserve RaaS auth middleware routes

**Integration Points:**

```typescript
// RaaS-aware cache key
const cacheKey = hash([
  process.env.RAAS_VERSION,
  process.env.BUILD_ENV,
  sourceHash
]);
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cache corruption | Medium | Add cache version prefix, TTL |
| R2 costs | Low | Set bucket lifecycle policies |
| Bundle split breaking imports | Medium | Test all routes after split |
| Disk monitor false positives | Low | Set threshold at 500MB, not 1GB |

---

## Dependencies

- Cloudflare account with KV/R2 enabled
- Node.js 20+ for disk monitoring scripts
- Vite 5+ for advanced code splitting

---

## Next Steps

1. Start with Phase 4 (disk monitoring) — quick win, protects against build failures
2. Phase 1 (caching) — highest impact on dev experience
3. Phase 2 (cleanup) — prevents CI storage bloat
4. Phase 3 (bundle) — requires most testing, do last

---

## Unresolved Questions

1. What is the current disk usage pattern on CI runners?
2. Are there existing Cloudflare KV/R2 namespaces to reuse?
3. What is the current dashboard bundle size?
