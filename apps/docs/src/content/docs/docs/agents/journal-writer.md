---
title: Journal Writer Agent
description: Write project journals and updates
section: docs
category: agents
order: 14
published: true
ai_executable: true
---

# ✏️ Journal Writer Agent

> **Write project journals and updates**

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/agents/journal-writer
```

---

## ⚡ Step-by-Step

### Step 1: Create Journal Entry
```bash
mekong journal:create

# With topic
mekong journal:create --topic "Week 1 Progress"
```

### Step 2: Auto-Generate from Git
```bash
mekong journal:from-git --days 7

# Output: ./journals/weekly-YYYYMMDD.md
```

### Step 3: Export
```bash
mekong journal:export --format "pdf"
```

---

## ✅ Success Criteria

- [ ] Journal entry created
- [ ] Progress documented
- [ ] Key learnings captured
- [ ] Exported successfully

---

## 🔧 Commands

| Command | Purpose |
|---------|---------|
| `mekong journal:create` | New entry |
| `mekong journal:from-git` | From commits |
| `mekong journal:export` | Export |

---

**🏯 "Họ WIN → Mình WIN"**
