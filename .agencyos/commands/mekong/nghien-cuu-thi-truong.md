# /nghien-cuu-thi-truong - Market Research

Spawn agent: `scout` + `researcher` + `scout-external`

## Purpose

Comprehensive market research for any industry/product. Supports global markets with localized insights.

## Usage

```
/nghien-cuu-thi-truong
/nghien-cuu-thi-truong "organic skincare market USA"
/nghien-cuu-thi-truong "AI SaaS tools" --lang=en
```

---

## Interactive Mode (8 Questions)

**If `$ARGUMENTS` is empty**, ask the user these 8 questions:

| # | Question (EN) | Câu hỏi (VI) | Example |
|---|---------------|--------------|---------|
| 1 | **Industry/product?** | Ngành/sản phẩm? | "Electric vehicles" |
| 2 | **Target market?** | Thị trường? | "USA, Europe" |
| 3 | **Your position?** | Bạn là ai? | "New entrant", "Investor" |
| 4 | **Budget for research?** | Ngân sách? | "$0 (public data only)" |
| 5 | **Time horizon?** | Thời gian quan tâm? | "5 years" |
| 6 | **Key competitors?** | Đối thủ biết? | "Tesla, BYD" |
| 7 | **Specific questions?** | Câu hỏi cụ thể? | "What's the TAM?" |
| 8 | **Depth needed?** | Mức độ chi tiết? | "Overview" / "Deep dive" |

**After collecting answers** → Generate market research report.

---

## Workflow

1. **Data Collection**
   - Industry statistics
   - Market reports
   - News and trends

2. **Market Sizing**
   - TAM (Total Addressable Market)
   - SAM (Serviceable Available Market)
   - SOM (Serviceable Obtainable Market)

3. **Competitive Analysis**
   - Direct competitors
   - Indirect competitors
   - Market share estimates

4. **Trends & Forecasts**
   - Industry trends
   - Growth drivers
   - Threats & challenges

5. **Opportunity Mapping**
   - Market gaps
   - Unmet needs
   - Entry strategies

---

## Output Format

```markdown
# Market Research: [Industry/Product]

📅 Date: [date]
🎯 Confidence: [X]%
🌍 Market: [Region]

---

## 1. Market Overview

### 1.1 Industry Definition
[Description of industry scope]

### 1.2 Market Size

| Metric | Value | Source |
|--------|-------|--------|
| TAM | $X billion | [source] |
| SAM | $X billion | [source] |
| SOM | $X million | Estimate |
| CAGR | X% | [source] |

### 1.3 Historical Growth
[Growth data/trends over past years]

---

## 2. Competitive Analysis

### 2.1 Landscape
| Player | Market Share | Strengths | Weaknesses |
|--------|--------------|-----------|------------|
| A | X% | ... | ... |
| B | X% | ... | ... |

### 2.2 Porter's Five Forces
- Threat of New Entrants: [High/Medium/Low]
- Supplier Power: [High/Medium/Low]
- Buyer Power: [High/Medium/Low]
- Threat of Substitutes: [High/Medium/Low]
- Industry Rivalry: [High/Medium/Low]

---

## 3. Market Trends

### 3.1 Macro Trends
- 📈 [Trend 1]: [Impact]
- 📈 [Trend 2]: [Impact]
- 📉 [Decline 1]: [Impact]

### 3.2 Consumer Behavior
[Shifts in consumer preferences]

### 3.3 Technology Trends
[Technology impacting the industry]

---

## 4. Opportunities & Challenges

### 4.1 Market Gaps
| Gap | Size | Difficulty |
|-----|------|------------|
| [Gap 1] | $X | Medium |
| [Gap 2] | $X | Low |

### 4.2 Entry Barriers
- [Barrier 1]
- [Barrier 2]

### 4.3 Key Success Factors
- [KSF 1]
- [KSF 2]

---

## 5. Recommendations

### 5.1 Entry Strategy
> [Summary recommendation]

### 5.2 Target Segments
1. **Primary**: [Segment]
2. **Secondary**: [Segment]

### 5.3 Action Items
- [ ] [Action 1]
- [ ] [Action 2]
- [ ] [Action 3]

---

## Sources
1. [Source 1]
2. [Source 2]
```

---

## Example

```
/nghien-cuu-thi-truong "AI productivity tools market"

# Market Research: AI Productivity Tools

## Market Size
- TAM: $50 billion (2025)
- SAM: $15 billion (B2B SaaS)
- CAGR: 35%/year

## Top Competitors
- Notion AI: 18%
- Microsoft Copilot: 25%
- ChatGPT Enterprise: 15%

## Trends
📈 AI integration: +100%/year adoption
📈 Workflow automation: +45%
📉 Legacy tools: -15%

## Opportunity
- Gap: Vertical-specific AI ($5B)
- Gap: SMB-friendly pricing ($3B)
```

---

## Best Practices

1. **Multiple sources** - Combine primary + secondary
2. **Recent data** - Prioritize data < 2 years
3. **Local context** - Understand regional nuances
4. **Validate** - Cross-check with experts
5. **Global lens** - Think international scale
