---
title: "Pricing Strategy Workflow"
description: "Design pricing packages for Bootstrap and VC-Ready clients"
section: "workflows"
order: 4
published: true
ai_executable: true
estimated_time: "12 minutes"
---

# 💰 Pricing Strategy Workflow

> **WIN-WIN-WIN**: Client WIN (value) → Agency WIN (margin) → Owner WIN (profit)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/pricing-strategy
```

---

## ⚡ Step-by-Step Execution

### Step 1: Analyze Current Pricing (2 min)
```bash
# View current pricing structure
mekong pricing:current

# If not set: "No pricing configured"
```

### Step 2: Setup Tier Structure (3 min)
```bash
# Create 3-tier pricing (Bootstrap path)
mekong pricing:create \
  --tier "starter" --price 49 --currency "USD" \
  --tier "growth" --price 199 --currency "USD" \
  --tier "scale" --price 499 --currency "USD"

# Expected: ✅ 3 tiers created
```

### Step 3: Add VC-Ready Tiers (3 min)
```bash
# Add high-touch tiers
mekong pricing:create \
  --tier "warrior" --price 2000 --type "retainer" \
  --tier "general" --price 5000 --type "retainer" \
  --tier "tuong-quan" --price 0 --type "equity" --equity "15-30%"

# Expected: ✅ VC-Ready tiers added
```

### Step 4: Configure Margins (2 min)
```bash
# Set target margins
mekong pricing:margins \
  --tier "starter" --target 80 \
  --tier "growth" --target 80 \
  --tier "warrior" --target 60

# Expected: ✅ Margin targets set
```

### Step 5: Generate Pricing Page (2 min)
```bash
# Create pricing page component
mekong pricing:page --output "./pages/pricing.tsx"

# Expected: ✅ Pricing page created
```

---

## ✅ Success Criteria

- [ ] 6 tiers configured (3 Bootstrap + 3 VC-Ready)
- [ ] Margins set (60-80%)
- [ ] Pricing page generated
- [ ] `mekong pricing:test` passes

---

## 📋 Pricing Config Template

```yaml
# config/pricing.yaml
tiers:
  # Bootstrap Path (70%)
  starter:
    price: 49
    currency: USD
    billing: monthly
    target_margin: 80
    features:
      - "Core tools"
      - "Email support"
      
  growth:
    price: 199
    currency: USD
    billing: monthly
    target_margin: 80
    features:
      - "All Starter features"
      - "Priority support"
      - "API access"
      
  # VC-Ready Path (30%)
  warrior:
    price: 2000
    type: retainer
    target_margin: 60
    includes:
      - "Strategy sessions"
      - "Dedicated CSM"
```

---

## 🔗 Next Workflow

→ [Retention Plays](/docs/workflows/retention-plays)

---

**🏯 "Họ WIN → Mình WIN"**
