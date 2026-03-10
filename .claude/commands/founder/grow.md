---
description: GTM playbook execution — cold outreach, content, SEO, community, partnerships
allowed-tools: Read, Write, Bash
---

# /founder grow — GTM Execution Engine

## USAGE
```
/founder grow [--channel <type>] [--target <n_leads>] [--week <n>]
```

Channels: `cold | content | seo | community | partner | all`

## BƯỚC 0 — SCAN TRACTION STATE
```
□ Đọc .mekong/company.json          → stage, product_type
□ Đọc .mekong/reports/ (latest)     → current MRR, users, churn
□ Đọc .mekong/founder/persona.json  → ICP
□ Đọc .mekong/validate/             → customer language, pain points
□ Đọc .mekong/memory.json           → past growth experiments

Tính:
  current_mrr  = từ report
  target_mrr   = $1M ARR / 12 = $83K MRR
  gap_mrr      = target - current
  leads_needed = gap / avg_deal_size (infer từ pricing)
```

## CHANNEL PLAYBOOKS

---

### CHANNEL: COLD OUTREACH
**Agent: Sales / haiku / 2 MCU per batch**

```
/founder grow --channel cold --target 50

WEEK 1 COLD SEQUENCE:

STEP 1 — Build prospect list (Data agent):
  Sources:
    □ LinkedIn Sales Navigator equivalent (manual for now)
    □ GitHub: search repos using {relevant_tech}
    □ ProductHunt: recent launches in your category
    □ Twitter: people who tweet about {pain_keyword}
    □ Reddit: commenters in r/{relevant_sub}
  
  Output: .mekong/grow/cold/prospects-{date}.csv
  Format: Name, Title, Company, Email/Twitter, Source, Priority(1-3)

STEP 2 — Personalization signals (Data agent):
  For each prospect, find:
    □ Recent tweet/post they made
    □ Company recent news
    □ Shared interest/tool
  
STEP 3 — Email sequence (Sales agent generates):
  DAY 1 — First touch (personalized):
    Subject: Re: {their recent thing} + {your hook}
    Body: 
      Line 1: Specific observation about them/their work
      Line 2: Connect to problem you solve
      Line 3: Social proof (1 metric or customer name)
      Line 4: Soft CTA ("Worth a 15-min chat?")
    Length: ≤5 sentences
  
  DAY 4 — Follow up (if no reply):
    Subject: Quick follow up
    Body: 2 sentences + different angle
  
  DAY 8 — Breakup email:
    "I'll stop reaching out — but if {pain_point} ever becomes
     a priority, I'm here. {link}"

STEP 4 — Send + track:
  Tool: Resend API (via COO agent) or manual
  Track: open rate, reply rate, meeting booked
  Target: reply rate >5% = good sequence

METRICS DASHBOARD:
  Prospects targeted : {n}
  Emails sent        : {n}
  Reply rate         : {pct}%
  Meetings booked    : {n}
  Pipeline value     : ${mrr_potential}
```

---

### CHANNEL: CONTENT MARKETING
**Agent: CMO + Editor / gemini / 2 MCU per piece**

```
/founder grow --channel content

CONTENT STRATEGY (CMO agent generates):

Step 1 — Keyword + topic map (Data agent):
  From validate interviews → extract exact phrases customers use
  Map to content pillars:
    Pillar 1: {problem category} (awareness)
    Pillar 2: {solution category} (consideration)
    Pillar 3: {use case category} (decision)

Step 2 — Content calendar (CMO agent):
  WEEK 1-4 SPRINT:
    Mon: 1 long-form blog post (1500-2000 words) → Hashnode/dev.to
    Wed: 3 Twitter/X threads from blog content
    Fri: 1 LinkedIn post with data/insight
    Weekend: 1 YouTube/Loom tutorial (script only, human records)
  
  Content types per channel:
    Blog (Hashnode): Technical depth, SEO-optimized, dev audience
    Twitter/X: Insight threads, build-in-public, memes
    LinkedIn: B2B insights, founder story, company milestones
    Reddit: Authentic value, no promo first 5 comments
    YouTube: Tutorials, demos, founder vlogs (highest conversion)

Step 3 — Content production (/cook pipeline):
  /cook "write 1500-word blog post about {topic}" --agent editor
  /cook "turn this blog into 5-tweet thread: {blog}" --agent cmo
  /cook "LinkedIn post from this insight: {data}" --agent cmo

DISTRIBUTION CHECKLIST per post:
  □ Post to primary platform
  □ Cross-post to 2 secondary
  □ Share in 2 relevant Slack/Discord communities (genuine, no spam)
  □ DM to 5 specific people who'd find it useful
  □ Add to email newsletter (if exists)
```

---

### CHANNEL: SEO
**Agent: Data + Editor / qwen + gemini / 3 MCU**

