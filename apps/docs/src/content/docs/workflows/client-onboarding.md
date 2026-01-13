---
title: "Client Onboarding Workflow"
description: "First 90 days client success workflow"
section: "workflows"
order: 2
published: true
ai_executable: true
estimated_time: "20 minutes"
---

# 🚀 Client Onboarding Workflow

> **WIN-WIN-WIN**: Client WIN (quick value) → Agency WIN (retention) → Owner WIN (LTV)

---

## 🤖 Quick Execute

**Paste this to your IDE:**
```
Execute workflow: https://agencyos.network/docs/workflows/client-onboarding
```

---

## ⚡ Step-by-Step Execution

### Step 1: Create Client Workspace (3 min)
```bash
# Create new client workspace
mekong client:create \
  --name "ABC Corp" \
  --tier "warrior" \
  --contact "john@abccorp.com"

# Expected: ✅ Client workspace created: /clients/abc-corp/
```

### Step 2: Send Welcome Email (2 min)
```bash
# Trigger welcome email sequence
mekong email:send \
  --template "welcome-warrior" \
  --to "john@abccorp.com" \
  --client "ABC Corp"

# Expected: ✅ Welcome email queued
```

### Step 3: Create Client Portal Access (3 min)
```bash
# Generate portal credentials
mekong portal:invite \
  --client "ABC Corp" \
  --email "john@abccorp.com" \
  --role "owner"

# Expected: ✅ Portal invite sent
# URL: https://portal.agencyos.network/abc-corp
```

### Step 4: Setup First Workflow (5 min)
```bash
# Initialize client's first workflow
mekong workflow:assign \
  --client "ABC Corp" \
  --workflow "sales-pipeline" \
  --deadline "7 days"

# Expected: ✅ Workflow assigned, due in 7 days
```

### Step 5: Schedule Kickoff Call (2 min)
```bash
# Create calendar event
mekong calendar:create \
  --title "Kickoff Call - ABC Corp" \
  --attendees "john@abccorp.com" \
  --duration "45min" \
  --link "auto"

# Expected: ✅ Meeting scheduled with Zoom link
```

### Step 6: Set Success Metrics (3 min)
```bash
# Define 90-day success metrics
mekong client:goals \
  --client "ABC Corp" \
  --metric "time_to_value" --target "7 days" \
  --metric "first_win" --target "30 days" \
  --metric "nps_score" --target "50+"

# Expected: ✅ Success metrics configured
```

### Step 7: Verify Onboarding Complete (2 min)
```bash
# Check onboarding status
mekong client:status "ABC Corp"

# Expected output:
# ┌─────────────────────────────────┐
# │ Client: ABC Corp                │
# │ Status: ONBOARDING              │
# │ Day: 1/90                       │
# │ Checklist: 6/6 ✅               │
# └─────────────────────────────────┘
```

---

## ✅ Success Criteria

- [ ] Client workspace created
- [ ] Welcome email sent
- [ ] Portal access granted
- [ ] First workflow assigned
- [ ] Kickoff call scheduled
- [ ] Success metrics defined

---

## 📋 90-Day Checklist Template

```markdown
## Week 1
- [ ] Welcome email sent (Day 1)
- [ ] Portal access granted (Day 1)
- [ ] Kickoff call completed (Day 2-3)
- [ ] Goals documented (Day 3)
- [ ] First deliverable shipped (Day 5)

## Week 2-4
- [ ] 3+ workflows active
- [ ] Weekly check-in scheduled
- [ ] First success metric hit

## Month 2
- [ ] Referral ask made
- [ ] Case study draft started
- [ ] Upsell conversation

## Month 3
- [ ] Annual contract discussion
- [ ] NPS survey sent (target: 50+)
- [ ] Expansion proposal
```

---

## 🔧 Troubleshooting

| Error | Fix |
|-------|-----|
| `Client already exists` | `mekong client:list` to check |
| `Email failed to send` | Check SMTP config in `.env` |
| `Portal invite expired` | `mekong portal:resend --client "ABC Corp"` |

---

## 🔗 Next Workflow

After onboarding → [Retention Plays](/docs/workflows/retention-plays)

---

**🏯 "Họ WIN → Mình WIN"**
