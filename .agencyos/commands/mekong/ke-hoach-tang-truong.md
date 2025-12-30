# /ke-hoach-tang-truong - Growth Strategy

Spawn agent: `planner` + `researcher`

## Purpose

Create comprehensive growth strategies for businesses. Data-driven, actionable frameworks.

## Usage

```
/ke-hoach-tang-truong
/ke-hoach-tang-truong "SaaS product"
/ke-hoach-tang-truong "e-commerce growth" --lang=en
```

---

## Interactive Mode (8 Questions)

**If `$ARGUMENTS` is empty**, ask the user these 8 questions:

| # | Question (EN) | Câu hỏi (VI) | Example |
|---|---------------|--------------|---------|
| 1 | **Business type?** | Loại hình? | "SaaS", "E-commerce", "Service" |
| 2 | **Current revenue?** | Doanh thu hiện tại? | "$50K MRR" |
| 3 | **Growth target?** | Mục tiêu tăng trưởng? | "2x in 12 months" |
| 4 | **Main channels now?** | Kênh chính hiện tại? | "SEO, Paid ads" |
| 5 | **Customer acquisition cost?** | CAC? | "$50" or "Unknown" |
| 6 | **Churn rate?** | Tỷ lệ rời bỏ? | "5%/month" |
| 7 | **Team size?** | Số người? | "5 people" |
| 8 | **Budget for growth?** | Ngân sách? | "$10K/month" |

**After collecting answers** → Generate growth plan.

---

## Output Format

```markdown
# Growth Strategy: [Company/Product]

📅 Date: [date]
🎯 Goal: [X]x growth in [Y] months
📊 Current: [Revenue/Users]

---

## 1. Current State Analysis

### 1.1 Metrics Dashboard
| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| MRR | $X | $X | +X% |
| Users | X | X | +X% |
| CAC | $X | $X | -X% |
| LTV | $X | $X | +X% |
| Churn | X% | X% | -X% |

### 1.2 Growth Equation
```
Revenue = Users × ARPU × Retention
```

### 1.3 Biggest Levers
1. [Lever 1] - Potential: +X%
2. [Lever 2] - Potential: +X%
3. [Lever 3] - Potential: +X%

---

## 2. Growth Channels

### 2.1 Channel Prioritization
| Channel | Impact | Effort | ROI | Priority |
|---------|--------|--------|-----|----------|
| [Channel 1] | High | Medium | 3x | ⭐⭐⭐ |
| [Channel 2] | Medium | Low | 5x | ⭐⭐⭐ |
| [Channel 3] | High | High | 2x | ⭐⭐ |

### 2.2 Channel Strategy

#### [Channel 1]
- **Tactic**: [Description]
- **Budget**: $X/month
- **Expected**: +X users

---

## 3. Retention Strategy

### 3.1 Churn Analysis
| Reason | % of Churns | Fix |
|--------|-------------|-----|
| [Reason 1] | X% | [Action] |
| [Reason 2] | X% | [Action] |

### 3.2 Retention Tactics
- [ ] [Tactic 1]
- [ ] [Tactic 2]

---

## 4. Monetization

### 4.1 Pricing Optimization
| Tier | Current | Proposed | Impact |
|------|---------|----------|--------|
| Basic | $X | $X | +X% |
| Pro | $X | $X | +X% |

### 4.2 Upsell Strategy
[Approach to increase ARPU]

---

## 5. 90-Day Action Plan

| Week | Focus | Action | Owner |
|------|-------|--------|-------|
| 1-2 | Foundation | [Action] | [Who] |
| 3-4 | Channel 1 | [Action] | [Who] |
| 5-8 | Scale | [Action] | [Who] |
| 9-12 | Optimize | [Action] | [Who] |

---

## 6. Resources Needed

| Resource | Cost | Timeline |
|----------|------|----------|
| [Tool/Hire] | $X | [When] |
| [Tool/Hire] | $X | [When] |
```

---

## Example

```
/ke-hoach-tang-truong "B2B SaaS"

# Growth Strategy: B2B SaaS

## Current: $50K MRR
## Target: $150K MRR (12 months)

## Top 3 Levers
1. Reduce churn 8% → 4% = +$12K MRR
2. Increase pricing 15% = +$9K MRR  
3. Scale content marketing = +$25K MRR

## Priority Channels
⭐⭐⭐ Content SEO (ROI: 8x)
⭐⭐⭐ LinkedIn Outbound (ROI: 5x)
⭐⭐ Paid Search (ROI: 3x)

## 90-Day Focus
Week 1-4: Fix churn (onboarding)
Week 5-8: Launch content engine
Week 9-12: Scale what works
```

---

## Best Practices

1. **Data first** - Measure before optimizing
2. **One lever** - Focus on biggest impact
3. **Experiment** - Test before scaling
4. **Compound** - Small gains add up
5. **Retention > Acquisition** - Fix the bucket
