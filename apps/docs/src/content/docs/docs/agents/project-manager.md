---
title: Project Manager Agent
description: Manage projects and track progress
section: docs
category: agents
order: 16
published: true
ai_executable: true
---

# 📊 Project Manager Agent

> **Manage projects and track progress**

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/agents/project-manager
```

---

## ⚡ Step-by-Step

### Step 1: Create Project
```bash
mekong project:create "MVP Launch"

# With deadline
mekong project:create "MVP Launch" --deadline "2026-02-01"
```

### Step 2: Add Tasks
```bash
mekong project:task "Design UI" --assignee "designer"
mekong project:task "Build API" --assignee "developer"
```

### Step 3: Track Progress
```bash
mekong project:status

# Output: Progress %, tasks remaining, timeline
```

---

## ✅ Success Criteria

- [ ] Project created
- [ ] Tasks assigned
- [ ] Progress tracked
- [ ] Deadlines met

---

## 🔧 Commands

| Command | Purpose |
|---------|---------|
| `mekong project:create` | New project |
| `mekong project:task` | Add task |
| `mekong project:status` | View progress |
| `mekong project:report` | Generate report |

---

**🏯 "Họ WIN → Mình WIN"**
