---
title: "Real Estate CRM Workflow"
description: "Property sales and client management for real estate"
section: "workflows"
order: 21
published: true
ai_executable: true
estimated_time: "12 minutes"
---

# 🏠 Real Estate CRM Workflow

> **WIN-WIN-WIN**: Agent WIN (deals) → Agency WIN (commissions) → Owner WIN (market share)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/real-estate-crm
```

---

## ⚡ Step-by-Step Execution

### Step 1: Initialize RE CRM (3 min)
```bash
mekong realestate:init --type "residential"

# Expected: ✅ Real estate CRM ready
```

### Step 2: Setup Listing Pipeline (3 min)
```bash
mekong realestate:pipeline \
  --stages "new,photography,listed,showing,offer,closed"

# Expected: ✅ 6-stage pipeline created
```

### Step 3: Add First Listing (3 min)
```bash
mekong realestate:listing \
  --address "123 Main St" \
  --price 500000 \
  --beds 3 --baths 2 \
  --sqft 1800

# Expected: ✅ Listing added
```

### Step 4: Create Lead Capture (3 min)
```bash
mekong realestate:leadform \
  --embed "website" \
  --fields "name,email,phone,budget"

# Expected: ✅ Lead form generated
```

---

## ✅ Success Criteria

- [ ] CRM active with listings
- [ ] Lead capture on website
- [ ] Response time < 5 min
- [ ] Close rate > 10%

---

**🏯 "Họ WIN → Mình WIN"**
