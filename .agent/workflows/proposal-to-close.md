---
description: How to generate proposals and close deals with AgencyOS
---

# 📝 Proposal to Close Workflow

Generate proposals and close deals in 6 steps (~10 min).

## 🤖 Quick Execute
```bash
mekong proposal:create --client "ABC Corp" --tier "warrior"
```

## ⚡ Step-by-Step Execution

### Step 1: Gather Client Info (2 min)
// turbo
```bash
mekong crm:get "ABC Corp"

# Output: Name, budget, timeline, needs
```

### Step 2: Select Proposal Template (1 min)
// turbo
```bash
mekong proposal:templates

# Output:
# 1. warrior - $2,000/mo (Bootstrap)
# 2. general - $5,000/mo (Growth)
# 3. tuong-quan - Equity (Venture Studio)
```

### Step 3: Generate Proposal (3 min)
// turbo
```bash
mekong proposal:create \
  --client "ABC Corp" \
  --tier "warrior" \
  --problem "Need to scale lead generation" \
  --solution "AgencyOS CRM + automation" \
  --timeline "3 months"

# Expected: ✅ Proposal created: ./proposals/abc-corp-warrior.pdf
```

### Step 4: Send Proposal (1 min)
// turbo
```bash
mekong proposal:send \
  --to "john@abccorp.com" \
  --file "./proposals/abc-corp-warrior.pdf" \
  --track true

# Expected: ✅ Proposal sent, tracking enabled
```

### Step 5: Setup Follow-up Sequence (2 min)
// turbo
```bash
mekong reminder:create \
  --client "ABC Corp" \
  --day 2 "Check if proposal received" \
  --day 5 "Answer questions call" \
  --day 7 "Decision ask"

# Expected: ✅ 3 reminders scheduled
```

### Step 6: Close the Deal (1 min)
// turbo
```bash
mekong contract:create \
  --client "ABC Corp" \
  --template "msa-warrior" \
  --sign "docusign"

# Expected: ✅ Contract sent for signature
```

## ✅ Success Criteria
- [ ] Proposal generated < 24 hours
- [ ] Tracking shows proposal opened
- [ ] Follow-up sequence active
- [ ] Contract signed within 10 days

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

## 🔧 Objection Handling

| Objection | Command | Response |
|-----------|---------|----------|
| "Too expensive" | `mekong roi:calculate --client "ABC Corp"` | Show ROI |
| "Need more time" | `mekong proposal:extend --days 3` | Give deadline |
| "Comparing options" | `mekong compare:value --vs "competitor"` | Show value |

```bash
# Log objection for analysis
mekong crm:objection \
  --client "ABC Corp" \
  --type "price" \
  --response "ROI calculation: $2K → $10K value"
```

## 🔗 Next Workflow
After close → `/client-onboarding`

## 🏯 Binh Pháp Alignment
"Họ WIN → Mình WIN" - Client success is your success.
