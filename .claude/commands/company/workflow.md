---
description: Trigger và quản lý automated workflows — onboard, upsell, bug-pipeline, weekly-brief, deploy
allowed-tools: Read, Write, Bash
---

# /company workflow — Automated Workflows

## USAGE
```
/company workflow [list|run|add|log] [args]
```

## BUILT-IN WORKFLOWS

```
NAME          TRIGGER                    AGENTS INVOLVED
onboard       Polar subscription.created  COO → CS → CMO
upsell        credits.low event           Data → Sales → CMO
bug-pipeline  manual / support ticket     CS → CTO → COO
weekly-brief  manual (cron Monday 8AM)    Data → CFO → CMO
deploy        manual                      CTO → COO
```

## SUBCOMMANDS

### `list`
```
Đọc .mekong/workflows/ directory (tất cả *.md files)

Output:
  📋 WORKFLOWS — {company_name}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NAME           TRIGGER           LAST RUN    STATUS
  onboard        subscription.new  2026-03-09  ✅ success
  upsell         credits.low       2026-03-08  ✅ success
  bug-pipeline   manual            2026-03-07  ✅ success
  weekly-brief   manual            2026-03-10  ✅ success
  deploy         manual            2026-03-06  ⚠️  1 warn
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  Run: /company workflow run <name> [args]
```

### `run <name> [args]`
Đọc `.mekong/workflows/{name}.md` → execute steps theo thứ tự

**BUILT-IN: `onboard`**
```
Trigger args: --tenant-id <id> --email <email> --tier <tier>

STEP 1 [COO/local]:
  Goal: "Setup new tenant {tenant_id} on tier {tier}"
  Action: Create tenant record, seed MCU balance per tier
  MCU seeded: Starter=100, Growth=500, Premium=2000

STEP 2 [CS/haiku]:
  Goal: "Write welcome email for {email} on {tier} plan"
  Output: welcome-{tenant_id}.md

STEP 3 [CMO/gemini]:
  Goal: "Create onboarding tips sequence for {tier} user"
  Output: onboarding-tips-{tier}.md

Print kết quả:
  ✅ Onboarded: {email} ({tier})
  MCU seeded: {n}
  Emails queued: 1 welcome + 3 tips
```

**BUILT-IN: `upsell`**
```
Trigger args: --tenant-id <id> --balance <n>

STEP 1 [Data/local]:
  Goal: "Analyze usage pattern for tenant {tenant_id}"
  Output: usage pattern summary

STEP 2 [Sales/haiku]:
  Goal: "Craft personalized upgrade offer based on: {usage_summary}"
  Output: upsell message

STEP 3 [CMO/gemini]:
  Goal: "Write 2 subject line variants for upsell email"
  Output: subject A + subject B

Print:
  ✅ Upsell prepared for tenant {tenant_id}
  Current balance: {n} MCU
  Recommended tier: {tier}
```

**BUILT-IN: `bug-pipeline`**
```
Trigger args: --ticket "<bug description>" [--tenant-id <id>]

STEP 1 [CS/haiku]:
  Goal: "Acknowledge bug report, draft response to tenant"
  Output: draft-response.md

STEP 2 [CTO/sonnet]:
  Goal: "Investigate and fix: {bug_description}"
  → Full /fix pipeline (mandatory SCAN + Jidoka gate)

STEP 3 [COO/local]:
  Goal: "Log bug fix to activity log, update tenant status"

Print:
  ✅ Bug pipeline complete
  Response: draft-response.md
  Fix: (summary from CTO)
```

**BUILT-IN: `weekly-brief`**
```
No required args.

STEP 1 [Data/local]:
  Goal: "Generate weekly business metrics summary"
  → Full /company report brief

STEP 2 [CFO/local]:
  Goal: "Calculate weekly LLM cost vs MCU revenue margin"

STEP 3 [CMO/gemini]:
  Goal: "Write CEO newsletter from metrics: {summary}"
  Output: .mekong/reports/weekly-{date}.md

Print:
  ✅ Weekly brief ready: .mekong/reports/weekly-{date}.md
```

**BUILT-IN: `deploy`**
```
Trigger args: --env staging|production [--service <name>]

STEP 1 [CTO/sonnet]:
  Goal: "Pre-deploy checklist for {env}"
  Check: tests pass, no TODOs, no hardcoded secrets
  → Jidoka gate: if any check fails → STOP

STEP 2 [COO/local]:
  Goal: "Deploy {service} to {env} via fly.io"
  Command: fly deploy --remote-only

STEP 3 [CTO/haiku]:
  Goal: "Smoke test {env}: check /health, /v1/missions, /v1/mcu/balance"

Print:
  ✅ Deployed to {env}
  Health: {status}
  Smoke test: {pass/fail}
```

### `add <name> --trigger <event> --steps <file.md>`
```
1. Đọc {file.md} → validate format
2. Copy to .mekong/workflows/{name}.md
3. Print: ✅ Workflow '{name}' registered. Trigger: {event}

WORKFLOW FILE FORMAT:
  ---
  name: my-workflow
  trigger: manual|<event_name>
  agents: [cto, cmo, coo]  # agents involved
  ---
  
  STEP 1 [{agent_role}/{model_hint}]:
    Goal: "{task description with {variables}}"
  
  STEP 2 [{agent_role}]:
    Goal: "{next task, can reference prev step output}"
```

### `log <name> [--limit 20]`
```
Filter .mekong/activity.log hoặc memory.json by workflow name

Output:
  📜 WORKFLOW LOG: {name} (last {n})
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  2026-03-10 08:00  ✅ success  12 MCU  onboard tenant:abc123
  2026-03-09 18:00  ✅ success   8 MCU  upsell tenant:xyz789
  2026-03-08 09:00  ❌ failed    3 MCU  deploy — smoke test fail
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Success rate: {pct}%
```
