---
title: "Finance Reporting Workflow"
description: "P&L tracking and financial management for agencies"
section: "workflows"
order: 10
published: true
ai_executable: true
estimated_time: "12 minutes"
---

# 💵 Finance Reporting Workflow

> **WIN-WIN-WIN**: Client WIN (clarity) → Agency WIN (margins) → Owner WIN (profit)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/finance-reporting
```

---

## ⚡ Step-by-Step Execution

### Step 1: Initialize Finance Module (2 min)
```bash
mekong finance:init

# Expected: ✅ Finance module ready
```

### Step 2: Create Chart of Accounts (3 min)
```bash
mekong finance:accounts --preset agency

# Creates: Revenue, COGS, OpEx, Payroll categories
```

### Step 3: Setup Monthly P&L (3 min)
```bash
mekong finance:pnl \
  --revenue 50000 \
  --cogs 15000 \
  --opex 20000 \
  --period "2026-01"

# Expected: ✅ P&L report generated
# Net Profit: $15,000 (30% margin)
```

### Step 4: Configure Cash Flow Alerts (2 min)
```bash
mekong finance:alerts \
  --runway-min 3 \
  --buffer 50000

# Expected: ✅ Alerts configured
```

### Step 5: Generate Dashboard (2 min)
```bash
mekong finance:dashboard --output "./reports/"

# Expected: ✅ Finance dashboard created
```

---

## ✅ Success Criteria

- [ ] Chart of accounts configured
- [ ] Monthly P&L automated
- [ ] Cash flow alerts active
- [ ] 6+ month runway maintained

---

**🏯 "Họ WIN → Mình WIN"**
