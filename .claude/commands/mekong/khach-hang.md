# /khach-hang - Customer Profile Generator

Spawn agent: `researcher` + `copywriter`

## Purpose

Analyze and create comprehensive Customer Profiles for any product/service. Supports any market worldwide.

## Usage

```
/khach-hang
/khach-hang "organic skincare products"
/khach-hang "SaaS project management tool" --lang=en
```

---

## Interactive Mode (7 Questions)

**If `$ARGUMENTS` is empty**, ask the user these 7 questions:

| # | Question (EN) | Câu hỏi (VI) | Example |
|---|---------------|--------------|---------|
| 1 | **What product/service?** | Sản phẩm/dịch vụ gì? | "Organic face cream" |
| 2 | **Target market/country?** | Thị trường mục tiêu? | "USA, urban cities" |
| 3 | **Price range?** | Mức giá? | "$30-80 per product" |
| 4 | **B2B or B2C?** | B2B hay B2C? | "B2C" |
| 5 | **Online or offline?** | Online hay offline? | "Online primarily" |
| 6 | **Problem you solve?** | Vấn đề giải quyết? | "Skin sensitivity issues" |
| 7 | **Key competitors?** | Đối thủ chính? | "CeraVe, The Ordinary" |

**After collecting answers** → Generate full Customer Profile.

---

## Workflow

1. **Industry Analysis**
   - Identify industry/niche
   - Research market size
   - Identify key competitors

2. **Build Demographics**
   - Age, gender, location
   - Income, occupation
   - Family status, lifestyle

3. **Behavior Analysis**
   - Purchase channels: online/offline
   - Frequency, order value
   - Decision factors

4. **Identify Pain Points**
   - Current customer problems
   - Unmet needs
   - Frustrations with existing solutions

5. **Solution Mapping**
   - How product solves pain points
   - Unique value proposition
   - Messaging recommendations

---

## Output Format

```markdown
## Customer Profile: [Product/Service]

📅 Created: [date]
🎯 Confidence: [X]%
🌍 Market: [Location]

### 👥 Demographics
| Attribute | Value |
|-----------|-------|
| Age | 25-45 |
| Gender | 60% Female, 40% Male |
| Location | [Market/Region] |
| Income | $X-X per month |
| Occupation | [Job types] |

### 🛒 Purchase Behavior
| Attribute | Value |
|-----------|-------|
| Primary channels | [Channel 1] 45%, [Channel 2] 30% |
| Frequency | X times/month |
| AOV | $X |
| Decision time | X days |

### 😰 Pain Points
1. **[Pain point 1]**
   - Details...
   
2. **[Pain point 2]**
   - Details...

3. **[Pain point 3]**
   - Details...

### 💡 Solution & Messaging

#### Value Proposition
> [One sentence value proposition]

#### Key Messages
1. [Message 1] - for [channel]
2. [Message 2] - for [channel]
3. [Message 3] - for [channel]

### 📋 Action Items
- [ ] Create content targeting pain point #1
- [ ] Setup ads campaign on [channel]
- [ ] Develop feature to solve [problem]
```

---

## Example

```
/khach-hang "premium coffee subscription"

## Customer Profile: Premium Coffee Subscription

### 👥 Demographics
- Age: 28-45
- Gender: 55% Male (specialty coffee enthusiasts)
- Location: USA, major metros
- Income: $60K-150K/year

### 😰 Pain Points
1. Can't find consistently good quality beans
2. Don't have time to visit specialty shops
3. Bored with same old supermarket options

### 💡 Key Message
> "World-class specialty coffee, roasted fresh, 
> delivered to your door weekly"
```

---

## Best Practices

1. **Be Specific** - Avoid generic descriptions
2. **Data-driven** - Use real market data
3. **Actionable** - Every insight leads to action
4. **Update regularly** - Review quarterly
5. **Global-ready** - Adapt for any market