```
/founder grow --channel seo

SEO SPRINT:

Step 1 — Keyword research (Data agent):
  Seed keywords từ customer interviews
  
  Priority matrix:
    HIGH PRIORITY: high intent + low competition (volume 100-1000/mo)
    MEDIUM: high volume + medium competition
    SKIP: "best AI tools 2026" type — too competitive

  Output: .mekong/grow/seo/keyword-map.md
  Format: Keyword | Monthly Vol | Difficulty | Intent | Priority

Step 2 — Content brief per keyword (Editor agent):
  For top 10 keywords, generate:
    Title (H1): {keyword-optimized but natural}
    Meta description: 150-160 chars
    Outline: H2s, H3s, word count target
    Internal links: 3-5 to existing content
    Target featured snippet: question to answer
  
  Output: .mekong/grow/seo/briefs/{keyword}.md

Step 3 — Technical SEO audit (COO agent, bash):
  Check:
  □ sitemap.xml exists at /sitemap.xml
  □ robots.txt configured
  □ Page speed (Lighthouse score > 90)
  □ Mobile-friendly
  □ Core Web Vitals passing
  □ Canonical tags on all pages
  □ Alt text on all images
  
  Output: .mekong/grow/seo/technical-audit.md

Step 4 — Backlink strategy (CMO agent):
  □ Guest post targets: 10 blogs in your niche
  □ Tool directories to submit to: 20 relevant lists
  □ Podcast outreach: 5 founder/tech podcasts
  □ HARO/SourceBottle: reporter queries
```

---

### CHANNEL: COMMUNITY
**Agent: CMO + CS / gemini + haiku / 2 MCU**

```
/founder grow --channel community

COMMUNITY SEEDING:

Step 1 — Map communities (Data agent):
  Find 10 communities where ICP lives:
    Type: Slack, Discord, Reddit, Facebook Groups, LinkedIn Groups
    Criteria: 1000+ members, active (post/day > 5)
    Filter: {product_type} relevant communities
  
  Output list with: name, platform, size, activity, join link

Step 2 — Engagement plan (CMO agent):
  Rule: Give value 10x before promoting once.
  
  Week 1-2: Join, observe, introduce yourself (no mention of product)
  Week 3-4: Answer 3 questions/day in your expertise area
  Week 5:   Share useful resource (could be your content, not blog)
  Week 6+:  Natural mention when directly relevant

  Scripts per community type:
    Intro post template: "I'm {name}, building {category}.
      I've been {relevant experience}. Here to learn and share."
    
    Value post template: "Solved this exact problem last week —
      here's what worked: {genuine insight}"
    
    Soft CTA: "We're actually building something for this —
      happy to share early access if you're dealing with this"

Step 3 — Own community (long-term):
  When to start: After 100+ users
  Platform: Discord (free, developer-friendly)
  Structure:
    #general      → conversations
    #show-and-tell → members share builds
    #feedback     → product feedback
    #jobs         → hiring (monetization later)
  
  Launch strategy:
    Invite first 50 users personally
    Weekly "office hours" async (post update + Q&A)
    Monthly founder AMA
```

---

### CHANNEL: PARTNERSHIP
**Agent: Sales + CMO / haiku + gemini / 2 MCU**

```
/founder grow --channel partner

PARTNERSHIP PLAYBOOK:

Types ranked by effort vs return:
  1. Integration partners (highest ROI)
     Find: tools your customers already use
     Pitch: "Our users want your tool. Integration = mutual benefit."
     Ask: co-marketing, listing on each other's site

  2. Complementary product bundles
     Find: non-competing products to same ICP
     Structure: cross-promote to each other's lists

  3. Affiliate/referral partners
     Find: consultants, agencies serving your ICP
     Offer: 20-30% recurring revenue share
     Tool: PartnerStack or manual tracking

  4. Distribution partnerships
     Find: platforms where your ICP already is
     Ask: featured listing, newsletter mention

OUTREACH TEMPLATE (CMO generates):
  Subject: Partnership idea — {their product} × {your product}
  Body:
    "We both serve {shared ICP}.
     We've been recommending {their product} to our users.
     Thought there might be a mutual opportunity here.
     Happy to get on a 20-min call?"
```

## OUTPUT DASHBOARD

```
📈 GROWTH ENGINE STATUS — {company_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current MRR: ${current_mrr}
Target MRR: ${target_mrr} (${gap_mrr} gap)
Leads needed: {n}/mo to close gap

ACTIVE CHANNELS:
  Cold outreach : {status} | {n} in pipeline | ${pipeline_value}
  Content       : {n} posts live | avg {n} views
  SEO           : {n} keywords tracked | avg position {n}
  Community     : {n} communities | {n} engaged members
  Partnerships  : {n} active | {n} in negotiation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 .mekong/grow/
💳 MCU: -{mcu} (balance: {remaining})

NEXT 7 DAYS (OpenClaw runs this):
  Mon: /founder grow --channel cold (batch of 20 emails)
  Tue: /cook "blog post: {topic}" --agent editor
  Wed: /founder grow --channel community (answer 10 questions)
  Thu: /cook "twitter thread from blog" --agent cmo
  Fri: /company report growth
```
