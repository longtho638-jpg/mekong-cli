---
description: Tìm và filter startup credits/programs phù hợp với tech stack, tính tổng ROI
allowed-tools: Read, Write, Bash
---

# /credits — Startup Credits Optimizer

## USAGE
```
/credits [--stack <tech,...>] [--stage pre-launch|launched|growing] [--refresh]
```

## BƯỚC 0 — GUARD
```
IF NOT .mekong/company.json:
  Print: "❌ Chạy /company init trước"
  DỪNG
```

## BƯỚC 1 — DETECT TECH STACK

```
Sources (theo thứ tự ưu tiên):
  1. --stack flag (explicit override)
  2. Đọc .mekong/company.json → infer từ product_type
  3. Bash: cat requirements.txt 2>/dev/null
  4. Bash: cat package.json 2>/dev/null | grep dependencies
  5. Bash: ls *.yml *.yaml 2>/dev/null (docker-compose, fly.toml, ...)
  6. Bash: git log --oneline -20 (tìm deploy mentions)

Build stack_profile:
  cloud      : aws | gcp | azure | fly | render | digital-ocean | ...
  database   : postgresql | mongodb | supabase | firebase | ...
  payment    : stripe | polar | paddle | lemonsqueezy | ...
  email      : resend | sendgrid | postmark | mailchimp | ...
  analytics  : posthog | mixpanel | amplitude | ...
  monitoring : sentry | datadog | uptime-robot | ...
  language   : python | node | go | ...
  framework  : fastapi | nextjs | rails | ...
  ai_infra   : anthropic | openai | google | ...

stage = --stage flag hoặc infer:
  IF no paying users → "pre-launch"
  IF .mekong/mcu_balance lifetime_used > 0 → "launched"
```

## BƯỚC 2 — CREDITS DATABASE

**QUAN TRỌNG:** Data agent dùng knowledge base này, không call external API.

```python
CREDITS_DB = [
  # CLOUD
  {
    "name": "AWS Activate",
    "url": "https://aws.amazon.com/activate/",
    "value_usd": 100000,  # Portfolio tier
    "value_starter": 1000,
    "stack": ["aws"],
    "stage": ["pre-launch", "launched"],
    "apply_time": "1-2 weeks",
    "requirements": "startup, not profitable",
    "notes": "Founders tier $1K, Portfolio tier $100K (need VC/accelerator)"
  },
  {
    "name": "Google Cloud for Startups",
    "url": "https://cloud.google.com/developers/startups/",
    "value_usd": 200000,
    "stack": ["gcp", "google", "firebase", "bigquery"],
    "stage": ["pre-launch", "launched"],
    "apply_time": "1-2 weeks",
    "notes": "Up to $200K over 2 years"
  },
  {
    "name": "Microsoft for Startups (Founders Hub)",
    "url": "https://foundershub.startups.microsoft.com/",
    "value_usd": 150000,
    "stack": ["azure", "openai", "github"],
    "stage": ["pre-launch", "launched"],
    "apply_time": "instant",
    "notes": "Includes Azure + GitHub + LinkedIn + OpenAI credits"
  },
  {
    "name": "DigitalOcean Hatch",
    "url": "https://www.digitalocean.com/hatch/",
    "value_usd": 100000,
    "stack": ["digital-ocean"],
    "stage": ["pre-launch"],
    "apply_time": "1 week"
  },
  # AI/LLM
  {
    "name": "Anthropic Startup Program",
    "url": "https://www.anthropic.com/startups",
    "value_usd": 10000,
    "stack": ["anthropic", "claude"],
    "stage": ["pre-launch", "launched"],
    "apply_time": "1-2 weeks",
    "notes": "API credits + priority support"
  },
  {
    "name": "OpenAI Startup Fund",
    "url": "https://openai.com/startups",
    "value_usd": 25000,
    "stack": ["openai"],
    "stage": ["launched"],
    "apply_time": "varies"
  },
  # DATABASE
  {
    "name": "MongoDB for Startups",
    "url": "https://www.mongodb.com/startups",
    "value_usd": 500,  # credits
    "stack": ["mongodb"],
    "stage": ["pre-launch", "launched"],
    "apply_time": "instant"
  },
  {
    "name": "Supabase Startup Program",
    "url": "https://supabase.com/partners/integrations",
    "value_usd": 300,
    "stack": ["supabase", "postgresql"],
    "stage": ["pre-launch"],
    "apply_time": "1 week"
  },
  # ANALYTICS
  {
    "name": "Mixpanel for Startups",
    "url": "https://mixpanel.com/startups/",
    "value_usd": 50000,
    "stack": ["mixpanel"],
    "stage": ["pre-launch", "launched"],
    "apply_time": "instant",
    "notes": "Free for 1 year under $8M funding"
  },
  {
    "name": "Segment Startup Program",
    "url": "https://segment.com/industry/startups/",
    "value_usd": 50000,
    "stack": ["segment"],
    "stage": ["pre-launch"],
    "apply_time": "1 week"
  },
  {
    "name": "Amplitude Startup Scholarship",
    "url": "https://amplitude.com/startups",
    "value_usd": 50000,
    "stack": ["amplitude"],
    "stage": ["pre-launch", "launched"],
    "apply_time": "1 week"
  },
  # EMAIL
  {
    "name": "SendGrid Accelerate",
    "url": "https://sendgrid.com/accelerate/",
    "value_usd": 1500,
    "stack": ["sendgrid"],
    "stage": ["pre-launch"],
    "apply_time": "1 week"
  },
  {
    "name": "Postmark Bootstrapped",
    "url": "https://postmarkapp.com/for/bootstrapped-startups",
    "value_usd": 1000,
    "stack": ["postmark"],
    "stage": ["launched"],
    "apply_time": "apply form",
    "notes": "Free 75K emails/mo for bootstrapped"
  },
  # CUSTOMER
  {
    "name": "Intercom Early Stage",
    "url": "https://www.intercom.com/early-stage",
    "value_usd": 3000,
    "stack": ["intercom"],
    "stage": ["pre-launch"],
    "apply_time": "1 week",
    "notes": "95% off for 1 year, need YC/accelerator"
  },
  {
    "name": "Zendesk for Startups",
    "url": "https://www.zendesk.com/startups/",
    "value_usd": 50000,
    "stack": ["zendesk"],
    "stage": ["pre-launch"],
    "apply_time": "1-2 weeks"
  },
  # MONITORING
  {
    "name": "Sentry Startup Program",
    "url": "https://sentry.io/lp/startups/",
    "value_usd": 26000,
    "stack": ["sentry"],
    "stage": ["pre-launch", "launched"],
    "apply_time": "instant"
  },
  {
    "name": "Datadog for Startups",
    "url": "https://www.datadoghq.com/partner/startups/",
    "value_usd": 100000,
    "stack": ["datadog"],
    "stage": ["pre-launch"],
    "apply_time": "1 week"
  },
  # MARKETING
  {
    "name": "HubSpot for Startups",
    "url": "https://www.hubspot.com/startups",
    "value_usd": 30000,
    "stack": ["hubspot"],
    "stage": ["pre-launch", "launched"],
    "apply_time": "1 week",
    "notes": "90% off year 1, 50% off year 2"
  },
  # INFRA
  {
    "name": "Heroku for Startups",
    "url": "https://www.heroku.com/accelerate",
    "value_usd": 13000,
    "stack": ["heroku"],
    "stage": ["pre-launch"],
    "apply_time": "1 week"
  },
  {
    "name": "Fly.io Launch Program",
    "url": "https://fly.io/launch",
    "value_usd": 1000,
    "stack": ["fly", "fly.io"],
    "stage": ["pre-launch"],
    "apply_time": "apply form"
  }
]
```

