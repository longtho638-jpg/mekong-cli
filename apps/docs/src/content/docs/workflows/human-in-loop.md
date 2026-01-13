---
title: "Human-in-Loop Workflow"
description: "Approval workflows with suspend/resume capability"
section: "workflows"
order: 18
published: true
ai_executable: true
estimated_time: "10 minutes"
---

# 👤 Human-in-Loop Workflow

> **WIN-WIN-WIN**: Client WIN (control) → Agency WIN (trust) → Owner WIN (quality)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/human-in-loop
```

---

## ⚡ Step-by-Step Execution

### Step 1: Setup Approval Rules (3 min)
```bash
mekong approval:rules \
  --type "proposal" --threshold 10000 --approver "manager" \
  --type "contract" --threshold 0 --approver "legal" \
  --type "expense" --threshold 500 --approver "finance"

# Expected: ✅ 3 approval rules created
```

### Step 2: Create Approval Workflow (3 min)
```bash
mekong approval:workflow \
  --name "proposal-approval" \
  --steps "auto-check,manager-review,send"

# Expected: ✅ Workflow with suspend point
```

### Step 3: Test Approval Flow (2 min)
```bash
mekong approval:test \
  --workflow "proposal-approval" \
  --amount 15000

# Expected: 
# Step 1: ✅ Auto-check passed
# Step 2: ⏸️ SUSPENDED - Waiting for manager
```

### Step 4: Resume After Approval (2 min)
```bash
mekong approval:resume \
  --id "prop-123" \
  --decision "approved" \
  --approver "manager@agency.com"

# Expected: ✅ Workflow completed
```

---

## ✅ Success Criteria

- [ ] Approval rules defined
- [ ] Suspend/resume working
- [ ] Notifications sent
- [ ] Audit trail maintained

---

**🏯 "Họ WIN → Mình WIN"**
