---
description: Weekly CEO rhythm — Monday brief, priorities, agent tasklist, Friday review. Human does 20%.
allowed-tools: Read, Write, Bash
---

# /founder week — Weekly CEO Operating Rhythm

## USAGE
```
/founder week [--day mon|fri] [--simulate]
```

Default: auto-detect day. Monday = morning brief. Friday = end-of-week review.
`--simulate` = run as if it's Monday (for testing)

## PHILOSOPHY: THE 20% RULE

```
OpenClaw does 80%:
  □ Generates the brief
  □ Proposes the priorities
  □ Pre-writes all agent tasks
  □ Queues workflows for the week
  □ Prepares all materials for human decisions

Human does 20%:
  □ Reads the brief (5 min)
  □ Approves or redirects priorities (5 min)
  □ Makes 3 strategic decisions (10 min)
  □ Signs off on anything requiring human judgment (10 min)
  
Total human time: 30 min/week for full company operation.
```

---

## MONDAY MORNING BRIEF

**Trigger:** `/founder week` on Monday (or `/founder week --day mon`)
**Agents:** Data + CFO + CMO / local models / 5 MCU total
**Runtime:** ~3-4 minutes

### STEP 1 — COLLECT ALL DATA

```bash
# Gather all state in parallel

# Revenue
cat .mekong/mcu_ledger.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
week_ago = ... # filter last 7 days
print(sum(t['mcu'] for t in week_ago if t['type']=='confirm'))
"

# Tasks completed last week
cat .mekong/memory.json | python3 -c "..."

# Git velocity
git log --oneline --since="7 days ago" | wc -l

# System health
curl -s http://localhost:11434/api/tags | head -1
```

### STEP 2 — GENERATE MONDAY BRIEF

```
╔══════════════════════════════════════════════════════════════╗
║  MONDAY BRIEF — {company_name}                              ║
║  Week {n} · {date_range}                                    ║
╠══════════════════════════════════════════════════════════════╣
║  💰 REVENUE                                                  ║
║  MRR         : ${current_mrr}                               ║
║  WoW change  : {+/-pct}% ({direction} {dollar_change})     ║
║  Runway       : {months} months at current burn             ║
║  MCU used/wk : {n} ({llm_cost_usd} LLM cost)              ║
║  MCU margin   : {pct}%                                      ║
╠══════════════════════════════════════════════════════════════╣
║  ⚡ LAST WEEK — OpenClaw completed:                          ║
║  Tasks done  : {n} ({success_rate}% success)               ║
║  Code shipped: {n} commits, {n} features/fixes             ║
║  Content out : {n} posts/emails/messages                   ║
║  Customers   : {n} new, {n} churned (net: {+/-n})         ║
╠══════════════════════════════════════════════════════════════╣
║  🚨 NEEDS YOUR ATTENTION (Human 20%):                       ║
║  1. {most important issue — flagged by agent}               ║
║  2. {second issue}                                          ║
║  3. {third issue}                                           ║
╠══════════════════════════════════════════════════════════════╣
║  🤖 THIS WEEK — OpenClaw will run:                          ║
║  Mon: {pre-queued task 1}                                   ║
║  Tue: {pre-queued task 2}                                   ║
║  Wed: {pre-queued task 3}                                   ║
║  Thu: {pre-queued task 4}                                   ║
║  Fri: Weekly review brief                                   ║
╠══════════════════════════════════════════════════════════════╣
║  📌 PROPOSED PRIORITIES THIS WEEK:                          ║
║  P1: {highest impact item} — {why}                         ║
║  P2: {second priority} — {why}                             ║
║  P3: {third priority} — {why}                              ║
╚══════════════════════════════════════════════════════════════╝

→ Approve priorities? [y/edit/redirect]:
```

### STEP 3 — HUMAN APPROVAL FLOW

```
IF human types "y":
  → Queue all 5 daily tasks automatically
  → Print: "✅ Week {n} approved. OpenClaw running."
  → Save priorities to .mekong/founder/priorities-{week}.md

IF human types "edit":
  → Show priorities editable
  → Human changes P1/P2/P3
  → Re-queue tasks accordingly

IF human types "redirect":
  → Free text: "Focus on X instead of Y"
  → CMO/COO agent re-plans the week around new direction
  → Re-show brief for second approval

IF human types specific task:
  → Add to queue for today
  → /cook "{task}" (immediate execution)
```

