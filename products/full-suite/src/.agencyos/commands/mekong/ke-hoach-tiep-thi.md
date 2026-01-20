# /ke-hoach-tiep-thi - Marketing Strategy Plan

Spawn agent: `planner` + `copywriter`

## Purpose

Create comprehensive marketing strategy plans for any business. Long-term strategic planning.

## Usage

```
/ke-hoach-tiep-thi
/ke-hoach-tiep-thi "new product launch"
/ke-hoach-tiep-thi "annual marketing plan" --lang=en
```

---

## Interactive Mode (9 Questions)

**If `$ARGUMENTS` is empty**, ask the user these 9 questions:

| # | Question (EN) | Câu hỏi (VI) | Example |
|---|---------------|--------------|---------|
| 1 | **Business/product?** | Doanh nghiệp/SP? | "FreshFlow Health App" |
| 2 | **Planning period?** | Thời gian kế hoạch? | "2025 full year" |
| 3 | **Marketing budget?** | Ngân sách? | "$100K annual" |
| 4 | **Primary goal?** | Mục tiêu chính? | "1000 paying customers" |
| 5 | **Target audience?** | Đối tượng? | "Fitness enthusiasts 25-40" |
| 6 | **Current channels?** | Kênh hiện tại? | "Instagram, SEO" |
| 7 | **Brand positioning?** | Định vị? | "Premium, easy-to-use" |
| 8 | **Key competitors?** | Đối thủ chính? | "MyFitnessPal, Noom" |
| 9 | **Team size?** | Số người marketing? | "2 people" |

**After collecting answers** → Generate marketing strategy.

---

## Output Format

```markdown
# Marketing Strategy: [Business/Product]

📅 Period: [Timeline]
💰 Budget: [Amount]
🎯 Goal: [Primary objective]

---

## 1. Situation Analysis

### 1.1 SWOT
| Strengths | Weaknesses |
|-----------|------------|
| [S1] | [W1] |
| [S2] | [W2] |

| Opportunities | Threats |
|---------------|---------|
| [O1] | [T1] |
| [O2] | [T2] |

### 1.2 Competitive Position
[Current market position vs competitors]

---

## 2. Target Audience

### 2.1 Primary Persona
- **Who**: [Demographics]
- **Pain**: [Main problem]
- **Goal**: [What they want]
- **Channel**: [Where they are]

### 2.2 Secondary Persona
[Same structure]

---

## 3. Positioning & Messaging

### 3.1 Positioning Statement
> For [target] who [need], [product] is [category] that [benefit] unlike [competitors].

### 3.2 Key Messages
| Audience | Message | Proof |
|----------|---------|-------|
| [Persona 1] | [Message] | [Evidence] |
| [Persona 2] | [Message] | [Evidence] |

---

## 4. Channel Strategy

### 4.1 Channel Mix
| Channel | Purpose | Budget % | Goals |
|---------|---------|----------|-------|
| [Channel 1] | Awareness | X% | [KPI] |
| [Channel 2] | Acquisition | X% | [KPI] |
| [Channel 3] | Retention | X% | [KPI] |

### 4.2 Content Strategy
| Content Type | Frequency | Channel | Purpose |
|--------------|-----------|---------|---------|
| Blog posts | 2/week | SEO | Awareness |
| Videos | 1/week | YouTube | Trust |
| Email | Daily | Newsletter | Nurture |

---

## 5. Campaign Calendar

### Q1
| Month | Campaign | Channel | Budget |
|-------|----------|---------|--------|
| Jan | [Campaign] | [Channel] | $X |
| Feb | [Campaign] | [Channel] | $X |
| Mar | [Campaign] | [Channel] | $X |

[Repeat for Q2-Q4]

---

## 6. Budget Allocation

| Category | Amount | % |
|----------|--------|---|
| Paid Ads | $X | X% |
| Content | $X | X% |
| Tools | $X | X% |
| Influencers | $X | X% |
| **Total** | $X | 100% |

---

## 7. KPIs & Measurement

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Traffic | X | X | Q4 |
| Leads | X | X | Q4 |
| Customers | X | X | Q4 |
| Revenue | $X | $X | Q4 |

---

## 8. Action Items

### Immediate (30 days)
- [ ] [Action 1]
- [ ] [Action 2]

### Short-term (90 days)
- [ ] [Action 3]
- [ ] [Action 4]
```

---

## Best Practices

1. **Customer-centric** - Start with audience
2. **Measurable** - Every tactic has KPIs
3. **Flexible** - Adapt quarterly
4. **Integrated** - Channels work together
5. **Resource-realistic** - Match team capacity
