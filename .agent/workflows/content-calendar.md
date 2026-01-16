---
description: How to plan and manage content operations at scale
---

# 📅 Content Calendar Workflow

Plan, create, and distribute content systematically for your agency.

## 🤖 Quick Execute
```bash
Execute workflow: https://agencyos.network/docs/workflows/content-calendar
```

## ⚡ Step-by-Step Execution

### Step 1: Initialize Content Factory (2 min)
// turbo
```bash
# Set up content management
mekong content:init --platforms twitter,linkedin,youtube

# Expected: ✅ Content factory initialized
```

### Step 2: Generate Content Ideas (3 min)
// turbo
```bash
# AI-generate content ideas for the month
mekong content:ideate --topic "agency growth" --count 30

# Output: 30 content ideas categorized by:
# - Educational
# - Case studies
# - Behind-the-scenes
# - Industry insights
```

### Step 3: Create Content Pillars (3 min)
// turbo
```bash
# Define content strategy pillars
mekong content:pillars --add "growth-hacks,tech-stack,client-wins,team-culture"

# Pillar Distribution:
# - Growth Hacks: 30%
# - Tech Stack: 25%
# - Client Wins: 25%
# - Team Culture: 20%
```

### Step 4: Schedule Content (5 min)
// turbo
```bash
# Auto-schedule content for the month
mekong content:schedule --month next --frequency "daily"

# Creates calendar with:
# - Optimal posting times
# - Platform-specific formats
# - Cross-posting automation
```

### Step 5: Set Up Repurposing Pipeline (3 min)
// turbo
```bash
# Configure content repurposing
mekong content:repurpose --enable

# Pipeline:
# Blog → Twitter Thread → LinkedIn Carousel → YouTube Short
```

## 📋 Content Templates

### Weekly Content Mix
```yaml
weekly_schedule:
  monday: Educational thread
  tuesday: Tool recommendation
  wednesday: Client win story
  thursday: Industry insight
  friday: Team/culture post
  saturday: Engagement poll
  sunday: Week preview
```

### Content Formats by Platform
```yaml
platforms:
  twitter:
    - threads (10-15 tweets)
    - single tweets
    - polls
  linkedin:
    - carousels
    - text posts
    - articles
  youtube:
    - shorts (< 60s)
    - tutorials (5-15 min)
    - vlogs
```

### Performance Metrics
```yaml
kpis:
  twitter: Impressions > 10K/week
  linkedin: Engagement > 5%
  youtube: Watch time > 1K hrs/month
  newsletter: Open rate > 40%
```

## ✅ Success Criteria
- [ ] Content factory initialized
- [ ] 30+ content ideas generated
- [ ] Content pillars defined
- [ ] Monthly calendar scheduled
- [ ] Repurposing pipeline active

## 🔗 Next Workflow
After content calendar: `/brand-system` or `/video-workflow`

## 🏯 Binh Pháp Alignment
"善用兵者，修道而保法" (The skilled warrior cultivates the way and preserves the law) - Consistent content builds lasting authority.
