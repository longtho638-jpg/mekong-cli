---
title: "Content Calendar Workflow"
description: "Plan and execute content marketing for agencies"
section: "workflows"
order: 13
published: true
ai_executable: true
estimated_time: "10 minutes"
---

# 📅 Content Calendar Workflow

> **WIN-WIN-WIN**: Audience WIN (value) → Agency WIN (leads) → Owner WIN (authority)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/content-calendar
```

---

## ⚡ Step-by-Step Execution

### Step 1: Initialize Calendar (2 min)
```bash
mekong content:init --platform "notion"

# Expected: ✅ Content calendar created
```

### Step 2: Setup Content Pillars (3 min)
```bash
mekong content:pillars \
  --pillar "educational" --percent 40 \
  --pillar "case-studies" --percent 25 \
  --pillar "behind-scenes" --percent 20 \
  --pillar "promotional" --percent 15

# Expected: ✅ 4 pillars configured
```

### Step 3: Generate Weekly Schedule (2 min)
```bash
mekong content:schedule \
  --mon "blog" \
  --tue "twitter-thread" \
  --wed "linkedin-carousel" \
  --thu "youtube" \
  --fri "newsletter"

# Expected: ✅ 5-day schedule created
```

### Step 4: Create First Week Content (3 min)
```bash
mekong content:generate \
  --week 1 \
  --topic "agency automation"

# Expected: ✅ 5 content pieces drafted
```

---

## ✅ Success Criteria

- [ ] Calendar tool connected
- [ ] 4 content pillars defined
- [ ] Weekly publishing rhythm
- [ ] 30+ days content scheduled

---

**🏯 "Họ WIN → Mình WIN"**
