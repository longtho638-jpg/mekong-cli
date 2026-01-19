---
description: Build feature - code generation, tests, CI, and deploy in one command
---

// turbo-all

# 🏯 /build [feature] - Vibe Coding Pipeline

One command: Idea → Code → Test → Deploy

## Arguments

- `$FEATURE` - Feature name or description

## What Runs (Silently)

### 1. Strategic Analysis

```bash
PYTHONPATH=. python3 cli/main.py binh-phap "$FEATURE"
```

### 2. Implementation Planning

```bash
PYTHONPATH=. python3 cli/main.py plan "$FEATURE"
```

### 3. Code Generation

```bash
PYTHONPATH=. python3 cli/main.py cook "$FEATURE"
```

### 4. Auto-Testing

```bash
PYTHONPATH=. python3 -m pytest tests/ -q --tb=short
```

### 5. Linting

```bash
python3 -m ruff check . --fix
```

### 6. CI Validation

```bash
# Run full CI locally
PYTHONPATH=. python3 tests/test_wow.py
```

### 7. Deploy (if tests pass)

```bash
git add -A
git commit -m "🏯 feat($FEATURE): Binh Pháp aligned"
git push origin main
```

## Output Format

```
✅ Analysis complete: {score}/10 alignment
✅ Code generated: {files} files
✅ Tests: {passed}/{total} passed
✅ Deployed: {commit_sha}

🔗 Live: {deploy_url}
```

---

> 🏯 _"Công dục thiện kỳ sự, tất tiên lợi kỳ khí"_
