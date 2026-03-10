---
description: Pitch deck practice với AI investor — brutal feedback, YC-style questions, improve deck
allowed-tools: Read, Write
---

# /founder pitch — AI Investor Simulation

## USAGE
```
/founder pitch [--deck <file.md>] [--investor vc|angel|yc] [--rounds <n>]
```

Default: `--investor yc --rounds 3`

## BƯỚC 0 — LOAD DECK
```
IF --deck provided:
  Đọc {file.md}
ELIF .mekong/raise/ có deck files:
  Đọc latest raise/*/deck-checklist.md + story-arc.md
ELSE:
  Hỏi: "Paste pitch deck content hoặc describe product/traction:"
  Đọc input

CONTEXT:
□ Đọc .mekong/company.json        → stage, product_type
□ Đọc .mekong/reports/ (latest)   → real metrics
□ Đọc .mekong/raise/ (if exists)  → deck content
```

## BƯỚC 1 — INVESTOR PERSONA

**Agent: Opus (for depth) / API / 5 MCU**

```
--investor yc:
  Persona: YC Partner (Michael Seibel / Dalton Caldwell style)
  Philosophy: Do Things That Don't Scale, ramen profitable, real traction
  Red flags: vanity metrics, no revenue, "we'll monetize later"
  Green flags: growth rate, retention, founder-market fit
  Style: Direct, fast, no softening

--investor vc:
  Persona: Series A VC (a16z / Sequoia style)
  Philosophy: Large market, network effects, strong team
  Red flags: small market, no moat, first-time founder doing everything alone
  Green flags: 10x potential, defensible position, clear GTM
  Style: Sophisticated, pattern-matching

--investor angel:
  Persona: Successful founder-turned-angel
  Philosophy: Bet on founder, founder-market fit, early traction
  Red flags: founder doesn't know their numbers, no customers yet
  Green flags: obsession, unfair advantage, paying customers
  Style: Mentor-like but honest
```

## BƯỚC 2 — PITCH SESSION

Format: Founder pitches → AI investor responds

```
AI Investor opens:
  "Ok, you have {3 min / 10 min / 30 min}. Go."

After founder pitch:
  AI asks questions in rapid-fire style:

YC STANDARD QUESTIONS (always ask these):
  1. "What does your company do? (30 seconds)"
     → Look for: clarity, no jargon
  
  2. "What's your traction?"
     → Look for: real numbers, growth rate
     → Probe: "What was it 3 months ago? 6 months ago?"
  
  3. "Why is now the right time for this?"
     → Look for: market timing insight
  
  4. "Why are you the right team for this?"
     → Look for: unfair advantage, domain expertise
  
  5. "What's your revenue model?"
     → Probe: "What's your CAC? LTV? Payback period?"
  
  6. "Who are your competitors? Why will you win?"
     → Look for: honest competitive analysis, not dismissal
  
  7. "What are you most worried about?"
     → Look for: self-awareness, intellectual honesty
  
  8. "What do you need from us beyond money?"
     → Look for: specific asks, not "mentorship"
  
  9. "What's your biggest assumption that could be wrong?"
     → Red flag: "We don't really have any risks"
  
  10. "If you don't raise this round, what happens?"
      → Tests: bootstrappability, burn rate discipline

CURVEBALL QUESTIONS (2-3 of these):
  "Your competitor {X} just raised $50M. How do you win?"
  "Why wouldn't I just build this myself in 6 months?"
  "Your churn is {n}%. That's high. Why?"
  "You said {traction}. Walk me through exactly how you got there."
  "What do your best customers say about you? Quote one."
  "You're a solo founder. That's a risk. Convince me otherwise."
  "What have you been wrong about in the last 6 months?"
```

## BƯỚC 3 — BRUTAL FEEDBACK

After pitch session, AI investor gives structured feedback:

```
╔══════════════════════════════════════════════════════════╗
║  PITCH FEEDBACK — Round {n}                             ║
║  Investor: {persona} | Result: {INVEST / PASS / MAYBE}  ║
╠══════════════════════════════════════════════════════════╣
║  IF INVEST: "Here's why..."                             ║
║  IF PASS: "Here's exactly why I'm passing..."           ║
║  IF MAYBE: "I need to see X before I can commit"        ║
╠══════════════════════════════════════════════════════════╣
║  WHAT WORKED:                                            ║
║  + {specific thing that was compelling}                  ║
║  + {specific thing that showed founder quality}         ║
╠══════════════════════════════════════════════════════════╣
║  WHAT KILLED IT (if pass):                              ║
║  FATAL: {the one thing that killed the deal}            ║
║  FIXABLE: {things that can be improved}                 ║
╠══════════════════════════════════════════════════════════╣
║  SLIDE-BY-SLIDE:                                        ║
║  Cover        : {feedback}                              ║
║  Problem      : {feedback}                              ║
║  Solution     : {feedback}                              ║
║  Traction     : {feedback — most important}             ║
║  Team         : {feedback}                              ║
║  Ask          : {feedback}                              ║
╠══════════════════════════════════════════════════════════╣
║  SPECIFIC REWRITES NEEDED:                              ║
║  Tagline → "{current}" should be "{suggested}"         ║
║  Traction slide: add {specific metric}                  ║
║  Team slide: explain {specific gap}                     ║
╠══════════════════════════════════════════════════════════╣
║  YOUR ANSWERS THAT HURT:                                ║
║  Q: "{question}"                                        ║
║  A: "{your answer}"                                     ║
║  Problem: {why it was weak}                             ║
║  Better: "{suggested answer}"                           ║
╚══════════════════════════════════════════════════════════╝
```

## BƯỚC 4 — ITERATE

```
IF --rounds > 1:
  "Want to do another round with the feedback incorporated? [y/N]"
  
  IF y:
    "Ok, pitch me again. Pretend it's 2 weeks later and you fixed
     {top_3_issues_from_feedback}."
    → Repeat BƯỚC 2-3
    → Compare performance across rounds
    → Show improvement delta

DRILL MODE — practice specific weaknesses:
  "Let's just practice the traction question 5 times until it's sharp."
  → Repeat just that question
  → Each time: harder follow-up
  → Grade each answer: 1-10
```

## BƯỚC 5 — SAVE SESSION

```
FILE: .mekong/raise/pitch-sessions/session-{date}.md

Content:
  Round 1 feedback: {score} | Result: {invest/pass/maybe}
  Round 2 feedback: {score} | Result: ...
  
  Key weaknesses identified:
    1. {weakness}
    2. {weakness}
  
  Deck improvements needed:
    □ {specific change}
    □ {specific change}
  
  Strongest moments:
    + {what worked best}
  
  Practice again: /founder pitch --rounds 5

Next: /cook "update pitch deck: {changes}" --agent cmo
```

## OUTPUT

```
✅ Pitch Session Complete — {n} rounds
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Final result: {INVEST / PASS / MAYBE}
Score trend : {R1: n/10 → R2: n/10 → R3: n/10}
Top 3 fixes : {list}

📁 .mekong/raise/pitch-sessions/session-{date}.md
💳 MCU: -5 per round (balance: {remaining})

RECOMMENDED:
  □ Fix top 3 issues → /cook "update deck" --agent cmo
  □ Practice 10 more rounds before real meetings
  □ Real investor: /founder raise (when score > 8/10)
```
