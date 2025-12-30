# /chien-luoc-ban-hang - Sales Strategy

Spawn agent: `planner` + `researcher`

## Purpose

Develop comprehensive sales strategies and playbooks. Applicable to any market or business model.

## Usage

```
/chien-luoc-ban-hang
/chien-luoc-ban-hang "B2B enterprise sales"
/chien-luoc-ban-hang "e-commerce optimization" --lang=en
```

---

## Interactive Mode (8 Questions)

**If `$ARGUMENTS` is empty**, ask the user these 8 questions:

| # | Question (EN) | Câu hỏi (VI) | Example |
|---|---------------|--------------|---------|
| 1 | **Sales model?** | Mô hình bán hàng? | "B2B", "B2C", "D2C" |
| 2 | **Product/service?** | Sản phẩm/dịch vụ? | "SaaS CRM tool" |
| 3 | **Average deal size?** | Giá trị TB/deal? | "$500", "$50K" |
| 4 | **Sales cycle length?** | Chu kỳ bán hàng? | "1 week", "6 months" |
| 5 | **Current team size?** | Số người bán hàng? | "2 sales reps" |
| 6 | **Current close rate?** | Tỷ lệ chốt? | "20%", "Unknown" |
| 7 | **Lead sources?** | Nguồn lead? | "Inbound, cold email" |
| 8 | **Revenue target?** | Mục tiêu doanh thu? | "$500K this year" |

**After collecting answers** → Generate sales strategy.

---

## Output Format

```markdown
# Sales Strategy: [Product/Service]

📅 Date: [date]
🎯 Target: [Revenue goal]
📊 Model: [B2B/B2C/D2C]

---

## 1. Sales Model Analysis

### 1.1 Current State
| Metric | Value | Benchmark |
|--------|-------|-----------|
| Deal size | $X | $X |
| Close rate | X% | X% |
| Sales cycle | X days | X days |
| CAC | $X | $X |

### 1.2 Revenue Math
```
Target Revenue = Deals × Average Deal Size
Deals Needed = Target / ADS
Leads Needed = Deals / Close Rate
```

---

## 2. Sales Process

### 2.1 Pipeline Stages
| Stage | Actions | Duration | Exit Criteria |
|-------|---------|----------|---------------|
| Lead | [Action] | X days | [Criteria] |
| Qualified | [Action] | X days | [Criteria] |
| Demo | [Action] | X days | [Criteria] |
| Proposal | [Action] | X days | [Criteria] |
| Close | [Action] | X days | [Criteria] |

### 2.2 Stage Conversion
| Stage | Conversion | Improve to |
|-------|------------|------------|
| Lead → Qualified | X% | X% |
| Qualified → Demo | X% | X% |
| Demo → Proposal | X% | X% |
| Proposal → Close | X% | X% |

---

## 3. Ideal Customer Profile

### 3.1 ICP Definition
- **Company Size**: [Range]
- **Industry**: [Types]
- **Budget**: [Range]
- **Pain Point**: [Specific problem]

### 3.2 Buyer Personas
| Role | Priority | Pain Point | Objection |
|------|----------|------------|-----------|
| [Role 1] | Primary | [Pain] | [Common objection] |
| [Role 2] | Secondary | [Pain] | [Common objection] |

---

## 4. Sales Playbook

### 4.1 Prospecting Scripts
[Email/call templates]

### 4.2 Discovery Questions
1. [Question to understand need]
2. [Question to qualify budget]
3. [Question to identify timeline]

### 4.3 Objection Handling
| Objection | Response |
|-----------|----------|
| "Too expensive" | [Response] |
| "Need to think" | [Response] |
| "Using competitor" | [Response] |

---

## 5. Team & Tools

### 5.1 Team Structure
| Role | Count | Focus |
|------|-------|-------|
| SDR | X | Outbound |
| AE | X | Closing |
| AM | X | Retention |

### 5.2 Tech Stack
| Tool | Purpose | Cost |
|------|---------|------|
| CRM | [Tool] | $X/mo |
| Outreach | [Tool] | $X/mo |
| Analytics | [Tool] | $X/mo |

---

## 6. Action Plan

### Immediate (30 days)
- [ ] [Action 1]
- [ ] [Action 2]

### This Quarter
- [ ] [Action 3]
- [ ] [Action 4]
```

---

## Best Practices

1. **Know your numbers** - Measure everything
2. **Script & improvise** - Framework + personality
3. **Qualify early** - Don't waste time
4. **Follow up** - 80% of sales need 5+ touches
5. **Always be helping** - Solve problems, not push
