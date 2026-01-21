---
description: Ship code to production - test, commit, push, deploy
---

# 🚀 Ship Command

One command to test, commit, push, and deploy.

## Usage

```bash
/ship "commit message"
```

## Steps

### Step 0: Pre-Flight Tech Debt Check

// turbo

```bash
cd /Users/macbookprom1/mekong-cli
echo "🔍 Pre-flight CI/CD check..."
gh run list --limit 1 --json conclusion --jq '.[0].conclusion' | grep -q "success" && echo "✅ GitHub CI: GREEN" || echo "⚠️ GitHub CI: Check /debugger"
python3 -m ruff check . --quiet 2>/dev/null && echo "✅ Ruff: 0 errors" || echo "⚠️ Run: ruff check . --fix"
```

### Step 0.5: Security Armor (--armor flag)

// turbo

```bash
# Use MCP tool: security/run_security_gates
mekong check --dry-run
```

### Step 1: Run Validation

// turbo

```bash
cd /Users/macbookprom1/mekong-cli
python3 -m ruff check . --fix
pnpm --filter mekong-docs build
python3 -m pytest backend/tests -q --tb=no
```

### Step 2: Stage & Commit

```bash
git add -A
git commit -m "$ARGUMENTS"
```

### Step 3: Push (triggers Husky pre-push)

```bash
git push origin main
```

### Step 4: Force Vercel Deploy (if needed)

// turbo

```bash
cd /Users/macbookprom1/mekong-cli/apps/docs
vercel deploy --prod --yes
```

### Step 5: Verify Live

// turbo

```bash
curl -s https://www.agencyos.network | head -20
echo "✅ SHIPPED!"
```

## Quick Verify

```bash
gh run list --limit 1
vercel ls --limit 1
```
