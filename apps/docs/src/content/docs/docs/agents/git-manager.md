---
title: Git Manager Agent
description: Handle all git operations
section: docs
category: agents
order: 10
published: true
ai_executable: true
---

# 📦 Git Manager Agent

> **Handle all git operations**

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/agents/git-manager
```

---

## ⚡ Step-by-Step

### Step 1: Stage & Commit
```bash
mekong git:commit "Add user authentication"

# Auto-generate message
mekong git:commit --auto
```

### Step 2: Create PR
```bash
mekong git:pr "feature/auth"

# With description
mekong git:pr --title "Add OAuth2" --body "Implements Google login"
```

### Step 3: Branch Management
```bash
# Create branch
mekong git:branch "feature/new-feature"

# Merge
mekong git:merge "develop"

# Sync
mekong git:sync
```

---

## ✅ Success Criteria

- [ ] Changes committed
- [ ] PR created
- [ ] Conflicts resolved
- [ ] Branch up to date

---

## 🔧 Commands

| Command | Purpose |
|---------|---------|
| `mekong git:commit` | Commit changes |
| `mekong git:pr` | Create PR |
| `mekong git:branch` | Create branch |
| `mekong git:merge` | Merge branches |
| `mekong git:sync` | Sync with remote |

---

**🏯 "Họ WIN → Mình WIN"**
