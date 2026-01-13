---
title: Debugger Agent
description: Find and fix bugs systematically
section: docs
category: agents
order: 5
published: true
ai_executable: true
estimated_time: "5 minutes"
---

# 🐛 Debugger Agent

> **Find and fix bugs systematically**

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/agents/debugger
```

---

## ⚡ Step-by-Step

### Step 1: Describe the Bug (1 min)
```bash
mekong agent:debugger --bug "Login button not working"

# Expected: ✅ Debugger analyzing...
```

### Step 2: Get Fix Plan
```bash
# Simple fix
mekong fix "login not redirecting"

# Hard debug (complex issues)
mekong fix --hard "race condition in checkout"

# From error log
mekong fix --log "./error.log"
```

### Step 3: Apply Fix
```bash
# Auto-apply suggested fix
mekong fix --apply

# Review first
mekong fix --review
```

### Step 4: Verify
```bash
# Run tests
mekong test

# Manual verification
mekong dev
```

---

## ✅ Success Criteria

- [ ] Root cause identified
- [ ] Fix applied
- [ ] Tests passing
- [ ] Bug not reproducible

---

## 🔧 Commands

| Command | Purpose |
|---------|---------|
| `mekong fix "issue"` | Quick fix |
| `mekong fix --hard` | Complex debugging |
| `mekong fix --log` | Debug from logs |
| `mekong fix --apply` | Auto-apply fix |
| `mekong fix --test` | Fix + run tests |

---

## 🔗 Related

- [Tester](/docs/agents/tester) - Verify fixes
- [Scout](/docs/agents/scout) - Analyze codebase
- [Fullstack](/docs/agents/fullstack-developer) - Implement

---

**🏯 "Họ WIN → Mình WIN"**
