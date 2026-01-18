---
description: Ship code - test, commit, push, deploy in one command
---

// turbo-all

# 🏯 /ship [message] - Full Ship Pipeline

One command: Test → Lint → Commit → Push → CI → Deploy

## Arguments

- `$MESSAGE` - Commit message (optional, auto-generated if empty)

## What Runs (Silently)

### 1. Lint Check

```bash
python3 -m ruff check . --fix
```

### 2. Run Tests

```bash
PYTHONPATH=. python3 -m pytest tests/ -q --tb=short
```

### 3. Run Integration Tests

```bash
PYTHONPATH=. python3 tests/test_wow.py
```

### 4. Stage All Changes

```bash
git add -A
```

### 5. Create Commit

```bash
git commit -m "🏯 $MESSAGE"
```

### 6. Push to Remote

```bash
git push origin main
```

### 7. Wait for CI

```bash
# Monitor GitHub Actions
gh run list --limit 1 --json status,conclusion
```

### 8. Deploy (if CI passes)

```bash
# Vercel auto-deploys on push
# Or manual: vercel deploy --prod
echo "Deployment triggered via Vercel"
```

## Output Format

```
✅ Lint: Passed
✅ Tests: {passed}/{total} passed
✅ Commit: {sha}
✅ Push: origin/main
⏳ CI: Running...
✅ CI: Passed
✅ Deploy: https://{project}.vercel.app

🚀 Ship complete!
```

---

> 🏯 _"Thiên lý chi hành, thủy ư túc hạ"_
> _(Hành trình ngàn dặm bắt đầu từ bước chân)_
