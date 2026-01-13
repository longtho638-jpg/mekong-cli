---
title: "HR Hiring Workflow"
description: "Build your agency team efficiently"
section: "workflows"
order: 11
published: true
ai_executable: true
estimated_time: "15 minutes"
---

# 👥 HR Hiring Workflow

> **WIN-WIN-WIN**: Candidate WIN (opportunity) → Agency WIN (talent) → Owner WIN (capacity)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/hr-hiring
```

---

## ⚡ Step-by-Step Execution

### Step 1: Define Role (3 min)
```bash
mekong hr:role \
  --title "Account Manager" \
  --type "full-time" \
  --salary "50000-70000" \
  --location "remote"

# Expected: ✅ Role created
```

### Step 2: Create Job Posting (3 min)
```bash
mekong hr:posting \
  --role "Account Manager" \
  --template "agency"

# Expected: ✅ Job posting generated
```

### Step 3: Setup Interview Pipeline (3 min)
```bash
mekong hr:pipeline \
  --stage "resume" \
  --stage "phone-screen" \
  --stage "skills-test" \
  --stage "final-interview" \
  --stage "offer"

# Expected: ✅ 5-stage pipeline created
```

### Step 4: Post to Job Boards (3 min)
```bash
mekong hr:post \
  --boards "linkedin,indeed,wellfound"

# Expected: ✅ Posted to 3 boards
```

### Step 5: Track Candidates (3 min)
```bash
mekong hr:candidates --list

# Shows: Name, Stage, Score, Next Action
```

---

## ✅ Success Criteria

- [ ] Role defined with salary range
- [ ] Job posting published
- [ ] 5-stage interview pipeline
- [ ] 10+ qualified applicants

---

**🏯 "Họ WIN → Mình WIN"**
