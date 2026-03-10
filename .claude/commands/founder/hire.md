---
description: Tuyển dụng agentic — JD tự viết, interview kit tự generate, contractor brief tự tạo
allowed-tools: Read, Write
---

# /founder hire — Hiring Intelligence

## USAGE
```
/founder hire [--role "<title>"] [--type fulltime|contractor|agent] [--level junior|mid|senior]
```

## PHILOSOPHY: HIRE AGENTS FIRST, HUMANS SECOND

```
Before hiring any human, ask:
  1. Can this be an OpenClaw agent? (/company agent add)
  2. Can this be a contractor for 1 project? (/founder hire --type contractor)
  3. Only then: hire fulltime

Decision tree:
  Repeatable, predictable task → AGENT (free after setup)
  Project-based, finite scope  → CONTRACTOR ($200-500/day, no benefits)
  Core, strategic, irreplaceable → FULLTIME (last resort)

For solo founder at <$10K MRR: ONLY agents + contractors.
```

## BƯỚC 0 — SCAN
```
□ Đọc .mekong/company.json    → stage, product_type
□ Đọc .mekong/reports/        → current revenue (can we afford?)
□ Đọc .mekong/memory.json     → what tasks are taking human time?

IF --type agent:
  Redirect to: /company agent train
  Print: "→ Adding a new AI agent is free. Dùng /company agent train."
  DỪNG (don't waste MCU on job posting)
```

## BƯỚC 1 — ROLE DEFINITION

**Agent: COO / sonnet / 2 MCU**

```
INPUTS:
  role_title : {from flag or ask}
  role_type  : fulltime | contractor
  level      : junior | mid | senior
  context    : what problem does this role solve?

DEFINE:
  1. Core mission (1 sentence — what does success look like?)
  2. Must-have skills (3-5, non-negotiable)
  3. Nice-to-have (3-5, can be trained)
  4. Anti-requirements (what kind of person would fail here?)
  5. Key metrics (how do we know they're doing well?)
  6. What they'll do in first 30/60/90 days
```

## BƯỚC 2 — JOB DESCRIPTION

**Agent: CMO + COO / gemini + sonnet / 2 MCU**

```
FILE: .mekong/hire/{role}-{date}/jd.md

STRUCTURE:

HOOK (2-3 sentences — makes them want to read more):
  Don't start with "We are looking for..."
  Start with: the problem they'll solve or the impact they'll have
  Example: "We're a solo-founder company that does {impressive_metric}.
  You'd be the {n}th person who actually moves revenue."

ABOUT THE COMPANY (3-4 sentences):
  What we do, traction proof, team size, culture
  Be honest about stage: "We're early. Things break. Fast movers thrive."

THE ROLE (bullet points):
  □ {responsibility 1}
  □ {responsibility 2}
  □ First 30 days: {specific deliverable}

WHAT SUCCESS LOOKS LIKE AT 90 DAYS:
  □ {measurable outcome 1}
  □ {measurable outcome 2}

MUST HAVE:
  □ {non-negotiable skill}

NICE TO HAVE:
  □ {bonus skill}

WE OFFER:
  Salary: ${range} (be specific — saves everyone time)
  Equity: {range} or "none at this stage"
  Remote: yes/no/hybrid
  {Other real benefits}

HOW TO APPLY:
  Email: {email} with subject "{role} — {your name}"
  Include: {3 specific things to include}
  No cover letter needed. Just {specific ask}.
```

## BƯỚC 3 — INTERVIEW KIT

**Agent: CTO (for tech) / COO (for ops) / sonnet / 2 MCU**

