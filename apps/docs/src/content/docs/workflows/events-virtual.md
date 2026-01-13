---
title: "Virtual Events Workflow"
description: "Events and webinars for community building"
section: "workflows"
order: 30
published: true
ai_executable: true
estimated_time: "12 minutes"
---

# 🎤 Virtual Events Workflow

> **WIN-WIN-WIN**: Attendee WIN (value) → Agency WIN (leads) → Owner WIN (authority)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/events-virtual
```

---

## ⚡ Step-by-Step Execution

### Step 1: Create Event (3 min)
```bash
mekong event:create \
  --title "Agency Automation Masterclass" \
  --type "webinar" \
  --date "2026-02-01" \
  --duration "60min"

# Expected: ✅ Event created
```

### Step 2: Setup Landing Page (3 min)
```bash
mekong event:landing \
  --event "agency-automation-masterclass" \
  --template "webinar"

# Expected: ✅ Registration page live
```

### Step 3: Configure Email Sequence (3 min)
```bash
mekong event:emails \
  --confirm "immediate" \
  --reminder-1 "24h before" \
  --reminder-2 "1h before" \
  --followup "24h after"

# Expected: ✅ 4-email sequence configured
```

### Step 4: Go Live (3 min)
```bash
mekong event:stream \
  --platform "zoom" \
  --record true \
  --chat true

# Expected: ✅ Stream ready
```

---

## ✅ Success Criteria

- [ ] Landing page converting 30%+
- [ ] 50%+ attendance rate
- [ ] 60%+ engagement
- [ ] 10%+ lead conversion

---

**🏯 "Họ WIN → Mình WIN"**
