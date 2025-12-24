# /thong-diep-tiep-thi - Marketing Messaging

Spawn agent: `copywriter`

## Purpose

Create compelling marketing messages, taglines, and value propositions. For any industry and market.

## Usage

```
/thong-diep-tiep-thi
/thong-diep-tiep-thi "health app"
/thong-diep-tiep-thi "B2B software" --lang=en
```

---

## Interactive Mode (7 Questions)

**If `$ARGUMENTS` is empty**, ask the user these 7 questions:

| # | Question (EN) | Câu hỏi (VI) | Example |
|---|---------------|--------------|---------|
| 1 | **Product/service?** | Sản phẩm/dịch vụ? | "AI writing assistant" |
| 2 | **Target audience?** | Đối tượng? | "Content marketers" |
| 3 | **Main benefit?** | Lợi ích chính? | "Write 10x faster" |
| 4 | **Key differentiator?** | Khác biệt? | "Sounds like you" |
| 5 | **Competitors?** | Đối thủ? | "Jasper, Copy.ai" |
| 6 | **Brand tone?** | Tone giọng? | "Friendly, witty" |
| 7 | **Use channels?** | Kênh sử dụng? | "Ads, landing page" |

**After collecting answers** → Generate messaging framework.

---

## Output Format

```markdown
# Messaging Framework: [Product]

📅 Date: [date]
🎯 Audience: [Target]
✨ Tone: [Brand voice]

---

## 1. Core Positioning

### 1.1 Positioning Statement
> For [target audience] who [have this need], [product] is [category] that [key benefit] unlike [competitors] because [unique reason].

### 1.2 One-Liner
> "[Short, memorable description]"

---

## 2. Value Proposition

### 2.1 Main Benefit
**[Headline benefit]**
[Supporting explanation]

### 2.2 Supporting Benefits
| Benefit | Proof | For Who |
|---------|-------|---------|
| [Benefit 1] | [Evidence] | [Segment] |
| [Benefit 2] | [Evidence] | [Segment] |
| [Benefit 3] | [Evidence] | [Segment] |

---

## 3. Messaging Hierarchy

### 3.1 Primary Messages
| Audience | Message | Channel |
|----------|---------|---------|
| [Segment 1] | [Message] | [Where] |
| [Segment 2] | [Message] | [Where] |

### 3.2 Proof Points
- [Stat/testimonial 1]
- [Stat/testimonial 2]
- [Stat/testimonial 3]

---

## 4. Tagline Options

### 4.1 Short (2-4 words)
1. "[Option 1]"
2. "[Option 2]"
3. "[Option 3]"

### 4.2 Medium (5-8 words)
1. "[Option 1]"
2. "[Option 2]"

### 4.3 Long (Sentence)
1. "[Full tagline option]"

---

## 5. Headlines by Channel

### 5.1 Landing Page
- **H1**: [Main headline]
- **H2**: [Supporting subhead]

### 5.2 Ads
| Platform | Headline | Description |
|----------|----------|-------------|
| Google | [25 chars] | [90 chars] |
| Facebook | [40 chars] | [125 chars] |
| LinkedIn | [150 chars] | [70 chars] |

### 5.3 Email
| Type | Subject Line |
|------|--------------|
| Welcome | [Subject] |
| Promo | [Subject] |
| Re-engagement | [Subject] |

---

## 6. CTA Options

| Context | CTA | Button Text |
|---------|-----|-------------|
| Landing page | Sign up | "Get Started Free" |
| Pricing | Purchase | "Start 14-Day Trial" |
| Blog | Learn more | "Read the Guide" |

---

## 7. Voice Guidelines

### Do's
- [Voice characteristic 1]
- [Voice characteristic 2]

### Don'ts
- [Avoid 1]
- [Avoid 2]

### Sample Copy
[Example paragraph in brand voice]
```

---

## Best Practices

1. **Benefits > Features** - What it does for them
2. **Clear > Clever** - Understand in 3 seconds
3. **Specific > Generic** - Concrete examples
4. **Test everything** - A/B headlines
5. **Voice consistency** - Same tone everywhere
