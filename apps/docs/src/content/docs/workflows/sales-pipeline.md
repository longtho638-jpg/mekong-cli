---
title: "Sales Pipeline Workflow"
description: "Lead to client conversion workflow for AgencyOS"
section: "workflows"
order: 1
published: true
ai_executable: true
estimated_time: "15 minutes"
---

# 🎯 Sales Pipeline Workflow

> **WIN-WIN-WIN**: Lead WIN (value) → Agency WIN (client) → Owner WIN (revenue)

---

## 🤖 Quick Execute

**Paste this to your IDE:**
```
Execute workflow: https://agencyos.network/docs/workflows/sales-pipeline
```

---

## ⚡ Step-by-Step Execution

### Step 1: Check Prerequisites (1 min)
```bash
# Verify mekong-cli installed
mekong --version

# Check database connection
mekong db:status
```
<!-- AI: If command fails, run: pip install mekong-cli -->

### Step 2: Initialize CRM Pipeline (2 min)
```bash
# Create pipeline with 5 stages
mekong crm:init --stages "lead,qualified,proposal,negotiation,closed"

# Expected output: ✅ CRM pipeline created
```

### Step 3: Configure Lead Scoring (3 min)
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
```bash
# Add a test lead
mekong crm:add-lead \
  --name "John Doe" \
  --company "ABC Corp" \
  --email "john@abccorp.com" \
  --source "referral"

# Expected: ✅ Lead added, Score: 75 (Qualified)
```

### Step 5: Generate First Proposal (3 min)
```bash
# Generate proposal for qualified lead
mekong proposal:create \
  --client "ABC Corp" \
  --tier "warrior" \
  --output "./proposals/abc-corp.pdf"

# Expected: ✅ Proposal saved to ./proposals/abc-corp.pdf
```

### Step 6: Verify Pipeline Ready (1 min)
```bash
# Check pipeline status
mekong crm:status

# Expected output:
# ┌─────────────────────────────────┐
# │ Sales Pipeline: ACTIVE          │
# │ Stages: 5                       │
# │ Leads: 1                        │
# │ Qualified: 1                    │
# └─────────────────────────────────┘
```

---

## ✅ Success Criteria

- [ ] `mekong crm:status` shows "ACTIVE"
- [ ] 5 pipeline stages configured
- [ ] Lead scoring rules applied
- [ ] Test lead score ≥ 60
- [ ] First proposal generated

---

## 📋 Templates

### Lead Scoring Config (copy to `config/scoring.yaml`)
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

### Proposal Template (auto-generated)
```
/proposals/
├── templates/
│   ├── warrior.md      # $2K/mo tier
│   ├── general.md      # $5K/mo tier
│   └── tuong-quan.md   # Equity tier
└── [client-name].pdf
```

---

## 🔧 Troubleshooting

| Error | Fix |
|-------|-----|
| `mekong: command not found` | `pip install mekong-cli` |
| `Database connection failed` | `mekong db:connect --url $DATABASE_URL` |
| `Scoring rules not applied` | `mekong crm:scoring --reset && mekong crm:scoring --preset agencyos` |

---

## 🔗 Next Workflow

After pipeline ready → [Client Onboarding](/docs/workflows/client-onboarding)

---

**🏯 "Họ WIN → Mình WIN"**
