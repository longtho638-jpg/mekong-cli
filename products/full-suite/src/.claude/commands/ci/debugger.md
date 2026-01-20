---
description: CI/CD debugger - diagnose Vercel, GitHub, and Supabase issues
---

# /debugger - Full-Stack Pipeline Debugger

Master command for diagnosing Vercel + GitHub + Supabase issues.

## Usage

```bash
/debugger           # Full diagnostic
/debugger --quick   # Status only
/debugger --fix     # Auto-fix common issues
```

## Steps

### Step 1: GitHub Actions Status

// turbo

```bash
cd /Users/macbookprom1/mekong-cli
gh run list --limit 5
```

### Step 2: Vercel Deployment Status

// turbo

```bash
vercel ls --limit 5 2>/dev/null || echo "⚠️ Vercel not linked"
```

### Step 3: Supabase Health Check

// turbo

```bash
cd /Users/macbookprom1/mekong-cli
echo "🗄️ Supabase:"
grep -q "SUPABASE_URL" .env 2>/dev/null && echo "✅ SUPABASE_URL configured" || echo "❌ Missing SUPABASE_URL"
supabase projects list 2>/dev/null | head -3 || echo "⚠️ Supabase CLI not logged in"
```

### Step 4: Tech Debt Scan

// turbo

```bash
cd /Users/macbookprom1/mekong-cli
echo "🔍 Ruff (Python):"
python3 -m ruff check . --statistics 2>/dev/null | tail -5 || echo "✅ No Python errors"
echo ""
echo "🔍 TypeScript:"
pnpm --filter mekong-docs exec tsc --noEmit 2>&1 | tail -5 || echo "✅ No TS errors"
```

### Step 5: Quick Fixes (if --fix)

```bash
# Auto-fix Python lint
python3 -m ruff check . --fix

# Clear TS cache
rm -f apps/dashboard/tsconfig.tsbuildinfo
rm -f apps/docs/tsconfig.tsbuildinfo

# Rebuild
pnpm --filter mekong-docs build
```

### Step 6: Summary Report

Generate a status dashboard:

```
┌─────────────────────────────────────────┐
│  🏯 Full-Stack Health Dashboard         │
├─────────────────────────────────────────┤
│  GitHub CI:    ✅ GREEN / ❌ RED        │
│  Vercel:       ✅ SYNCED / ⚠️ STALE     │
│  Supabase:     ✅ LINKED / ❌ UNLINKED  │
│  Python Lint:  ✅ 0 errors              │
│  TypeScript:   ✅ 0 errors              │
└─────────────────────────────────────────┘
```

## Emergency Recovery

If CI is critically broken:

```bash
# 1. Selective build (bypass dashboard)
pnpm --filter mekong-docs build

# 2. Manual Vercel push
cd apps/docs && vercel deploy --prod --yes

# 3. Re-link Supabase
supabase link --project-ref jcbahdioqoepvoliplqy

# 4. Verify
curl -s https://agencyos.network | head -5
```
