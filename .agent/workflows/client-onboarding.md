---
description: How to onboard new clients with AgencyOS in 20 minutes
---

# 🚀 Client Onboarding Workflow

Onboard clients professionally in 7 steps (~20 min total).

## Quick Execute
```bash
Execute workflow: https://agencyos.network/docs/workflows/client-onboarding
```

## ⚡ Step-by-Step Execution

### Step 1: Create Client Workspace (3 min)
// turbo
```bash
mekong client:create \
  --name "ABC Corp" \
  --tier "warrior" \
  --contact "john@abccorp.com"

# Expected: ✅ Client workspace created: /clients/abc-corp/
```

### Step 2: Send Welcome Email (2 min)
// turbo
```bash
mekong email:send \
  --template "welcome-warrior" \
  --to "john@abccorp.com" \
  --client "ABC Corp"

# Expected: ✅ Welcome email queued
```

### Step 3: Create Client Portal Access (3 min)
// turbo
```bash
mekong portal:invite \
  --client "ABC Corp" \
  --email "john@abccorp.com" \
  --role "owner"

# Expected: ✅ Portal invite sent
# URL: https://portal.agencyos.network/abc-corp
```

### Step 4: Setup First Workflow (5 min)
// turbo
```bash
mekong workflow:assign \
  --client "ABC Corp" \
  --workflow "sales-pipeline" \
  --deadline "7 days"

# Expected: ✅ Workflow assigned, due in 7 days
```

### Step 5: Schedule Kickoff Call (2 min)
// turbo
```bash
mekong calendar:create \
  --title "Kickoff Call - ABC Corp" \
  --attendees "john@abccorp.com" \
  --duration "45min" \
  --link "auto"

# Expected: ✅ Meeting scheduled with Zoom link
```

### Step 6: Set Success Metrics (3 min)
// turbo
```bash
mekong client:goals \
  --client "ABC Corp" \
  --metric "time_to_value" --target "7 days" \
  --metric "first_win" --target "30 days" \
  --metric "nps_score" --target "50+"

# Expected: ✅ Success metrics configured
```

### Step 7: Verify Onboarding Complete (2 min)
// turbo
```bash
mekong client:status --client "ABC Corp"
```

## ✅ Success Criteria
- [ ] Client workspace created
- [ ] Welcome email sent
- [ ] Portal access granted
- [ ] First workflow assigned
- [ ] Kickoff call scheduled
- [ ] Success metrics defined

## 📋 90-Day Checklist Template

### Week 1
- [ ] Welcome email sent (Day 1)
- [ ] Portal access granted (Day 1)
- [ ] Kickoff call completed (Day 2-3)
- [ ] Goals documented (Day 3)
- [ ] First deliverable shipped (Day 5)

### Week 2-4
- [ ] 3+ workflows active
- [ ] Weekly check-in scheduled
- [ ] First success metric hit

### Month 2
- [ ] Referral ask made
- [ ] Case study draft started
- [ ] Upsell conversation

### Month 3
- [ ] Annual contract discussion
- [ ] NPS survey sent (target: 50+)
- [ ] Expansion proposal

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Client already exists | `mekong client:list` |
| Email failed | Check `.env` config |
| Portal invite expired | `mekong portal:resend --client "ABC Corp"` |

## 🔗 Next Workflow
After onboarding → `/retention-plays`

## 🏯 Binh Pháp Alignment
"Họ WIN → Mình WIN" - Client success is your success.
