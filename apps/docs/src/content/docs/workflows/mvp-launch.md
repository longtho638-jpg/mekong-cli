---
title: "MVP Launch Workflow"
description: "Launch minimum viable products for startup clients"
section: "workflows"
order: 8
published: true
ai_executable: true
estimated_time: "25 minutes"
---

# 🚀 MVP Launch Workflow

> **WIN-WIN-WIN**: Client WIN (product) → Agency WIN (expertise) → Owner WIN (equity)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/mvp-launch
```

---

## ⚡ Step-by-Step Execution

### Step 1: Initialize Project (3 min)
```bash
# Create MVP project structure
mekong mvp:init \
  --name "abc-corp-mvp" \
  --stack "nextjs,supabase,stripe"

# Expected: ✅ Project scaffolded
```

### Step 2: Setup Database (5 min)
```bash
# Initialize Supabase
mekong db:init --provider supabase

# Create schema
mekong db:migrate --file "./schema/mvp.sql"

# Expected: ✅ Database ready
```

### Step 3: Generate Core Features (10 min)
```bash
# Create authentication
mekong feature:auth --provider "supabase"

# Create landing page
mekong feature:landing --template "saas"

# Create pricing page
mekong feature:pricing --tiers 3

# Expected: ✅ 3 core features ready
```

### Step 4: Deploy Preview (3 min)
```bash
# Deploy to preview
mekong deploy:preview

# Expected output:
# ┌─────────────────────────────────┐
# │ Preview URL:                    │
# │ https://abc-mvp.vercel.app      │
# └─────────────────────────────────┘
```

### Step 5: User Testing (2 min)
```bash
# Send to test users
mekong test:invite \
  --emails "tester1@example.com,tester2@example.com" \
  --url "https://abc-mvp.vercel.app"

# Expected: ✅ 2 test invites sent
```

### Step 6: Production Launch (2 min)
```bash
# Deploy to production
mekong deploy:production

# Setup analytics
mekong analytics:init --provider "posthog"

# Expected: ✅ MVP LIVE!
```

---

## ✅ Success Criteria

- [ ] 6-week timeline met
- [ ] Core features working
- [ ] 50+ first users
- [ ] Initial revenue ($1K+)

---

## 📋 6-Week Timeline Template

```yaml
# mvp-timeline.yaml
week_1:
  - Problem validation
  - User interviews (5+)
  - Competitor analysis
  
week_2:
  - Wireframes
  - UI design
  - Tech stack finalized
  
week_3_4:
  - Core development
  - Database setup
  - API integration
  
week_5:
  - Testing
  - Bug fixes
  - Performance optimization
  
week_6:
  - Launch prep
  - Analytics setup
  - Go live!
```

---

## 🔗 Next Phase

→ [Phase 2: Scaling Workflows](/docs/workflows#-phase-2-scaling)

---

**🏯 "Họ WIN → Mình WIN"**
