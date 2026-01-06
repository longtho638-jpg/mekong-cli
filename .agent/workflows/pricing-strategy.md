---
description: How to set up pricing strategy with AgencyOS
---

# 💰 Pricing Strategy Workflow

Configure dual-path pricing (Bootstrap + VC-Ready) in 5 steps (~12 min).

## 🤖 Quick Execute
```bash
mekong pricing:create --tier "starter" --price 49 --tier "growth" --price 199
```

## ⚡ Step-by-Step Execution

### Step 1: Analyze Current Pricing (2 min)
// turbo
```bash
mekong pricing:current

# If not set: "No pricing configured"
```

### Step 2: Setup Tier Structure (3 min)
// turbo
```bash
# Create 3-tier pricing (Bootstrap path)
mekong pricing:create \
  --tier "starter" --price 49 --currency "USD" \
  --tier "growth" --price 199 --currency "USD" \
  --tier "scale" --price 499 --currency "USD"

# Expected: ✅ 3 tiers created
```

### Step 3: Add VC-Ready Tiers (3 min)
// turbo
```bash
# Add high-touch tiers
mekong pricing:create \
  --tier "warrior" --price 2000 --type "retainer" \
  --tier "general" --price 5000 --type "retainer" \
  --tier "tuong-quan" --price 0 --type "equity" --equity "15-30%"

# Expected: ✅ VC-Ready tiers added
```

### Step 4: Configure Margins (2 min)
// turbo
```bash
mekong pricing:margins \
  --tier "starter" --target 80 \
  --tier "growth" --target 80 \
  --tier "warrior" --target 60

# Expected: ✅ Margin targets set
```

### Step 5: Generate Pricing Page (2 min)
// turbo
```bash
mekong pricing:page --output "./pages/pricing.tsx"

# Expected: ✅ Pricing page created
```

## ✅ Success Criteria
- [ ] 6 tiers configured (3 Bootstrap + 3 VC-Ready)
- [ ] Margins set (60-80%)
- [ ] Pricing page generated
- [ ] `mekong pricing:test` passes

## 📋 Pricing Config Template

Create `config/pricing.yaml`:
```yaml
tiers:
  # Bootstrap Path (70% of customers)
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
  
  scale:
    price: 499
    currency: USD
    billing: monthly
    target_margin: 75

  # VC-Ready Path (30% of customers)
  warrior:
    price: 2000
    type: retainer
    target_margin: 60
    includes:
      - "Strategy sessions"
      - "Dedicated CSM"
  
  general:
    price: 5000
    type: retainer
    target_margin: 60
  
  tuong-quan:
    price: 0
    type: equity
    equity: "15-30%"
```

## 🔗 Next Workflow
After pricing → `/retention-plays`

## 🏯 Binh Pháp Alignment
"Họ WIN → Mình WIN" - Price for value, not just cost.
