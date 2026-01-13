---
title: "Government & Public Sector Workflow"
description: "Permit processing and citizen services"
section: "workflows"
order: 26
published: true
ai_executable: true
estimated_time: "12 minutes"
---

# 🏛️ Government & Public Sector Workflow

> **WIN-WIN-WIN**: Citizen WIN (service) → Agency WIN (trust) → Owner WIN (contracts)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/government
```

---

## ⚡ Step-by-Step Execution

### Step 1: Create Citizen Portal (4 min)
```bash
mekong government:portal \
  --services "permits,licenses,complaints" \
  --accessibility "wcag-aa"

# Expected: ✅ Citizen portal scaffolded
```

### Step 2: Setup Permit Workflow (4 min)
```bash
mekong government:workflow \
  --type "permit" \
  --stages "submit,review,approve,issue" \
  --sla "5 business days"

# Expected: ✅ Permit workflow created
```

### Step 3: Add Payment Gateway (2 min)
```bash
mekong government:payment \
  --provider "stripe-gov" \
  --fees "permit:50,license:25"

# Expected: ✅ Government payment enabled
```

### Step 4: Create Status Tracker (2 min)
```bash
mekong government:tracker \
  --notifications "email,sms"

# Expected: ✅ Status tracking for citizens
```

---

## ✅ Success Criteria

- [ ] Citizen portal live
- [ ] Permit workflow active
- [ ] WCAG 2.1 AA compliant
- [ ] Processing time -60%

---

**🏯 "Họ WIN → Mình WIN"**