### STEP 4 — PRE-QUEUE WEEKLY TASKS

OpenClaw auto-generates based on current state:

```
RULE ENGINE — what to queue:

IF mrr_growth < 5% WoW:
  → Queue: /founder grow --channel cold (Sales agent, 20 emails)
  → Queue: /cook "analyze why growth slowed" --agent data

IF bug_count > 0 in memory:
  → Queue: /fix on each open bug (CTO agent)

IF last_blog_post > 7 days ago:
  → Queue: /founder grow --channel content (1 blog post)

IF credits_tracker has TODO items:
  → Queue: /founder outreach to {credit_program} (apply)

IF churn > 0 last week:
  → Queue: /founder churn --analyze (Data + CS agents)

IF mrr > prev_milestone:
  → Queue: update investors via /founder raise --update
  → Queue: /launch tweet about milestone (CMO agent)

ALWAYS QUEUE:
  Mon AM: Brief (this command)
  Fri PM: /founder week --day fri (review)
  If product deployed last week: /founder pr (announce)
```

---

## FRIDAY REVIEW

**Trigger:** `/founder week --day fri`
**Agents:** Data / local / 2 MCU

```
╔══════════════════════════════════════════════════════════════╗
║  FRIDAY REVIEW — Week {n}                                   ║
╠══════════════════════════════════════════════════════════════╣
║  PRIORITIES SET MONDAY:                                      ║
║  P1: {priority} → {DONE ✅ / PARTIAL ⚠️ / MISSED ❌}       ║
║  P2: {priority} → {status}                                  ║
║  P3: {priority} → {status}                                  ║
╠══════════════════════════════════════════════════════════════╣
║  WHAT WORKED:                                                ║
║  + {experiment that showed positive signal}                 ║
║  + {agent that performed above average}                     ║
╠══════════════════════════════════════════════════════════════╣
║  WHAT DIDN'T:                                               ║
║  - {what failed or underperformed}                          ║
║  - {agent or workflow that needs adjustment}                ║
╠══════════════════════════════════════════════════════════════╣
║  LEARNING:                                                   ║
║  {1-2 sentence insight to carry into next week}             ║
╠══════════════════════════════════════════════════════════════╣
║  NEXT WEEK PREVIEW:                                          ║
║  Will auto-queue: {list based on this week's outcomes}      ║
╚══════════════════════════════════════════════════════════════╝

Save to: .mekong/founder/weeks/week-{n}-review.md
```

---

## INVESTOR UPDATE (monthly, auto-triggered)

**Agent: CFO + CMO / sonnet + gemini / 3 MCU**

Triggered when: week number % 4 == 0 (monthly)

```
FILE: .mekong/raise/investor-updates/update-{month}.md

Subject: {Company} Update — {Month} {Year}

HIGHLIGHTS:
  💰 MRR: ${current} ({+pct}% MoM)
  👥 Customers: {n} ({+n} new)
  ⚡ Key Win: {biggest thing that happened}

METRICS:
  {table: MRR | Users | Churn | MCU | LLM Cost | Margin}

WHAT WE DID:
  {3 bullets: biggest accomplishments}

CHALLENGES:
  {1-2 honest sentences about what's hard}

NEXT MONTH:
  {3 bullets: what we're focused on}

ASK:
  {specific request: intro, advice, resource}

——
{founder_name} | {company} | {email}
```

---

## DAILY STANDUP (optional, lightweight)

```
/founder week --day daily

30-second async standup for solo founder + agents:

Yesterday: {what OpenClaw shipped}
Today    : {what's queued for today}
Blocker  : {anything needing human input}

Log to: .mekong/founder/standups/{date}.md
```

---

## OUTPUT

```
✅ Week {n} Brief Generated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 .mekong/founder/weeks/week-{n}-brief.md
📁 .mekong/founder/priorities-week-{n}.md
💳 MCU: -5 (balance: {remaining})

HUMAN TIME REQUIRED: ~30 minutes
  □ Read brief: 5 min
  □ Approve/redirect priorities: 5 min
  □ Handle flagged issues: 20 min
  
OpenClaw handles everything else.
```
