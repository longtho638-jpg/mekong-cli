---
description: How to set up and manage sales pipeline with AgencyOS CRM
---

# 🎯 Sales Pipeline Workflow

Set up a professional sales pipeline in under 15 minutes.

## 🤖 Quick Execute
```bash
Execute workflow: https://agencyos.network/docs/workflows/sales-pipeline
```

## ⚡ Step-by-Step Execution

### Step 1: Check Prerequisites (1 min)
// turbo
```bash
# Verify mekong-cli installed
mekong --version

# Check database connection
mekong db:status
```

### Step 2: Initialize CRM Pipeline (2 min)
// turbo
```bash
# Create pipeline with 5 stages
mekong crm:init --stages "lead,qualified,proposal,negotiation,closed"

# Expected: ✅ CRM pipeline created
```

### Step 3: Configure Lead Scoring (3 min)
// turbo
```bash
# Apply default scoring rules
mekong crm:scoring --preset agencyos

# Scoring weights:
# - Budget confirmed: +20
# - Decision maker: +15
# - Timeline < 30 days: +15
# - Referral source: +20
# - Qualified threshold: 60+
```

### Step 4: Add Your First Lead (2 min)
// turbo
```bash
mekong crm:add-lead \
  --name "John Doe" \
  --company "ABC Corp" \
  --email "john@abccorp.com" \
  --source "referral"

# Expected: ✅ Lead added, Score: 75 (Qualified)
```

### Step 5: Generate First Proposal (3 min)
// turbo
```bash
mekong proposal:create \
  --client "ABC Corp" \
  --tier "warrior" \
  --output "./proposals/abc-corp.pdf"

# Expected: ✅ Proposal saved
```

### Step 6: Verify Pipeline Ready (1 min)
// turbo
```bash
mekong crm:status

# Expected:
# ┌─────────────────────────────────┐
# │ Sales Pipeline: ACTIVE          │
# │ Stages: 5                       │
# │ Leads: 1                        │
# │ Qualified: 1                    │
# └─────────────────────────────────┘
```

## 📋 Templates

### Lead Scoring Config
Create `config/scoring.yaml`:
```yaml
lead_scoring:
  threshold: 60
  factors:
    budget_confirmed: 20
    decision_maker: 15
    timeline_30_days: 15
    referral_source: 20
    industry_match: 10
    team_size_5plus: 10
    previous_agency: 10
```

### Proposal Structure
```
/proposals/
├── templates/
│   ├── warrior.md      # $2K/mo tier
│   ├── general.md      # $5K/mo tier
│   └── tuong-quan.md   # Equity tier
└── [client-name].pdf
```

## ✅ Success Criteria
- [ ] Pipeline has 5 stages configured
- [ ] Lead scoring is active (threshold: 60)
- [ ] At least 1 test lead added
- [ ] Proposal generation works

## 🔗 Next Workflow
After sales pipeline: `/client-onboarding`

## 🏯 Binh Pháp Alignment
"知己知彼" (Know yourself, know your enemy) - Qualify leads before engagement.
