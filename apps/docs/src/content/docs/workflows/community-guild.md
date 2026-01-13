---
title: "Community Guild Workflow"
description: "Build and manage member communities"
section: "workflows"
order: 31
published: true
ai_executable: true
estimated_time: "15 minutes"
---

# 🤝 Community Guild Workflow

> **WIN-WIN-WIN**: Member WIN (network) → Agency WIN (retention) → Owner WIN (NRR)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/community-guild
```

---

## ⚡ Step-by-Step Execution

### Step 1: Create Community (3 min)
```bash
mekong community:create \
  --name "AgencyOS Guild" \
  --platform "discord"

# Expected: ✅ Community server created
```

### Step 2: Setup Channels (4 min)
```bash
mekong community:channels \
  --channel "announcements" --type "read-only" \
  --channel "introductions" \
  --channel "wins" \
  --channel "help" \
  --channel "off-topic"

# Expected: ✅ 5 channels created
```

### Step 3: Create Member Tiers (4 min)
```bash
mekong community:tiers \
  --tier "member" --access "general" \
  --tier "champion" --access "vip" \
  --tier "mentor" --access "all"

# Expected: ✅ 3-tier structure created
```

### Step 4: Setup Gamification (4 min)
```bash
mekong community:gamification \
  --points "post:1,reply:2,win:10" \
  --levels "5,25,100,500"

# Expected: ✅ Points and levels active
```

---

## ✅ Success Criteria

- [ ] Community platform live
- [ ] 70%+ monthly active
- [ ] Member NRR 120%+
- [ ] NPS 60+

---

**🏯 "Họ WIN → Mình WIN"**
