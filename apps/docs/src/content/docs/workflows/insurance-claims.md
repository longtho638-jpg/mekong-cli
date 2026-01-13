---
title: "Insurance Claims Workflow"
description: "Claims processing automation for insurance clients"
section: "workflows"
order: 24
published: true
ai_executable: true
estimated_time: "12 minutes"
---

# 🛡️ Insurance Claims Workflow

> **WIN-WIN-WIN**: Claimant WIN (speed) → Insurer WIN (efficiency) → Owner WIN (niche)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/insurance-claims
```

---

## ⚡ Step-by-Step Execution

### Step 1: Setup Claims Pipeline (3 min)
```bash
mekong insurance:init \
  --stages "filed,review,investigation,decision,settlement"

# Expected: ✅ 5-stage claims pipeline
```

### Step 2: Create Intake Form (3 min)
```bash
mekong insurance:form \
  --type "claim" \
  --ocr true \
  --upload "photos,documents"

# Expected: ✅ Smart intake form with OCR
```

### Step 3: Setup Automation Rules (4 min)
```bash
mekong insurance:rules \
  --auto-approve "under 1000" \
  --flag "keywords:fraud,suspicious" \
  --sla "72 hours"

# Expected: ✅ Automation rules active
```

### Step 4: Create Dashboard (2 min)
```bash
mekong insurance:dashboard \
  --metrics "avg_time,approval_rate,satisfaction"

# Expected: ✅ Claims dashboard ready
```

---

## ✅ Success Criteria

- [ ] Claims pipeline active
- [ ] OCR intake working
- [ ] SLA monitoring live
- [ ] Processing time -50%

---

**🏯 "Họ WIN → Mình WIN"**
