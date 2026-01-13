---
title: Code Reviewer Agent
description: Review code for quality and best practices
section: docs
category: agents
order: 11
published: true
ai_executable: true
---

# 👀 Code Reviewer Agent

> **Review code for quality and best practices**

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/agents/code-reviewer
```

---

## ⚡ Step-by-Step

### Step 1: Review Code
```bash
mekong review "src/api/users.ts"

# Review entire PR
mekong review --pr 123

# Review recent changes
mekong review --recent
```

### Step 2: Get Feedback
```bash
# Output includes:
# - Security issues
# - Performance concerns
# - Best practice violations
# - Suggested improvements
```

### Step 3: Apply Suggestions
```bash
mekong review --apply
```

---

## ✅ Success Criteria

- [ ] Code reviewed
- [ ] Issues identified
- [ ] Suggestions applied
- [ ] Quality improved

---

## 🔧 Commands

| Command | Purpose |
|---------|---------|
| `mekong review "file"` | Review file |
| `mekong review --pr` | Review PR |
| `mekong review --apply` | Apply fixes |

---

**🏯 "Họ WIN → Mình WIN"**
