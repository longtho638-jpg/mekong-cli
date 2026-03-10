---
description: Chuẩn bị fundraising — pitch deck checklist, story arc, investor targeting, data room
allowed-tools: Read, Write, Bash
---

# /raise — Fundraising Prep

## USAGE
```
/raise [--stage pre-seed|seed|series-a] [--amount <n>] [--type vc|angel|bootstrap|grant]
```

Default: `--stage pre-seed --type angel`

## BƯỚC 0 — GUARD
```
IF NOT .mekong/company.json:
  Print: "❌ Chạy /company init trước"
  DỪNG
```

## BƯỚC 1 — SCAN TRACTION DATA

```
□ Đọc .mekong/company.json         → company context
□ Đọc .mekong/mcu_ledger.json      → revenue proxy (MCU = real usage)
□ Đọc .mekong/memory.json          → features shipped, milestones
□ Bash: git log --oneline | wc -l  → commit velocity
□ Bash: git log --since="30 days ago" --oneline | wc -l → recent velocity
□ Đọc .mekong/reports/ (latest)    → nếu có revenue reports

Tổng hợp traction_summary:
  mrr          : từ report hoặc "pre-revenue"
  users        : từ report hoặc "waitlist/beta"
  growth_rate  : MoM nếu có
  key_metric   : MCU usage, tasks completed, etc.
  commit_velocity: commits/month (proxy for build speed)
```

## BƯỚC 2 — CFO + CMO AGENTS

**CFO agent** → financials, unit economics
**CMO agent** → narrative, story arc, positioning

---

## PHẦN A — PITCH DECK CHECKLIST

```
CFO + CMO agents tạo checklist theo stage:

PRE-SEED (10-12 slides):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SLIDE 1 — COVER
  □ Company name + logo
  □ One-liner: "{Company} is the {category} for {audience}"
  □ Founder name + contact
  □ "Confidential — {date}"
  Status: {DONE/TODO} | Notes: ...

SLIDE 2 — PROBLEM
  □ Specific pain point (not "the market is big")
  □ Who has this problem (be specific)
  □ Current solutions and why they fail
  □ Quantify: how expensive/painful is it?
  Status: {DONE/TODO}

SLIDE 3 — SOLUTION
  □ What you do in 1 sentence
  □ Product screenshot or demo GIF
  □ 3 key benefits (not features)
  □ "Aha moment" explained
  Status: {DONE/TODO}

SLIDE 4 — MARKET SIZE
  □ TAM: total addressable market ($)
  □ SAM: your serviceable slice ($)
  □ SOM: realistic 3-year target ($)
  □ Source each number
  Status: {DONE/TODO}

SLIDE 5 — TRACTION
  □ {mrr} MRR (or users/waitlist if pre-revenue)
  □ Growth rate MoM
  □ Key milestone: "{n} customers in first {n} weeks"
  □ If pre-revenue: pilot agreements, LOIs, waitlist
  Current data: {traction_summary}
  Status: {DONE/TODO}

SLIDE 6 — BUSINESS MODEL
  □ How you charge (subscription/usage/seat)
  □ Price point and why
  □ Unit economics: CAC, LTV, payback period
  □ Gross margin target
  AgencyOS model: MCU usage-based, {margin}% GM
  Status: {DONE/TODO}

SLIDE 7 — PRODUCT
  □ Core product walkthrough (3-5 screenshots)
  □ Roadmap: next 6 months (3 milestones max)
  □ Defensibility: what makes it hard to copy
  Status: {DONE/TODO}

SLIDE 8 — COMPETITION
  □ 2x2 matrix (not feature comparison table)
  □ Honest: acknowledge strong competitors
  □ Your wedge: where you win specifically
  □ "We are different because..."
  Status: {DONE/TODO}

SLIDE 9 — GO-TO-MARKET
  □ First 100 customers: exact channel + method
  □ Distribution advantage (if any)
  □ Acquisition cost estimate
  Status: {DONE/TODO}

SLIDE 10 — TEAM
  □ Why this team for this problem
  □ Relevant experience (specific, not generic)
  □ Advisors (if any)
  □ "What's missing" (honest — shows self-awareness)
  Status: {DONE/TODO}

SLIDE 11 — THE ASK
  □ Amount: ${amount}
  □ Use of funds (3 buckets, % each)
  □ Milestone this round achieves
  □ What the next round looks like
  Status: {DONE/TODO}

SLIDE 12 — APPENDIX (optional)
  □ Technical architecture
  □ Full financial model
  □ Customer testimonials
  □ Detailed unit economics
```

