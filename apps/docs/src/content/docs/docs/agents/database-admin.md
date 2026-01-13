---
title: Database Admin Agent
description: Manage database operations and migrations
section: docs
category: agents
order: 12
published: true
ai_executable: true
---

# 🗄️ Database Admin Agent

> **Manage database operations and migrations**

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/agents/database-admin
```

---

## ⚡ Step-by-Step

### Step 1: Connect Database
```bash
mekong db:connect

# With URL
mekong db:connect --url $DATABASE_URL
```

### Step 2: Create Migration
```bash
mekong db:migrate --name "add_users_table"

# Generate from schema
mekong db:migrate --from-schema
```

### Step 3: Apply Migration
```bash
mekong db:push

# Preview first
mekong db:push --preview
```

---

## ✅ Success Criteria

- [ ] Database connected
- [ ] Migration created
- [ ] Schema applied
- [ ] Data integrity verified

---

## 🔧 Commands

| Command | Purpose |
|---------|---------|
| `mekong db:connect` | Connect DB |
| `mekong db:migrate` | Create migration |
| `mekong db:push` | Apply changes |
| `mekong db:seed` | Seed data |
| `mekong db:studio` | Open GUI |

---

**🏯 "Họ WIN → Mình WIN"**
