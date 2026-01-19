---
description: How to plan and execute video production at scale
---

# 🎬 Video Workflow

Streamline video production from concept to distribution.

## 🤖 Quick Execute
```bash
Execute workflow: https://agencyos.network/docs/workflows/video-workflow
```

## ⚡ Step-by-Step Execution

### Step 1: Initialize Video Project (2 min)
// turbo
```bash
# Create video project structure
mekong video:init --project "product-demo"

# Creates:
# /video/product-demo/
# ├── scripts/
# ├── assets/
# ├── exports/
# └── project.yaml
```

### Step 2: Generate Script (5 min)
// turbo
```bash
# AI-generate video script
mekong video:script --topic "Product Demo" --duration 90

# Output:
# - Hook (0-10s)
# - Problem (10-30s)
# - Solution (30-60s)
# - CTA (60-90s)
```

### Step 3: Plan Shots (3 min)
// turbo
```bash
# Create shot list from script
mekong video:shots --script ./scripts/demo.md

# Output: Shot list with timing and requirements
```

### Step 4: Process Raw Footage (5 min)
// turbo
```bash
# Transcode and organize footage
mekong video:process --input ./raw --output ./processed

# Uses ffmpeg for:
# - Resolution normalization
# - Color correction
# - Audio levels
```

### Step 5: Export for Platforms (3 min)
// turbo
```bash
# Export for multiple platforms
mekong video:export --formats "youtube,shorts,twitter"

# Outputs:
# - YouTube (1920x1080)
# - Shorts (1080x1920)
# - Twitter (1280x720)
```

## 📋 Video Templates

### Content Types
```yaml
video_types:
  demo: 1-3 min product walkthrough
  tutorial: 5-15 min how-to
  testimonial: 1-2 min customer story
  shorts: 15-60s social clips
```

### Platform Specs
```yaml
platforms:
  youtube:
    resolution: 1920x1080
    aspect: 16:9
    format: mp4
  shorts:
    resolution: 1080x1920
    aspect: 9:16
    format: mp4
  twitter:
    resolution: 1280x720
    max_duration: 140s
```

## ✅ Success Criteria
- [ ] Video project initialized
- [ ] Script generated
- [ ] Shot list created
- [ ] Exports for all platforms

## 🔗 Next Workflow
After video workflow: `/content-calendar`

## 🏯 Binh Pháp Alignment
"兵无常势" (War has no constant form) - Adapt content to each platform.
