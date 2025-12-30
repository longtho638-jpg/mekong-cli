# /ke-hoach-kinh-doanh - Business Plan Generator

Spawn agent: `planner` + `researcher` + `copywriter`

## Purpose

Generate a complete Business Plan for any business/startup worldwide. Supports bilingual output (Vietnamese/English).

## Usage

```
/ke-hoach-kinh-doanh
/ke-hoach-kinh-doanh "online organic grocery store"
/ke-hoach-kinh-doanh "AI-powered tutoring platform" --lang=en
```

---

## Interactive Mode (9 Questions)

**If `$ARGUMENTS` is empty**, ask the user these 9 questions:

### 📋 9 Questions to Gather Input

| # | Question (EN) | Câu hỏi (VI) | Example |
|---|---------------|--------------|---------|
| 1 | **Project name?** | Tên dự án? | "FreshFarm Direct" |
| 2 | **Problem you solve?** | Vấn đề giải quyết? | "Farmers can't reach consumers directly" |
| 3 | **Target customer?** | Khách hàng mục tiêu? | "Health-conscious families, 30-50, urban" |
| 4 | **Location/Market?** | Địa bàn hoạt động? | "Vietnam nationwide, ship from Mekong Delta" |
| 5 | **Revenue model?** | Mô hình doanh thu? | "Direct sales 70%, Gift boxes 20%, B2B 10%" |
| 6 | **Competitive advantage?** | Lợi thế cạnh tranh? | "Direct from farm, 30% cheaper than retail" |
| 7 | **Startup capital?** | Vốn khởi điểm? | "$5,000 USD / 120 million VND" |
| 8 | **12-month goal?** | Mục tiêu 12 tháng? | "$10K MRR, 500 customers" |
| 9 | **Current team?** | Team hiện tại? | "1 founder, 1 marketing" |

**After collecting all 9 answers** → Generate full Business Plan below.

**If `$ARGUMENTS` is provided** → Use as project description, infer other details.

---

## Workflow

1. **Market Analysis**
   - Market size (global/regional)
   - Industry trends
   - Competitive landscape

2. **Business Model**
   - Value proposition
   - Revenue streams
   - Cost structure
   - Key partners

3. **Marketing Strategy**
   - Target segments
   - Channel strategy
   - Pricing strategy
   - Brand positioning

4. **Financial Projections**
   - Startup costs
   - Revenue projections (12 months)
   - Break-even analysis
   - Funding requirements

5. **Execution Roadmap**
   - Milestones (30/60/90 days)
   - Team requirements
   - Risk mitigation

---

## Output Format

```markdown
# Business Plan: [Project Name]

📅 Date: [date]
🎯 Goal: $X MRR in [Y] months
🌍 Market: [Location/Region]

---

## 1. Executive Summary

[2-3 paragraphs summarizing the entire plan]

---

## 2. Problem & Solution

### 2.1 Problem
[Pain points the market faces]

### 2.2 Solution
[How your product/service solves it]

### 2.3 Value Proposition
> [1 sentence describing core value]

---

## 3. Market Analysis

### 3.1 TAM/SAM/SOM
| Metric | Value |
|--------|-------|
| TAM | $X |
| SAM | $X |
| SOM | $X |

### 3.2 Competitors
| Competitor | Strengths | Weaknesses |
|------------|-----------|------------|
| A | ... | ... |
| B | ... | ... |

### 3.3 Opportunities & Risks
- ✅ Opportunities: [list]
- ⚠️ Risks: [list]

---

## 4. Business Model

### 4.1 Revenue Streams
| Source | % of Revenue | Description |
|--------|--------------|-------------|
| [Source 1] | X% | ... |
| [Source 2] | X% | ... |

### 4.2 Cost Structure
| Cost Type | Amount/month |
|-----------|--------------|
| Fixed costs | $X |
| Variable costs | $X |

### 4.3 Unit Economics
- CAC: $X
- LTV: $X
- LTV:CAC Ratio: X:1

---

## 5. Financial Projections

### 5.1 12-Month Revenue Forecast
| Month | Revenue | Customers | MRR |
|-------|---------|-----------|-----|
| 1 | $X | X | $X |
| ... | ... | ... | ... |
| 12 | $X | X | $X |

### 5.2 Break-even Analysis
- Break-even point: Month X
- Required revenue: $X/month

### 5.3 Funding Requirements
- Seed: $X
- Use of funds: [breakdown]

---

## 6. Execution Roadmap

### 6.1 90-Day Timeline
| Phase | Timeline | Goal |
|-------|----------|------|
| Phase 1 | 0-30 days | MVP launch |
| Phase 2 | 30-60 days | First customers |
| Phase 3 | 60-90 days | Validate PMF |

### 6.2 Team
| Role | Person | Status |
|------|--------|--------|
| CEO/Founder | ... | ✅ |
| CTO | ... | 🔍 Hiring |

---

## 7. Next Steps

- [ ] Complete MVP
- [ ] Find 10 early adopters
- [ ] Validate pricing
- [ ] Prepare pitch deck
```

---

## Example

```
/ke-hoach-kinh-doanh "online mango store from Mekong Delta"

# Business Plan: Mekong Mango Direct

📅 Date: Dec 24, 2024
🎯 Goal: $10K MRR in 6 months
🌍 Market: Vietnam nationwide, export to Asia

## Executive Summary
Online store specializing in premium Hoa Loc mangoes, 
shipped directly from farms. Target: 100M VND MRR in 6 months.

## Target Customer
- Age: 30-50, female (primary household purchaser)
- Location: Ho Chi Minh City, Hanoi
- Income: $500-1500/month
- Values: Quality food, organic, convenient delivery

## Revenue Model
- Direct sales: 70%
- Gift boxes: 20%
- Corporate: 10%
```

---

## Best Practices

1. **Realistic** - Based on real market data
2. **Actionable** - Each section leads to action
3. **Measurable** - Clear KPIs
4. **Time-bound** - Specific milestones
5. **Global-ready** - Currency/market flexible
