---
title: "VC Readiness Workflow"
description: "Prepare clients for successful fundraising"
section: "workflows"
order: 7
published: true
ai_executable: true
estimated_time: "20 minutes"
---

# 💸 VC Readiness Workflow

> **WIN-WIN-WIN**: Client WIN (funding) → Agency WIN (success fee) → Owner WIN (equity)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/vc-readiness
```

---

## ⚡ Step-by-Step Execution

### Step 1: Run Readiness Assessment (3 min)
```bash
# Check VC readiness score
mekong vc:assess --client "ABC Corp"

# Expected output:
# ┌─────────────────────────────────┐
# │ VC Readiness Score: 72/100     │
# │ Status: ALMOST READY           │
# │ Gaps: Metrics, Data Room       │
# └─────────────────────────────────┘
```

### Step 2: Generate Metrics Dashboard (5 min)
```bash
# Create investor metrics
mekong vc:metrics \
  --client "ABC Corp" \
  --mrr 50000 \
  --growth 15 \
  --cac 200 \
  --ltv 2400 \
  --churn 3

# Expected: ✅ Metrics dashboard created
```

### Step 3: Create Data Room (5 min)
```bash
# Initialize data room
mekong vc:dataroom \
  --client "ABC Corp" \
  --sections "financials,metrics,team,product,legal"

# Expected: ✅ Data room structure created
# URL: https://dataroom.agencyos.network/abc-corp
```

### Step 4: Generate Pitch Deck (5 min)
```bash
# Create pitch deck
mekong vc:pitch \
  --client "ABC Corp" \
  --template "seed" \
  --slides 12 \
  --output "./decks/abc-corp-seed.pdf"

# Expected: ✅ 12-slide deck generated
```

### Step 5: Anti-Dilution Check (2 min)
```bash
# Run term sheet analyzer
mekong vc:anti-dilution --checklist

# Check for red flags:
# ❌ 2x+ liquidation preference
# ❌ Full ratchet anti-dilution
# ⚠️ Investor board majority
```

---

## ✅ Success Criteria

- [ ] Readiness score ≥ 80
- [ ] Metrics dashboard complete
- [ ] Data room populated
- [ ] Pitch deck approved
- [ ] Anti-dilution checklist reviewed

---

## 📋 Data Room Template

```
/dataroom/
├── 01-executive-summary/
│   └── one-pager.pdf
├── 02-financials/
│   ├── p&l-12mo.xlsx
│   ├── projections-3yr.xlsx
│   └── cap-table.xlsx
├── 03-metrics/
│   └── kpi-dashboard.pdf
├── 04-team/
│   └── org-chart.pdf
├── 05-product/
│   ├── roadmap.pdf
│   └── demo-video.mp4
└── 06-legal/
    ├── incorporation.pdf
    └── ip-assignments.pdf
```

---

## 🔗 Next Workflow

→ [MVP Launch](/docs/workflows/mvp-launch)

---

**🏯 "Họ WIN → Mình WIN"**
