---
title: "Video Workflow"
description: "Video production for agency marketing"
section: "workflows"
order: 14
published: true
ai_executable: true
estimated_time: "15 minutes"
---

# 🎬 Video Workflow

> **WIN-WIN-WIN**: Audience WIN (value) → Agency WIN (reach) → Owner WIN (brand)

---

## 🤖 Quick Execute

```
Execute workflow: https://agencyos.network/docs/workflows/video-workflow
```

---

## ⚡ Step-by-Step Execution

### Step 1: Create Script (5 min)
```bash
mekong video:script \
  --topic "How to set up a sales pipeline" \
  --format "tutorial" \
  --duration "5min"

# Expected: ✅ Script generated
```

### Step 2: Generate Voiceover (3 min)
```bash
mekong video:voice \
  --script "./scripts/sales-pipeline.md" \
  --voice "elevenlabs:josh"

# Expected: ✅ Voiceover audio created
```

### Step 3: Create Video (5 min)
```bash
mekong video:render \
  --audio "./audio/sales-pipeline.mp3" \
  --template "tutorial" \
  --output "./videos/sales-pipeline.mp4"

# Expected: ✅ Video rendered (1080p)
```

### Step 4: Publish (2 min)
```bash
mekong video:publish \
  --file "./videos/sales-pipeline.mp4" \
  --youtube --tiktok --reels

# Expected: ✅ Published to 3 platforms
```

---

## ✅ Success Criteria

- [ ] Script under 500 words
- [ ] Voiceover clear and professional
- [ ] Video under 5 minutes
- [ ] Published to 3+ platforms

---

**🏯 "Họ WIN → Mình WIN"**
