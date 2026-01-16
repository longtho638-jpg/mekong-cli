---
description: How to build and scale your agency team
---

# 👥 HR Hiring Workflow

Recruit, onboard, and retain top talent for your agency.

## 🤖 Quick Execute
```bash
Execute workflow: https://agencyos.network/docs/workflows/hr-hiring
```

## ⚡ Step-by-Step Execution

### Step 1: Define Role Requirements (5 min)
// turbo
```bash
# Create job requisition
mekong hr:requisition --role "Senior Developer" --level IC3

# Role Definition:
# - Title and level
# - Key responsibilities
# - Required skills
# - Compensation range
```

### Step 2: Generate Job Description (3 min)
// turbo
```bash
# AI-generate job posting
mekong hr:job-post --role "Senior Developer" --output ./jobs/senior-dev.md

# Includes:
# - Company culture section
# - Role specifics
# - Requirements
# - Benefits
```

### Step 3: Set Up Interview Pipeline (3 min)
// turbo
```bash
# Configure interview stages
mekong hr:pipeline --stages "screen,technical,culture,final"

# Stage breakdown:
# 1. Phone screen (30 min)
# 2. Technical assessment (60 min)
# 3. Culture fit (45 min)
# 4. Final/offer (30 min)
```

### Step 4: Create Scorecard (2 min)
// turbo
```bash
# Generate interview scorecard
mekong hr:scorecard --role "Senior Developer"

# Scoring Areas:
# - Technical skills (1-5)
# - Problem solving (1-5)
# - Communication (1-5)
# - Culture fit (1-5)
# - Growth potential (1-5)
```

### Step 5: Configure Onboarding (5 min)
// turbo
```bash
# Set up 90-day onboarding plan
mekong hr:onboarding --template developer --days 90

# Creates:
# - Week 1: Setup & orientation
# - Week 2-4: Training & shadowing
# - Month 2: First projects
# - Month 3: Independent delivery
```

## 📋 HR Templates

### Role Levels
```yaml
levels:
  IC1: Junior (0-2 years)
  IC2: Mid (2-4 years)
  IC3: Senior (4-7 years)
  IC4: Staff (7+ years)
  M1: Manager
  M2: Director
```

### Compensation Bands
```yaml
# Vietnam market rates (2026)
compensation_vnd:
  IC1: 15M-25M/month
  IC2: 25M-40M/month
  IC3: 40M-60M/month
  IC4: 60M-100M/month
  M1: 50M-80M/month
  M2: 80M-150M/month
```

### Onboarding Checklist
```yaml
onboarding_week1:
  - [ ] Laptop & accounts setup
  - [ ] Slack/Discord intro
  - [ ] 1:1 with manager
  - [ ] Team introductions
  - [ ] Codebase walkthrough
  - [ ] First PR submitted
```

## ✅ Success Criteria
- [ ] Role requirements documented
- [ ] Job description approved
- [ ] Interview pipeline configured
- [ ] Scorecard template created
- [ ] Onboarding plan ready

## 🔗 Next Workflow
After HR hiring: `/retention-plays` (to retain talent)

## 🏯 Binh Pháp Alignment
"将者，智、信、仁、勇、严也" (A general needs wisdom, trust, benevolence, courage, discipline) - Hire for character, train for skill.
