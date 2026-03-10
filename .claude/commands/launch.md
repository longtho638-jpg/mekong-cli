---
description: Tạo launch copy cho Product Hunt, Hacker News, Reddit và các platform khác
allowed-tools: Read, Write, Bash
---

# /launch — Product Launch Publisher

## USAGE
```
/launch "<product_name>" [--tier ph|hn|reddit|all] [--tagline "<tagline>"] [--dry-run]
```

## BƯỚC 0 — GUARD
```
IF NOT .mekong/company.json:
  Print: "❌ Chạy /company init trước"
  DỪNG
```

## BƯỚC 1 — SCAN PRODUCT CONTEXT
```
□ Đọc .mekong/company.json      → company_name, product_type, primary_language
□ Đọc README.md (nếu có)        → product description, features
□ Đọc CLAUDE.md                 → constraints, tone
□ Đọc .mekong/agents/cmo.md     → brand voice

Tổng hợp:
  product_name     = $ARGUMENTS hoặc company_name
  product_type     = từ company.json
  key_features     = top 3 từ README hoặc hỏi user
  target_audience  = infer từ product_type
  tagline          = --tagline flag hoặc generate
```

## BƯỚC 2 — DETECT PLATFORMS

```
IF --tier không có → default = "all"

Platform map:
  ph     → Product Hunt
  hn     → Hacker News (Show HN)
  reddit → relevant subreddits (auto-detect từ product_type)
  all    → ph + hn + reddit + bonus platforms
```

## BƯỚC 3 — CMO AGENT GENERATE COPY

**Agent:** CMO / gemini-2.0-flash / 1-3 MCU

Prompt template giao cho CMO agent:
```
You are CMO of {company_name}. Generate launch copy for {product_name}.

Context:
  Product: {product_description}
  Type: {product_type}
  Audience: {target_audience}
  Key features: {key_features}
  Tone: {from brand guidelines}

Generate launch copy for each platform below.
Follow EXACT format constraints — these are hard limits, not guidelines.
```

### OUTPUT PER PLATFORM:

---

**PRODUCT HUNT:**
```
Format rules (hard limits):
  Name      : ≤60 chars, no buzzwords
  Tagline   : ≤60 chars, verb-first, no "revolutionary/AI-powered"
  Description: 260-300 chars, benefit-focused, 1 CTA
  Topics    : exactly 3, from PH taxonomy
  First comment: 150-200 words, founder story + what makes it different

Output:
  NAME: {product_name}
  TAGLINE: {tagline}
  DESCRIPTION: {260-300 chars}
  TOPICS: [{topic1}, {topic2}, {topic3}]
  FIRST COMMENT:
  {150-200 word founder comment}
```

**HACKER NEWS (Show HN):**
```
Format rules:
  Title : "Show HN: {product_name} – {what it does in plain English}"
          Max 80 chars. No marketing language. No exclamation marks.
  Body  : 3 paragraphs
    P1: What it is (1-2 sentences, technical, honest)
    P2: Why you built it (personal motivation, specific problem)
    P3: What you want feedback on (genuine question to HN community)
  Tone  : Engineer-to-engineer. Humble. No hype.

Output:
  TITLE: Show HN: {title}
  
  BODY:
  {P1}
  
  {P2}
  
  {P3}
```

**REDDIT:**
```
Auto-select subreddits based on product_type:
  SaaS/API          → r/SaaS, r/startups, r/Entrepreneur
  Dev tool          → r/programming, r/webdev, r/SideProject
  AI product        → r/artificial, r/MachineLearning, r/SideProject
  No-code           → r/nocode, r/startups, r/Entrepreneur
  B2B               → r/Entrepreneur, r/smallbusiness

Per subreddit, generate:
  Title  : platform-specific (r/SaaS = benefit-focused, r/programming = technical)
  Body   : 150-200 words
    - Problem context (1 para)
    - Solution (1 para)
    - Honest ask: "Would love feedback" or "Free for early users"
  Flair  : suggest correct flair for each sub

Output:
  r/{subreddit1}:
    TITLE: {title}
    BODY: {body}
    FLAIR: {flair}
  
  r/{subreddit2}: ...
```

**BONUS PLATFORMS (nếu --tier all):**
```
Indie Hackers:
  Title  : "I built {product} to solve {problem} — here's what I learned"
  Format : milestone post style
  Length : 300-400 words, include numbers if available

BetaList / BetaPage:
  Tagline : ≤100 chars
  Description : 150 chars
  Category : auto-detect

DEV.to (nếu dev tool):
  Title  : tutorial/story angle
  Tags   : 4 tags
  Hook   : first 2 sentences = grab attention
```

## BƯỚC 4 — OUTPUT FILE

Lưu tất cả copy vào:
```
.mekong/launch/
  {product_name}-{date}/
    product-hunt.md
    hacker-news.md
    reddit.md
    indie-hackers.md   (nếu all)
    bonus.md           (nếu all)
    launch-checklist.md
```

**launch-checklist.md** (auto-generated):
```markdown
# Launch Checklist — {product_name}

## T-7 days
□ Setup Product Hunt profile (coming soon page)
□ Schedule PH launch for Tuesday 12:01 AM PST
□ Prepare Reddit accounts with karma > 100
□ Draft email to existing users/waitlist

## Launch day
□ Post Product Hunt (12:01 AM PST)
□ Comment on PH immediately (first-comment.md)
□ Post Show HN (9 AM EST — peak HN time)
□ Post Reddit r/SaaS, r/startups (stagger 2h apart)
□ Post Indie Hackers

## Post-launch
□ Reply to every comment within 2h
□ Update launch-results.md with metrics
□ Follow up with interested users
```

## BƯỚC 5 — SUMMARY

```
✅ Launch copy ready: {product_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 Saved: .mekong/launch/{product_name}-{date}/
📝 Files: {n} platform copies + checklist
💳 MCU: -{mcu} (balance: {remaining})

Platforms:
  ✓ Product Hunt    → .mekong/launch/.../product-hunt.md
  ✓ Hacker News     → .mekong/launch/.../hacker-news.md
  ✓ Reddit (3 subs) → .mekong/launch/.../reddit.md
  ✓ Indie Hackers   → .mekong/launch/.../indie-hackers.md
  ✓ Checklist       → .mekong/launch/.../launch-checklist.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next: Review copy → /review .mekong/launch/{product_name}-{date}/
```
