---
title: "Retail E-commerce Workflow"
description: "E-commerce operations for retail clients"
section: "workflows"
order: 20
published: true
ai_executable: true
estimated_time: "15 minutes"
---

# 🛒 Retail E-commerce Workflow

> **WIN-WIN-WIN**: Retailer WIN (sales) → Agency WIN (results) → Owner WIN (expansion)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/retail-ecommerce
```

---

## ⚡ Step-by-Step Execution

### Step 1: Audit Store (3 min)
```bash
mekong retail:audit --url "https://store.example.com"

# Expected: Conversion rate, AOV, cart abandonment
```

### Step 2: Setup Analytics (3 min)
```bash
mekong retail:analytics \
  --provider "ga4" \
  --ecommerce true \
  --events "add_to_cart,purchase,refund"

# Expected: ✅ E-commerce tracking enabled
```

### Step 3: Create Abandoned Cart Flow (5 min)
```bash
mekong retail:flow \
  --trigger "cart_abandoned" \
  --email-1 "2 hours" \
  --email-2 "24 hours" \
  --email-3 "72 hours"

# Expected: ✅ 3-email recovery sequence
```

### Step 4: Setup Retargeting (4 min)
```bash
mekong retail:retarget \
  --platform "meta,google" \
  --audience "cart_abandoners" \
  --budget 50

# Expected: ✅ Retargeting ads configured
```

---

## ✅ Success Criteria

- [ ] Conversion tracking active
- [ ] Abandoned cart sequence live
- [ ] Retargeting running
- [ ] Cart abandonment < 70%

---

**🏯 "Họ WIN → Mình WIN"**
