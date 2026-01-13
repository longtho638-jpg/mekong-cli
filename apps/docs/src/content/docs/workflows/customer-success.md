---
title: "Customer Success Workflow"
description: "NRR optimization and retention"
section: "workflows"
order: 32
published: true
ai_executable: true
estimated_time: "12 minutes"
---

# 🏆 Customer Success Workflow

> **WIN-WIN-WIN**: Customer WIN (results) → Agency WIN (retention) → Owner WIN (NRR)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/customer-success
```

---

## ⚡ Step-by-Step Execution

### Step 1: Initialize CS Module (2 min)
```bash
mekong cs:init

# Expected: ✅ Customer success module ready
```

### Step 2: Configure Health Scoring (3 min)
```bash
mekong cs:health \
  --factor "usage" --weight 30 \
  --factor "engagement" --weight 20 \
  --factor "support" --weight 15 \
  --factor "nps" --weight 15 \
  --factor "billing" --weight 20

# Expected: ✅ Health scoring configured
```

### Step 3: Create Playbooks (4 min)
```bash
mekong cs:playbook \
  --name "green" --trigger "score >= 80" --action "expansion" \
  --name "yellow" --trigger "score 50-79" --action "checkin" \
  --name "red" --trigger "score < 50" --action "save"

# Expected: ✅ 3 playbooks active
```

### Step 4: Run Health Check (3 min)
```bash
mekong cs:check --all

# Expected output:
# ┌─────────────────────────────────┐
# │ Customer Health Report          │
# │ Green: 80%  Yellow: 15%  Red: 5%│
# │ NRR: 115%                       │
# └─────────────────────────────────┘
```

---

## ✅ Success Criteria

- [ ] Health scoring active
- [ ] All clients scored
- [ ] Gross retention 95%+
- [ ] Net revenue retention 110%+

---

## 🎯 27/27 WORKFLOWS COMPLETE!

This is the final workflow in the $1M roadmap.

| Phase | Workflows | Status |
|-------|-----------|--------|
| Foundation | 8 | ✅ |
| Scaling | 9 | ✅ |
| Expansion | 7 | ✅ |
| Dominance | 3 | ✅ |
| **TOTAL** | **27** | **100%** |

---

**🏯 "Bất chiến nhi khuất nhân chi binh"**
