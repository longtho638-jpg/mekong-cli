# /ke-hoach-pr - PR & Communications Plan

Spawn agent: `copywriter` + `researcher`

## Purpose

Create comprehensive PR and communications strategies. Supports global media markets.

## Usage

```
/ke-hoach-pr
/ke-hoach-pr "product launch"
/ke-hoach-pr "crisis communication" --lang=en
```

---

## Interactive Mode (7 Questions)

**If `$ARGUMENTS` is empty**, ask the user these 7 questions:

| # | Question (EN) | Câu hỏi (VI) | Example |
|---|---------------|--------------|---------|
| 1 | **Campaign type?** | Loại chiến dịch? | "Product launch", "Crisis" |
| 2 | **Company/product?** | Công ty/SP? | "FreshFlow App" |
| 3 | **Target media?** | Báo chí mục tiêu? | "Tech blogs, mainstream" |
| 4 | **Key message?** | Thông điệp chính? | "Revolutionary health tracking" |
| 5 | **Timeline?** | Thời gian? | "Launch on Jan 15, 2025" |
| 6 | **Budget?** | Ngân sách? | "$5,000" or "Bootstrap" |
| 7 | **Spokesperson?** | Người phát ngôn? | "CEO", "Marketing Lead" |

**After collecting answers** → Generate PR plan.

---

## Output Format

```markdown
# PR Plan: [Campaign Name]

📅 Date: [date]
🎯 Type: [Launch/Crisis/Awareness]
🌍 Markets: [Regions]

---

## 1. Objectives

### 1.1 Primary Goals
- [Goal 1 with metric]
- [Goal 2 with metric]

### 1.2 KPIs
| Metric | Target |
|--------|--------|
| Media mentions | X |
| Reach | X million |
| Share of voice | X% |

---

## 2. Target Audiences

| Audience | Priority | Channel |
|----------|----------|---------|
| [Audience 1] | Primary | [Channel] |
| [Audience 2] | Secondary | [Channel] |

---

## 3. Key Messages

### 3.1 Main Message
> [Core message]

### 3.2 Supporting Messages
1. [Message for audience 1]
2. [Message for audience 2]

### 3.3 Proof Points
- [Stat/fact 1]
- [Stat/fact 2]

---

## 4. Media Strategy

### 4.1 Target Media List
| Outlet | Type | Contact | Priority |
|--------|------|---------|----------|
| [Outlet 1] | [Blog/News] | [Name] | ⭐⭐⭐ |
| [Outlet 2] | [Podcast] | [Name] | ⭐⭐ |

### 4.2 Press Materials
- [ ] Press release
- [ ] Media kit
- [ ] Executive bios
- [ ] Product images
- [ ] FAQ document

---

## 5. Timeline

| Phase | Dates | Activities |
|-------|-------|------------|
| Pre-launch | Week -2 | Embargo pitches |
| Launch | Day 0 | Release, interviews |
| Post-launch | Week +1 | Follow-ups |

---

## 6. Budget

| Item | Cost |
|------|------|
| Press release distribution | $X |
| Media monitoring | $X |
| Content creation | $X |
| **Total** | $X |

---

## 7. Templates

### Press Release Headline
[Suggested headline]

### Email Pitch Template
[Ready-to-use template]
```

---

## Example

```
/ke-hoach-pr "mobile app launch"

# PR Plan: FreshFlow App Launch

## Objectives
- 50+ media mentions in first week
- 1M reach across coverage
- Top 3 in App Store Health category

## Key Message
"FreshFlow uses AI to make health tracking 
effortless - just 30 seconds a day"

## Target Media
- TechCrunch, The Verge (Tech)
- Health.com, WebMD (Health)
- Top 10 health podcasts

## Timeline
- Jan 8-12: Embargo pitches
- Jan 15: Official launch
- Jan 16-22: Interview tour
```

---

## Best Practices

1. **Newsworthy angle** - What's the story?
2. **Relationships first** - Build before pitching
3. **Timing matters** - Avoid competing news
4. **Follow up** - Persistent but respectful
5. **Measure impact** - Track all coverage
