---
description: How to build a world-class customer success program
---

# 🎯 Customer Success Workflow

Build proactive customer success operations that drive retention and expansion.

## 🤖 Quick Execute
```bash
Execute workflow: https://agencyos.network/docs/workflows/customer-success
```

## ⚡ Step-by-Step Execution

### Step 1: Define Success Metrics (3 min)
// turbo
```bash
# Configure customer success KPIs
mekong cs:metrics --init

# Key Metrics:
# - NPS (Net Promoter Score)
# - CSAT (Customer Satisfaction)
# - CES (Customer Effort Score)
# - Time to Value
# - Health Score
```

### Step 2: Create Customer Segments (3 min)
// turbo
```bash
# Segment customers by value and risk
mekong cs:segment

# Segments:
# - Enterprise (High touch)
# - Growth (Mid touch)
# - Starter (Low touch/self-serve)
```

### Step 3: Set Up Success Playbooks (5 min)
// turbo
```bash
# Configure automated success playbooks
mekong cs:playbooks --enable all

# Playbooks:
# - Onboarding (Day 1-30)
# - Adoption (Day 31-90)
# - Expansion (Day 91+)
# - Renewal (60 days before)
# - Risk Mitigation (health < 50)
```

### Step 4: Configure Health Alerts (2 min)
// turbo
```bash
# Set up proactive alerts
mekong cs:alerts --configure

# Alert Triggers:
# - Login drop > 50%
# - Feature usage decline
# - Support ticket spike
# - Payment failure
```

### Step 5: Launch NPS Survey (3 min)
// turbo
```bash
# Deploy NPS survey automation
mekong cs:nps --schedule quarterly

# Survey Points:
# - Post-onboarding (Day 30)
# - Quarterly check-in
# - Post-support interaction
# - Renewal period
```

### Step 6: Set Up QBR Templates (3 min)
// turbo
```bash
# Create quarterly business review templates
mekong cs:qbr --template

# QBR Agenda:
# 1. Goals recap
# 2. Metrics review
# 3. Product roadmap
# 4. Success stories
# 5. Next quarter planning
```

## 📋 Customer Success Templates

### Touch Model
```yaml
touch_model:
  enterprise: # >$10K MRR
    onboarding: "White glove"
    check_ins: "Weekly"
    qbrs: "Quarterly"
    csm_ratio: "1:20"
  growth: # $1K-$10K MRR
    onboarding: "Guided"
    check_ins: "Monthly"
    qbrs: "Semi-annual"
    csm_ratio: "1:50"
  starter: # <$1K MRR
    onboarding: "Self-serve"
    check_ins: "Automated"
    qbrs: "On-demand"
    csm_ratio: "1:200"
```

### Health Score Formula
```yaml
health_score:
  product_usage: 30%     # Feature adoption
  engagement: 25%        # Login frequency
  support: 20%           # Ticket trends
  growth: 15%            # Expansion signals
  relationship: 10%      # CSM sentiment
```

### Expansion Triggers
```yaml
expansion_signals:
  - User limit approaching
  - Feature upgrade requests
  - Multi-team adoption
  - Positive NPS/CSAT
  - Quick support resolution
```

## ✅ Success Criteria
- [ ] Success metrics defined
- [ ] Customer segments created
- [ ] Playbooks activated
- [ ] Health alerts configured
- [ ] NPS survey deployed
- [ ] QBR templates ready

## 🔗 Next Workflow
After customer success: `/retention-plays` or `/community-guild`

## 🏯 Binh Pháp Alignment
"上兵伐謀" (Supreme excellence is winning without fighting) - The best retention is proactive success.
