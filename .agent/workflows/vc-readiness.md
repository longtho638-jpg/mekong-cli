---
description: How to prepare your agency for venture capital fundraising
---

# 💰 VC Readiness Workflow

Prepare your agency for successful fundraising with institutional investors.

## 🤖 Quick Execute
```bash
Execute workflow: https://agencyos.network/docs/workflows/vc-readiness
```

## ⚡ Step-by-Step Execution

### Step 1: Run VC Metrics Audit (5 min)
// turbo
```bash
# Generate VC-ready metrics dashboard
mekong vc:audit

# Key Metrics Required:
# - ARR / MRR
# - Growth Rate (MoM, YoY)
# - Churn Rate / NRR
# - CAC / LTV / LTV:CAC Ratio
# - Gross Margin
```

### Step 2: Calculate Unit Economics (3 min)
// turbo
```bash
# Compute SaaS unit economics
mekong vc:unit-economics

# Expected Output:
# ┌─────────────────────────────────┐
# │ CAC: $XXX                       │
# │ LTV: $X,XXX                     │
# │ LTV:CAC: X.Xx                   │
# │ Payback: X months               │
# └─────────────────────────────────┘
```

### Step 3: Generate Pitch Deck Data (5 min)
// turbo
```bash
# Export metrics for pitch deck
mekong vc:pitch-data --format json --output ./pitch/metrics.json

# Includes:
# - Revenue charts
# - Growth projections
# - Cohort analysis
# - Retention curves
```

### Step 4: Prepare Data Room (10 min)
// turbo
```bash
# Initialize secure data room structure
mekong vc:data-room --init

# Creates:
# /data-room/
# ├── financials/
# ├── legal/
# ├── team/
# ├── product/
# └── customers/
```

### Step 5: Run VC Score Check (2 min)
// turbo
```bash
# Calculate investability score
mekong vc:score

# Scoring Criteria:
# - Growth velocity (0-25)
# - Unit economics (0-25)
# - Market size (0-20)
# - Team strength (0-15)
# - Defensibility (0-15)
```

## 📋 VC Readiness Checklist

### Metrics Ready
```yaml
required_metrics:
  arr: Current annual recurring revenue
  mrr_growth: Month-over-month growth rate
  ltv_cac: Must be > 3x for healthy SaaS
  net_retention: Target > 100% (expansion revenue)
  gross_margin: Target > 70% for software
```

### Data Room Structure
```
/data-room/
├── financials/
│   ├── p&l.xlsx
│   ├── cap-table.xlsx
│   └── projections.xlsx
├── legal/
│   ├── incorporation.pdf
│   ├── ip-assignment.pdf
│   └── contracts.pdf
├── team/
│   ├── org-chart.pdf
│   └── bios.pdf
└── product/
    ├── demo.mp4
    └── roadmap.pdf
```

## ✅ Success Criteria
- [ ] All SaaS metrics calculated
- [ ] Unit economics are healthy (LTV:CAC > 3)
- [ ] Data room structure created
- [ ] Pitch deck data exported
- [ ] VC score > 70

## 🔗 Next Workflow
After VC readiness: `/mvp-launch` or `/finance-reporting`

## 🏯 Binh Pháp Alignment
"知己知彼，百战不殆" (Know yourself, know the investor) - Preparation wins funding.