## PHẦN B — STORY ARC (CMO agent)

```
Generate founding story template:

THE PROBLEM I LIVED:
  "Before {company_name}, I was trying to {specific_task}.
   I spent {time/money} on {existing_solution}, which {why_it_failed}.
   That's when I realized {insight}."

THE INSIGHT:
  "What if {bold_claim}? Not incrementally better —
   fundamentally different because {mechanism}."

THE EVIDENCE:
  "In {timeframe}, we {traction_metric}. This proves {hypothesis}."

THE VISION:
  "We're building {10-year vision}. 
   This round gets us to {12-month milestone}."

THE ASK:
  "${amount} to {3 specific things}. 
   In 18 months, we'll hit ${next_milestone_mrr} MRR — 
   ready for a ${next_round_size} Series A."
```

## PHẦN C — INVESTOR TARGETING

```
Data agent filter từ knowledge base:

Dựa trên stage + type + product_type:

PRE-SEED ANGELS (Vietnam / SEA focus):
  □ VIISA (Vietnam Silicon Valley) — viisa.vn
  □ Do Ventures — doventures.vc  
  □ Wavemaker Partners — wavemaker.vc
  □ Golden Gate Ventures — goldengate.vc
  □500 Southeast Asia — 500.co/startups/sea

PRE-SEED ANGELS (Global, SaaS/AI):
  □ YC Application (batch 2x/year) — ycombinator.com/apply
  □ Pioneer Tournament — pioneer.app
  □ Tiny.vc (bootstrapped-friendly)
  □ Calm Fund — calmfund.com

ANGEL COMMUNITIES:
  □ AngelList syndicates — angel.co
  □ ProductHunt Ship investors
  □ Indie Hackers (advice, not equity)

FOR AGENCYOS SPECIFICALLY (AI + SaaS + solo-first):
  Priority targets:
  1. YC application — fits "ramen profitable" thesis
  2. Pioneer Tournament — fits solo builder profile
  3. Do Ventures — Vietnam base, SEA expansion story
  4. AI-focused angels via Twitter/X outreach

Outreach template (Sales agent sẽ generate):
  Subject: {product_name} — {traction_hook}
  Body: 5 sentences max
    S1: What you do + who for
    S2: Traction number (one specific metric)
    S3: Why now + market timing
    S4: The ask (intro? 30-min call?)
    S5: Link to deck
```

## PHẦN D — DATA ROOM SETUP

```
Data room checklist → .mekong/raise/data-room/

□ pitch-deck.pdf          ← từ checklist Phần A
□ financial-model.xlsx    ← /cook "create financial model" --agent cfo
□ cap-table.csv           ← founders equity, any existing investors
□ product-demo.mp4        ← 3-5 min loom
□ customer-evidence/      ← emails, testimonials, usage screenshots
□ technical-architecture/ ← from README or /cook "architecture diagram"
□ legal/                  ← incorporation docs, IP assignments
```

## BƯỚC 3 — OUTPUT

Lưu vào `.mekong/raise/`:
```
raise-{date}/
  deck-checklist.md      ← slide-by-slide checklist với current status
  story-arc.md           ← founder story template
  investor-targets.md    ← tiered list với contact/apply links
  outreach-template.md   ← cold email template (Sales agent)
  data-room-checklist.md ← document list
```

Print summary:
```
🚀 FUNDRAISING PREP — {company_name}
Stage: {stage} | Target: ${amount}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DECK STATUS:
  {n}/12 slides: DONE
  {n}/12 slides: TODO

TRACTION SNAPSHOT:
  {key_traction_metric}
  Build velocity: {commits}/mo last 30 days

INVESTOR PIPELINE:
  {n} targets identified
  Priority: {top_3_investors}

DATA ROOM:
  {n}/{total} documents ready

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 Saved: .mekong/raise/raise-{date}/
💳 MCU: -3 (balance: {remaining})

Next actions:
  1. /cook "complete slide {n}: {topic}" --agent cmo
  2. /company agent ask cfo "model unit economics for deck"
  3. /launch --tier ph (launch before raise = leverage)
```
