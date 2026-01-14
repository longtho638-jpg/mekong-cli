---
description: Unified AgencyOS workflow - Complete brainstorm → plan → code → test → ship pipeline
---
// turbo-all

# 🏯 AgencyOS Unified Workflow

Complete product development from idea to production using Binh Pháp methodology.

## Prerequisites

- PYTHONPATH set to project root
- All agents in `.claude/agents/` available
- Tests in `tests/` directory

---

## Phase 1: Strategic Analysis (Brainstorm)

### 1.1 Binh Pháp Analysis

Run strategic analysis with Ngũ Sự (5 Factors):

```bash
PYTHONPATH=. python3 cli/main.py binh-phap "$IDEA"
```

### 1.2 WIN-WIN-WIN Validation

Validate alignment:

```bash
PYTHONPATH=. python3 -c "
from antigravity.core.money_maker import MoneyMaker
mm = MoneyMaker()
# Check if idea passes WIN-WIN-WIN
print('✅ WIN-WIN-WIN: Checking alignment...')
"
```

---

## Phase 2: Planning

### 2.1 Create Implementation Plan

```bash
PYTHONPATH=. python3 cli/main.py plan "$IDEA"
```

### 2.2 Review Plan

**BLOCKING GATE**: User must approve `plans/task_plan.md` before proceeding.

---

## Phase 3: Development (Cook)

### 3.1 Build Features

```bash
PYTHONPATH=. python3 cli/main.py cook "$FEATURE"
```

### 3.2 Code Review

Use `code-reviewer` agent to validate:
- Security
- Performance  
- Architecture
- YAGNI/KISS/DRY compliance

**BLOCKING GATE**: Score must be ≥7/10

---

## Phase 4: Testing

### 4.1 Run Full Test Suite

```bash
PYTHONPATH=. python3 tests/test_wow.py
```

### 4.2 Verify All Passing

**BLOCKING GATE**: All tests must pass (11/11 or higher)

---

## Phase 5: Ship to Production

### 5.1 Commit Changes

```bash
git add -A
git commit -m "🏯 feat: $FEATURE - Binh Pháp aligned"
```

### 5.2 Push to Remote

```bash
git push origin main
```

### 5.3 Deploy (Optional)

```bash
# Vercel deployment
vercel deploy --prod

# Or Docker
docker-compose up -d
```

---

## Complete One-Liner

For simple features, run all phases:

```bash
PYTHONPATH=. python3 cli/main.py binh-phap "$IDEA" && \
PYTHONPATH=. python3 cli/main.py plan "$IDEA" && \
PYTHONPATH=. python3 cli/main.py cook "$FEATURE" && \
PYTHONPATH=. python3 tests/test_wow.py && \
git add -A && git commit -m "🏯 feat: $FEATURE" && git push
```

---

## Shell Alias Setup

Add to `~/.zshrc` for easy access:

```bash
# AgencyOS unified command
alias agencyos='cd /Users/macbookprom1/mekong-cli && PYTHONPATH=. python3 cli/main.py'

# Shortcuts
alias aos='agencyos'
alias aos-test='cd /Users/macbookprom1/mekong-cli && PYTHONPATH=. python3 tests/test_wow.py'
alias aos-ship='cd /Users/macbookprom1/mekong-cli && git add -A && git commit -m "🏯 ship" && git push'
```

Then reload: `source ~/.zshrc`

---

## 🏯 Binh Pháp Wisdom

> "Công dục thiện kỳ sự, tất tiên lợi kỳ khí"
> *Muốn làm tốt việc gì, trước hết phải có công cụ tốt*

---

## WIN-WIN-WIN Checklist

- [ ] 👑 ANH (Owner): Portfolio growth + cash flow
- [ ] 🏢 AGENCY: Moat building + process improvement
- [ ] 🚀 CLIENT: 10x value delivery
