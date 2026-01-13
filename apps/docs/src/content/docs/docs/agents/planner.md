---
title: Planner Agent
description: Research, analyze, and create comprehensive implementation plans
section: docs
category: agents
order: 3
published: true
ai_executable: true
estimated_time: "5 minutes"
---

# 📋 Planner Agent

> **Create implementation plans before coding**

---

## 🤖 Quick Execute

**Paste to your IDE:**
```
Execute: https://agencyos.network/docs/agents/planner
```

---

## ⚡ Step-by-Step

### Step 1: Activate Planner (1 min)
```bash
mekong agent:planner --task "Add user authentication"

# Expected: ✅ Planner agent activated
```

### Step 2: Generate Plan (3 min)
```bash
# Basic planning
mekong plan "add OAuth2 authentication"

# Compare approaches
mekong plan --compare "Redis vs PostgreSQL caching"

# Fix planning
mekong plan --fix "memory leak in job processor"
```

### Step 3: Review Plan
```bash
# View generated plan
cat plans/latest.md

# Plans saved to: plans/[feature]-YYYYMMDD.md
```

### Step 4: Execute Plan (optional)
```bash
# Start implementation
mekong cook @plans/latest.md

# Expected: ✅ Implementation started
```

---

## ✅ Success Criteria

- [ ] Plan generated with clear steps
- [ ] Timeline estimated
- [ ] Rollback plan included
- [ ] Ready for `/cook` command

---

## 📋 Plan Output Template

```markdown
# Implementation Plan: [Feature Name]

## Approach
Why this solution + alternatives considered

## Steps
1. Install Dependencies (5 min)
2. Core Implementation (20 min)
3. Integration (15 min)
4. Testing (20 min)

## Timeline
Total: 1 hour

## Rollback Plan
Step-by-step recovery if issues occur
```

---

## 🔧 Commands Reference

| Command | Purpose |
|---------|---------|
| `mekong plan "task"` | Create basic plan |
| `mekong plan --compare` | Compare 2 approaches |
| `mekong plan --fix` | Plan bug fix |
| `mekong plan --cro` | CRO improvement plan |
| `mekong cook @plan.md` | Execute plan |

---

## 🔗 Related

- [Fullstack Developer](/docs/agents/fullstack-developer) - Execute plans
- [Researcher](/docs/agents/researcher) - Deep research
- [Scout](/docs/agents/scout) - Codebase analysis

---

**🏯 "Họ WIN → Mình WIN"**
