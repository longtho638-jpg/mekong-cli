---
title: "Retention Plays Workflow"
description: "Keep clients longer and reduce churn"
section: "workflows"
order: 5
published: true
ai_executable: true
estimated_time: "10 minutes"
---

# 🔄 Retention Plays Workflow

> **WIN-WIN-WIN**: Client WIN (success) → Agency WIN (retention) → Owner WIN (LTV)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/retention-plays
```

---

## ⚡ Step-by-Step Execution

### Step 1: Setup Health Monitoring (3 min)
```bash
# Enable client health scoring
mekong health:init

# Configure alert thresholds
mekong health:config \
  --green 80 \
  --yellow 50 \
  --red 0

# Expected: ✅ Health monitoring active
```

### Step 2: Create Alert Rules (2 min)
```bash
# Setup churn signals
mekong health:alerts \
  --trigger "no_login_7_days" --action "email_checkin" \
  --trigger "support_spike" --action "manager_call" \
  --trigger "usage_decline" --action "success_review" \
  --trigger "payment_failed" --action "urgent_outreach"

# Expected: ✅ 4 alert rules created
```

### Step 3: Setup Save Plays (3 min)
```bash
# Create retention playbooks
mekong retention:play \
  --name "green_expansion" \
  --trigger "score >= 80" \
  --action "upsell_call"

mekong retention:play \
  --name "yellow_rescue" \
  --trigger "score 50-79" \
  --action "monthly_checkin"

mekong retention:play \
  --name "red_save" \
  --trigger "score < 50" \
  --action "executive_escalation"

# Expected: ✅ 3 playbooks active
```

### Step 4: Test Health Check (2 min)
```bash
# Run health check on all clients
mekong health:check --all

# Expected output:
# ┌─────────────────────────────────┐
# │ Health Report                   │
# │ Green: 80%  Yellow: 15%  Red: 5%│
# └─────────────────────────────────┘
```

---

## ✅ Success Criteria

- [ ] Health monitoring active
- [ ] 4 alert rules configured
- [ ] 3 retention playbooks created
- [ ] Churn < 3% monthly

---

## 📋 Retention Playbook Template

```yaml
# config/retention.yaml
playbooks:
  green_expansion:
    trigger: "health_score >= 80"
    cadence: quarterly
    actions:
      - expansion_conversation
      - referral_ask
      - case_study_request
      
  yellow_rescue:
    trigger: "health_score 50-79"
    cadence: monthly
    actions:
      - checkin_call
      - training_offer
      - usage_optimization
      
  red_save:
    trigger: "health_score < 50"
    cadence: weekly
    actions:
      - executive_escalation
      - save_offer
      - root_cause_analysis
```

---

## 🔗 Next Workflow

→ [Binh Pháp Analysis](/docs/workflows/binh-phap-analysis)

---

**🏯 "Họ WIN → Mình WIN"**