```
FILE: .mekong/hire/{role}-{date}/interview-kit.md

STAGE 1 — SCREENING CALL (20 min, human does this):
  Purpose: filter obvious mismatches
  
  Questions:
  1. "Walk me through your last relevant project."
     → Listen for: specifics, ownership language ("I built" vs "we tried")
  
  2. "What's the hardest technical/operational problem you've solved?"
     → Listen for: clarity of thinking, depth
  
  3. "Why this role, why now?"
     → Red flag: vague answer, doesn't know our product
  
  4. Salary check: "Our range is ${range}. Does that work?"
     → Do this early. Don't waste both people's time.

STAGE 2 — WORK SAMPLE (take-home or live):
  Type: {skill_test based on role}
  
  FOR DEVELOPER:
    Task: "{specific small task related to the job}"
    Time: 2-3 hours
    Evaluate: code quality, communication, approach
    Grade: pass/fail rubric provided
  
  FOR MARKETER:
    Task: "Write a launch post for {our product} targeting {ICP}"
    Time: 1-2 hours
    Evaluate: voice match, insight, clarity
    Grade: pass/fail rubric
  
  FOR OPS:
    Task: "Design a process for {specific recurring task}"
    Time: 1 hour
    Evaluate: clarity, edge cases, efficiency
  
  RUBRIC (fill before evaluating, to avoid bias):
    □ Does the output accomplish the core goal? (0-3)
    □ Is the quality acceptable for shipping? (0-3)
    □ Does it show initiative / going beyond minimum? (0-3)
    □ Is communication clear throughout? (0-3)
    Threshold: 8/12 = proceed, < 8 = pass

STAGE 3 — DEEP DIVE (45 min, human + candidate):
  FOR EACH: let them ask questions too (quality of their questions = signal)
  
  TECHNICAL DEPTH QUESTIONS:
  "{role-specific deep question}"
  → Evaluate: can they go deep? do they know what they don't know?
  
  JUDGMENT QUESTIONS:
  "Tell me about a time you disagreed with your manager. What did you do?"
  → Listen for: intellectual honesty, constructive approach
  
  "What would you have done differently at your last job?"
  → Red flag: "Nothing, it was great" or blaming others
  
  REFERENCE CHECK QUESTIONS (call their reference):
  "On a scale 1-10, how likely would you rehire {name}? Why not a 10?"
  "What's the biggest area for growth for {name}?"
  → Any hesitation or vague answers = red flag

OFFER FRAMEWORK:
  IF all stages pass:
    Written offer: salary + start date + vesting (if any)
    Deadline: 72 hours to accept
    
  IF unsure after stage 3:
    Don't hire. Regret passes. Bad hires don't.
```

## BƯỚC 4 — CONTRACTOR BRIEF (--type contractor)

```
FILE: .mekong/hire/{role}-{date}/contractor-brief.md

PROJECT BRIEF — {role_title}
Duration: {weeks} weeks
Rate: ${day_rate}/day
Total budget: ${total}

DELIVERABLES (be specific):
  □ {deliverable 1} by {date}
  □ {deliverable 2} by {date}
  □ Final handoff: {what we get at end}

DEFINITION OF DONE:
  □ {specific acceptance criteria}
  □ Code reviewed and merged (if dev)
  □ Documentation complete

WORKING STYLE:
  Communication: async via {channel}
  Check-ins: {n}/week, 30 min each
  Tools access: {list}

PAYMENT TERMS:
  50% upfront, 50% on completion
  Invoice via: {method}

PROTECT IP:
  All work product belongs to {company_name}
  Sign NDA + IP assignment before starting
```

## BƯỚC 5 — POST JOB

**Agent: CMO / gemini / 1 MCU**

```
WHERE TO POST (ranked by ROI for early-stage):
  
  Free, high quality:
    □ Hacker News "Who's hiring?" thread (monthly, huge reach for tech)
    □ Twitter/X: tweet JD with hashtags
    □ LinkedIn post (your network first)
    □ relevant Slack/Discord communities (ask admin permission)
  
  Paid, worth it:
    □ Remoteok.io ($200-400, 30 days)
    □ We Work Remotely ($299, 30 days)
    □ Contra (contractor-friendly, revenue share model)
  
  For Vietnam/SEA-based:
    □ ITviec (tech, Vietnam)
    □ TopDev (Vietnam tech)
    □ LinkedIn Vietnam groups
    □ Facebook: Vietnam Developer Community, VietTech
  
  Generate post for each channel:
    /cook "social media post for this JD: {jd_file}" --agent cmo
```

## OUTPUT

```
✅ Hiring Kit Ready — {role_title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 .mekong/hire/{role}-{date}/
  ✓ jd.md           ← ready to post
  ✓ interview-kit.md ← 3-stage process
  ✓ work-sample.md   ← specific test
  ✓ grading-rubric.md← score card
  ✓ posting-plan.md  ← where + when to post
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 MCU: -3 (balance: {remaining})

REMINDER: Consider agents first.
→ /company agent train {role} --file expertise.md
  (free, no salary, no equity, works 24/7)
```
