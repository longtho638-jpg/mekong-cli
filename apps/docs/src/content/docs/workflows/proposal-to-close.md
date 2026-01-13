---
title: "Proposal to Close Workflow"
description: "Win deals with professional proposals"
section: "workflows"
order: 3
published: true
ai_executable: true
estimated_time: "10 minutes"
---

# 📝 Proposal to Close Workflow

> **WIN-WIN-WIN**: Prospect WIN (clarity) → Agency WIN (deal) → Owner WIN (revenue)

---

## 🤖 Quick Execute

**Paste this to your IDE:**
```
Execute workflow: https://agencyos.network/docs/workflows/proposal-to-close
```

---

## ⚡ Step-by-Step Execution

### Step 1: Gather Client Info (2 min)
```bash
# Get lead details
mekong crm:get "ABC Corp"

# Expected output: Name, budget, timeline, needs
```

### Step 2: Select Proposal Template (1 min)
```bash
# List available templates
mekong proposal:templates

# Output:
# 1. warrior    - $2,000/mo (Bootstrap)
# 2. general    - $5,000/mo (Growth)
# 3. tuong-quan - Equity (Venture Studio)
```

### Step 3: Generate Proposal (3 min)
```bash
# Create proposal
mekong proposal:create \
  --client "ABC Corp" \
  --tier "warrior" \
  --problem "Need to scale lead generation" \
  --solution "AgencyOS CRM + automation" \
  --timeline "3 months"

# Expected: ✅ Proposal created: ./proposals/abc-corp-warrior.pdf
```

### Step 4: Send Proposal (1 min)
```bash
# Email proposal with tracking
mekong proposal:send \
  --to "john@abccorp.com" \
  --file "./proposals/abc-corp-warrior.pdf" \
  --track true

# Expected: ✅ Proposal sent, tracking enabled
```

### Step 5: Setup Follow-up Sequence (2 min)
```bash
# Create follow-up reminders
mekong reminder:create \
  --client "ABC Corp" \
  --day 2 "Check if proposal received" \
  --day 5 "Answer questions call" \
  --day 7 "Decision ask"

# Expected: ✅ 3 reminders scheduled
```

### Step 6: Close the Deal (1 min)
```bash
# When ready to close
mekong contract:create \
  --client "ABC Corp" \
  --template "msa-warrior" \
  --sign "docusign"

# Expected: ✅ Contract sent for signature
```

---

## ✅ Success Criteria

- [ ] Proposal generated in < 24 hours
- [ ] Tracking shows proposal opened
- [ ] Follow-up sequence active
- [ ] Contract signed within 10 days

---

## 📋 Proposal Template Structure

```markdown
# Proposal for [Client Name]

## 1. Executive Summary
- Your problem: [their words]
- Our solution: [clear value]
- Investment: [transparent pricing]

## 2. Scope of Work
- Deliverable 1
- Deliverable 2
- Timeline: X weeks

## 3. Pricing
| Tier | Price | Includes |
|------|-------|----------|
| Warrior | $2,000/mo | Core + Support |

## 4. Social Proof
- Case study 1
- Testimonial

## 5. Next Steps
1. Sign contract
2. Kickoff call
3. First deliverable in 7 days
```

---

## 🔧 Objection Handling

```bash
# Log objection for analysis
mekong crm:objection \
  --client "ABC Corp" \
  --type "price" \
  --response "ROI calculation: $2K → $10K value"
```

| Objection | Response Command |
|-----------|------------------|
| "Too expensive" | `mekong roi:calculate --client "ABC Corp"` |
| "Need to think" | `mekong proposal:extend --days 3` |
| "Competitor cheaper" | `mekong compare:value --vs "competitor"` |

---

## 🔗 Next Workflow

After close → [Client Onboarding](/docs/workflows/client-onboarding)

---

**🏯 "Họ WIN → Mình WIN"**
