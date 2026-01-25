# Task 01: Frontend Dashboard Polish

**Status:** Ready to Execute
**Priority:** High
**Estimated Time:** 10-15 minutes
**Dependencies:** None
**Terminal:** #2

---

## 🎯 Objective

Verify all 3 frontend apps (Dashboard, Docs, Web) build without TypeScript errors or warnings. Ensure production bundles are optimized and ready for deployment.

---

## 📋 WIN-WIN-WIN Validation

### 👑 ANH (Owner) WINS:
- Clean builds = deployment confidence
- No TypeScript debt = maintainable codebase
- Optimized bundles = faster load times = better UX

### 🏢 AGENCY WINS:
- Proven build pipeline = scalable CI/CD
- Type safety = fewer runtime bugs
- Bundle analysis = cost optimization (CDN bandwidth)

### 🚀 CLIENT/STARTUP WINS:
- Fast, reliable dashboards
- Professional polish
- Mobile-responsive interfaces

✅ **All 3 parties WIN** → Proceed

---

## ⚡ Execution Commands

```bash
cd /Users/macbookprom1/mekong-cli

# Install dependencies (idempotent)
pnpm install

# Build Dashboard (Material Design 3, Next.js 15)
echo "=== Building Dashboard ==="
cd apps/dashboard
pnpm build
cd ../..

# Build Docs (Astro)
echo "=== Building Docs ==="
cd apps/docs
pnpm build
cd ../..

# Build Web (Landing Page)
echo "=== Building Web ==="
cd apps/web
pnpm build
cd ../..

# Verify output directories
echo ""
echo "=== Verifying Build Outputs ==="
ls -lh apps/dashboard/.next/static/chunks/ | head -n 5
ls -lh apps/docs/dist/ | head -n 5
ls -lh apps/web/.next/static/chunks/ | head -n 5

echo ""
echo "✅ All frontend builds complete. Review above for errors."
```

---

## ✅ Success Criteria

- [ ] Dashboard builds without TypeScript errors
- [ ] Docs builds without errors (Astro static site)
- [ ] Web builds without errors (Next.js landing page)
- [ ] Output directories exist:
  - `apps/dashboard/.next/`
  - `apps/docs/dist/`
  - `apps/web/.next/`
- [ ] No "Module not found" errors
- [ ] No ESLint violations (critical level)

---

## 🔧 Failure Recovery

### TypeScript Errors
```bash
cd apps/dashboard
pnpm tsc --noEmit  # Type-check only, no build
```

### Missing Dependencies
```bash
cd apps/dashboard
pnpm install --force
```

### Cache Issues
```bash
rm -rf apps/dashboard/.next
rm -rf apps/docs/dist
rm -rf apps/web/.next
pnpm build  # Rebuild from scratch
```

### Node Version Mismatch
```bash
node -v  # Should be v18 or v20
# If wrong version, use nvm:
nvm use 20
```

---

## 📊 Post-Task Validation

Run this after build completes:

```bash
# Check bundle sizes (should be <500KB for main chunks)
du -sh apps/dashboard/.next/static/chunks/*.js | sort -h

# Check for source maps (should exist in production build)
ls -la apps/dashboard/.next/static/chunks/*.js.map | wc -l
```

**Expected Output:**
- Main chunk: ~300-400KB (gzipped: ~100KB)
- At least 10+ `.js.map` files for debugging

---

## 🚀 Next Steps After Success

1. Commit build artifacts (if needed): `git add apps/*/package.json`
2. Tag for deployment: `git tag -a v5.1.1-build-$(date +%Y%m%d) -m "Frontend builds validated"`
3. Proceed to Task 02: Backend API Health

---

**Report:** `echo "TASK 01 COMPLETE" >> /tmp/binh-phap-execution.log`
