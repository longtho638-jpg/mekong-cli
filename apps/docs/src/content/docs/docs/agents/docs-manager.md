---
title: Docs Manager Agent
description: Create and maintain documentation
section: docs
category: agents
order: 13
published: true
ai_executable: true
---

# 📖 Docs Manager Agent

> **Create and maintain documentation**

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/agents/docs-manager
```

---

## ⚡ Step-by-Step

### Step 1: Generate Docs
```bash
mekong docs:generate

# For specific file
mekong docs:generate "src/api/users.ts"
```

### Step 2: Update README
```bash
mekong docs:readme

# With sections
mekong docs:readme --sections "install,usage,api"
```

### Step 3: API Documentation
```bash
mekong docs:api

# Output: ./docs/api/reference.md
```

---

## ✅ Success Criteria

- [ ] Documentation generated
- [ ] README updated
- [ ] API docs complete
- [ ] Examples included

---

## 🔧 Commands

| Command | Purpose |
|---------|---------|
| `mekong docs:generate` | Generate docs |
| `mekong docs:readme` | Update README |
| `mekong docs:api` | API reference |

---

**🏯 "Họ WIN → Mình WIN"**
