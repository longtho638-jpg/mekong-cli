# /tiep-thi - Marketing Automation

Spawn agent: `copywriter` + `scout-external`

## Purpose

Automate marketing campaigns for any business. Supports global markets with multi-platform strategies.

## Usage

```
/tiep-thi
/tiep-thi "Black Friday 2025 campaign"
/tiep-thi "product launch marketing" --lang=en
```

---

## Interactive Mode (8 Questions)

**If `$ARGUMENTS` is empty**, ask the user these 8 questions:

| # | Question (EN) | Câu hỏi (VI) | Example |
|---|---------------|--------------|---------|
| 1 | **Campaign name?** | Tên chiến dịch? | "Summer Sale 2025" |
| 2 | **Goal?** | Mục tiêu? | "Increase sales 50%" |
| 3 | **Target audience?** | Đối tượng? | "Women 25-45, urban" |
| 4 | **Budget?** | Ngân sách? | "$5,000" |
| 5 | **Duration?** | Thời gian? | "June 1-30, 2025" |
| 6 | **Main channels?** | Kênh chính? | "Instagram, Facebook" |
| 7 | **Key message?** | Thông điệp chính? | "Up to 50% off" |
| 8 | **Call to action?** | CTA? | "Shop Now" |

**After collecting answers** → Generate marketing plan.

---

## Workflow

1. **Goal Analysis**
   - Define target audience
   - Set key messages
   - Establish KPIs

2. **Planning**
   - Content calendar
   - Channel strategy
   - Budget allocation

3. **Content Creation**
   - Write copy (localized)
   - Design asset descriptions
   - Video scripts

4. **Scheduling & Tracking**
   - Posting schedule
   - KPI tracking setup

---

## Marketing Channels (Global)

| Channel | Best For | Priority |
|---------|----------|----------|
| Facebook | B2C, all ages | ⭐⭐⭐ |
| Instagram | B2C, visual, 18-45 | ⭐⭐⭐ |
| TikTok | B2C, Gen Z/Millennials | ⭐⭐⭐ |
| LinkedIn | B2B, professionals | ⭐⭐ |
| Google Ads | Search intent | ⭐⭐ |
| Email | All, retention | ⭐⭐⭐ |
| YouTube | Long-form, tutorials | ⭐⭐ |

---

## Output Format

```markdown
## Marketing Plan: [Campaign Name]

### 🎯 Goal
- Primary: [e.g., Increase sales 50%]
- Secondary: [e.g., Brand awareness]

### 👥 Target Audience
- Primary: [e.g., Women 25-45, urban, $50K+ income]
- Secondary: [e.g., Gift buyers]

### 📅 Timeline
[Campaign dates and phases]

### 📝 Content Calendar

| Date | Channel | Type | Content |
|------|---------|------|---------|
| 6/1 | Instagram | Post | Campaign launch |
| 6/3 | Facebook | Video | Product demo |
| 6/5 | Email | Newsletter | Special offer |

### 💰 Budget Allocation
| Channel | Amount | % |
|---------|--------|---|
| Instagram Ads | $2,000 | 40% |
| Facebook Ads | $1,500 | 30% |
| Influencers | $1,000 | 20% |
| Content | $500 | 10% |
| **Total** | $5,000 | 100% |

### 📊 KPIs
- Reach: X
- Engagement: X%
- Conversions: X
- ROAS: X:1
```

---

## Example

```
/tiep-thi "Summer Sale 2025"

🌴 Marketing Plan: Summer Sale 2025

🎯 Goal: 50% revenue increase in June

📅 Timeline: June 1-30, 2025

📝 Content Ideas:
1. "10 Summer Essentials Under $50"
2. Behind-the-scenes video
3. Customer unboxing UGC
4. Influencer collaboration

💰 Budget: $5,000
   - Instagram: $2,000
   - Facebook: $1,500
   - Influencers: $1,000
   - Content: $500
```

---

## Best Practices

1. **Audience-first** - Know who you're targeting
2. **Consistent** - Same message across channels
3. **Test & iterate** - A/B test creatives
4. **Track ROI** - Measure everything
5. **Localize** - Adapt for each market
