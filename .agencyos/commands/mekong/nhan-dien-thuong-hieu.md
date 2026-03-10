# /nhan-dien-thuong-hieu - Brand Identity Generator

Spawn agent: `copywriter` + `designer`

## Purpose

Create comprehensive brand identity systems for businesses. Supports global markets.

## Usage

```
/nhan-dien-thuong-hieu
/nhan-dien-thuong-hieu "tech startup"
/nhan-dien-thuong-hieu "premium coffee brand" --lang=en
```

---

## Interactive Mode (9 Questions)

**If `$ARGUMENTS` is empty**, ask the user these 9 questions:

| # | Question (EN) | Câu hỏi (VI) | Example |
|---|---------------|--------------|---------|
| 1 | **Company name?** | Tên công ty? | "FreshFlow" |
| 2 | **Industry?** | Ngành nghề? | "Health tech" |
| 3 | **Target audience?** | Đối tượng? | "Millennials, health-conscious" |
| 4 | **3 brand values?** | 3 giá trị? | "Innovation, Trust, Simplicity" |
| 5 | **Personality?** | Tính cách? | "Friendly, Professional" |
| 6 | **Competitors?** | Đối thủ? | "Calm, Headspace" |
| 7 | **Price positioning?** | Định vị giá? | "Premium", "Affordable" |
| 8 | **Colors preferred?** | Màu thích? | "Blue, White" or "Open" |
| 9 | **Existing assets?** | Assets có sẵn? | "Logo" or "Nothing" |

**After collecting answers** → Generate brand identity system.

---

## Output Format

```markdown
# Brand Identity: [Company Name]

📅 Created: [date]
🎯 Industry: [Industry]
🌍 Market: [Target regions]

---

## 1. Brand Strategy

### 1.1 Vision
> [One sentence vision statement]

### 1.2 Mission
> [One sentence mission statement]

### 1.3 Core Values
| Value | Description | Expression |
|-------|-------------|------------|
| [Value 1] | ... | How it shows in brand |
| [Value 2] | ... | How it shows in brand |
| [Value 3] | ... | How it shows in brand |

### 1.4 Brand Personality
- **Voice**: [e.g., Friendly yet professional]
- **Tone**: [e.g., Warm, encouraging]
- **Character**: [e.g., Helpful guide]

---

## 2. Visual Identity

### 2.1 Color Palette
| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | [Color] | #XXXXXX | Main CTAs, Logo |
| Secondary | [Color] | #XXXXXX | Accents |
| Neutral | [Color] | #XXXXXX | Text, Backgrounds |

### 2.2 Typography
| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Headlines | [Font] | Bold | H1, H2 |
| Body | [Font] | Regular | Paragraphs |
| Accent | [Font] | Medium | Buttons |

### 2.3 Logo Concepts
[3 logo direction descriptions]

---

## 3. Brand Voice

### 3.1 Messaging Framework
| Audience | Key Message | Proof Point |
|----------|-------------|-------------|
| [Segment 1] | ... | ... |
| [Segment 2] | ... | ... |

### 3.2 Tagline Options
1. "[Tagline 1]"
2. "[Tagline 2]"
3. "[Tagline 3]"

### 3.3 Elevator Pitch
> [30-second pitch]

---

## 4. Application Guidelines

### 4.1 Do's
- [Do 1]
- [Do 2]

### 4.2 Don'ts
- [Don't 1]
- [Don't 2]

### 4.3 Templates Needed
- [ ] Business card
- [ ] Email signature
- [ ] Social media profiles
- [ ] Presentation deck
```

---

## Example

```
/nhan-dien-thuong-hieu "organic tea brand"

# Brand Identity: ZenLeaf Tea

## Core Values
- Purity: Only organic, single-origin
- Mindfulness: Tea as meditation
- Sustainability: Eco-friendly practices

## Colors
- Primary: Forest Green #2D5A27
- Secondary: Warm Cream #F5F0E1
- Accent: Copper #B87333

## Tagline
"Nature in Every Cup"

## Voice
Calm, knowledgeable, inviting
```

---

## Best Practices

1. **Differentiate** - Stand out from competitors
2. **Consistent** - Apply across all touchpoints
3. **Scalable** - Works at any size
4. **Memorable** - Easy to recall
5. **Authentic** - True to brand values