## BƯỚC 3 — FILTER + SCORE

**Agent:** Data / ollama:qwen2.5:7b (local) / 1 MCU

```python
Algorithm:
  1. Filter: program.stack intersects stack_profile
  2. Filter: program.stage matches current stage
  3. Score by ROI:
       roi_score = value_usd / apply_effort
       apply_effort: instant=1, 1week=2, 2weeks=3
  4. Sort DESC by roi_score
  5. Separate:
       tier_1: value >= $10,000
       tier_2: value $1,000 - $9,999
       tier_3: value < $1,000
  6. Calculate total_potential_credits = sum(all filtered)
```

## BƯỚC 4 — OUTPUT TABLE

```
💰 STARTUP CREDITS OPTIMIZER
Stack detected: {stack_list}
Stage: {stage}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 TIER 1 — Apply first (highest value)
  Program                    Value      Apply Time   ROI Score
  ──────────────────────────────────────────────────────────
  Google Cloud for Startups  $200,000   1-2 weeks    ★★★★★
  Microsoft Founders Hub     $150,000   instant      ★★★★★
  AWS Activate (Portfolio)   $100,000   1-2 weeks    ★★★★☆
  Datadog for Startups       $100,000   1 week       ★★★☆☆
  
📦 TIER 2 — Apply after Tier 1
  Mixpanel for Startups      $50,000    instant      ★★★★★
  Segment Startup            $50,000    1 week       ★★★★☆
  Sentry Startup Program     $26,000    instant      ★★★★★
  HubSpot for Startups       $30,000    1 week       ★★★★☆

💡 TIER 3 — Quick wins
  Anthropic Startup          $10,000    1-2 weeks    ★★★★☆
  Postmark Bootstrapped      $1,000     apply form   ★★★★☆

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 Total potential: ${total_formatted} in credits
⚡ Quick wins (instant): ${instant_total}
⏱ Time to apply all: ~{hours} hours

MCU: -1 (balance: {remaining})
```

## BƯỚC 5 — SAVE TRACKER

Tạo `.mekong/credits/tracker.md`:
```markdown
# Credits Tracker — {company_name}

Generated: {date}
Stack: {stack_list}

| Program | Value | Status | Applied | Notes |
|---------|-------|--------|---------|-------|
| Google Cloud | $200K | TODO | - | - |
| Microsoft Founders Hub | $150K | TODO | - | - |
...

Total potential: ${total}
Total applied: $0
Total approved: $0
```

Print:
```
📁 Tracker saved: .mekong/credits/tracker.md
→ Update status khi apply: /memory save "Applied: {program_name}"
```
