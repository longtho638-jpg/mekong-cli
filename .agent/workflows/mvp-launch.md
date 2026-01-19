---
description: How to launch a minimum viable product quickly and effectively
---

# 🚀 MVP Launch Workflow

Launch your product in 30 days or less with validated market fit.

## 🤖 Quick Execute
```bash
Execute workflow: https://agencyos.network/docs/workflows/mvp-launch
```

## ⚡ Step-by-Step Execution

### Step 1: Define MVP Scope (Day 1-2)
// turbo
```bash
# Generate MVP feature matrix
mekong mvp:scope --product "agency-crm"

# Output:
# MUST HAVE (Week 1-2):
# - Core feature A
# - Core feature B
# 
# SHOULD HAVE (Week 3):
# - Enhancement C
# 
# WON'T HAVE (Post-MVP):
# - Feature D, E, F
```

### Step 2: Set Up Tech Stack (Day 3-5)
// turbo
```bash
# Initialize project with standard stack
mekong mvp:init --stack "next-supabase-vercel"

# Creates:
# - Next.js 16 frontend
# - Supabase backend
# - Vercel deployment
# - CI/CD pipeline
```

### Step 3: Generate UI/UX (Day 6-10)
// turbo
```bash
# AI-generate component library
mekong mvp:ui --style "dark-premium"

# Generates:
# - Design system tokens
# - Core components
# - Page layouts
# - Responsive breakpoints
```

### Step 4: Implement Core Features (Day 11-20)
// turbo
```bash
# Track feature implementation
mekong mvp:track

# Dashboard shows:
# - Features: X/Y completed
# - Tests: X% coverage
# - Blockers: N items
```

### Step 5: Launch to Beta Users (Day 21-25)
// turbo
```bash
# Deploy to beta environment
mekong mvp:beta-launch --users 20

# Actions:
# - Deploy to staging
# - Invite beta users
# - Set up feedback channel
# - Enable analytics
```

### Step 6: Iterate on Feedback (Day 26-30)
// turbo
```bash
# Process user feedback
mekong mvp:feedback --analyze

# Outputs:
# - Top 5 feature requests
# - Critical bugs
# - UX improvements
# - NPS score
```

## 📋 MVP Templates

### 30-Day Timeline
```yaml
mvp_timeline:
  week_1:
    - Scope definition
    - Tech stack setup
    - Database schema
  week_2:
    - Core feature development
    - UI components
  week_3:
    - Integration
    - Testing
    - Polish
  week_4:
    - Beta launch
    - Feedback collection
    - Iteration
```

### Launch Checklist
```yaml
launch_checklist:
  pre_launch:
    - [ ] Domain configured
    - [ ] SSL enabled
    - [ ] Analytics installed
    - [ ] Error monitoring active
    - [ ] Backup system working
  launch_day:
    - [ ] Deploy to production
    - [ ] Announce on social
    - [ ] Email waitlist
    - [ ] Monitor metrics
  post_launch:
    - [ ] Collect feedback
    - [ ] Fix critical bugs
    - [ ] Plan v1.1
```

### Success Metrics
```yaml
mvp_success:
  activation: "20+ beta signups"
  retention: ">50% return in week 2"
  nps: ">30 score"
  revenue: "$1 earned (validation)"
```

## ✅ Success Criteria
- [ ] MVP scope defined and approved
- [ ] Tech stack deployed
- [ ] Core features implemented
- [ ] Beta users onboarded
- [ ] Feedback loop established

## 🔗 Next Workflow
After MVP launch: `/retention-plays` or `/sales-pipeline`

## 🏯 Binh Pháp Alignment
"兵贵神速" (Speed is the essence of war) - Ship fast, learn faster.
