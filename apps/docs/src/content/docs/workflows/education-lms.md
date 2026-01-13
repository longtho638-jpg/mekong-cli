---
title: "Education LMS Workflow"
description: "Learning management system for education clients"
section: "workflows"
order: 22
published: true
ai_executable: true
estimated_time: "15 minutes"
---

# 🎓 Education LMS Workflow

> **WIN-WIN-WIN**: Student WIN (learning) → Educator WIN (scale) → Owner WIN (recurring)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/education-lms
```

---

## ⚡ Step-by-Step Execution

### Step 1: Initialize LMS (3 min)
```bash
mekong education:init --platform "custom"

# Expected: ✅ LMS structure created
```

### Step 2: Create Course (5 min)
```bash
mekong education:course \
  --title "Agency Automation 101" \
  --modules 5 \
  --price 297

# Expected: ✅ Course structure created
```

### Step 3: Add Lessons (5 min)
```bash
mekong education:lesson \
  --course "agency-automation-101" \
  --title "Getting Started" \
  --type "video" \
  --duration "10min"

# Expected: ✅ Lesson added
```

### Step 4: Setup Payment (2 min)
```bash
mekong education:payment \
  --provider "stripe" \
  --price 297 \
  --trial 7

# Expected: ✅ Payment enabled with 7-day trial
```

---

## ✅ Success Criteria

- [ ] Course published
- [ ] Payment processing active
- [ ] 5+ lessons uploaded
- [ ] First student enrolled

---

**🏯 "Họ WIN → Mình WIN"**
