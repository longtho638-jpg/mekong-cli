---
description: Business intelligence reports — CEO brief, revenue, usage, agent performance, health
allowed-tools: Read, Bash
---

# /company report — Business Intelligence

## USAGE
```
/company report [revenue|usage|agents|health|brief] [--period week|month|quarter]
```

Default nếu không có args: `brief` + `week`

## DATA SOURCES
```
Đọc trước khi generate bất kỳ report nào:
  □ .mekong/mcu_ledger.json       → transaction history
  □ .mekong/mcu_balance.json      → current balance
  □ .mekong/memory.json           → task execution history
  □ .mekong/activity.log          → raw activity log (nếu có)
  □ .mekong/company.json          → company info
```

## REPORT TYPES

### `brief` (DEFAULT — CEO Summary)
Route đến `data` agent. Tổng hợp tất cả metrics:

```
📊 {period.upper()} BRIEF — {company_name}
{date_range}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 REVENUE
  MRR        : ${mrr}  ({+/- pct}% vs prev period)
  New users  : {n}
  Churn      : {n} ({pct}%)

⚡ USAGE
  Tasks done : {n} ({success_rate}% success)
  MCU used   : {n} (cost: ${llm_cost})
  Top task   : "{most_common_goal_type}"

🤖 AGENTS
  Most active: {agent} ({n} tasks)
  Best margin: {agent} ({pct}%)
  Needs help : {agent if success_rate < 85%}

🏥 HEALTH
  Uptime     : {pct}%
  Errors     : {n} ({top_error_type})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TOP 3 ACTIONS NEXT {period}:
  1. {data agent recommendation}
  2. {data agent recommendation}
  3. {data agent recommendation}
```

### `revenue`
```
💰 REVENUE REPORT — {period}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MRR breakdown by tier:
  Starter ({n} users × $49)  : ${amount}
  Growth  ({n} users × $149) : ${amount}
  Premium ({n} users × $499) : ${amount}
  ─────────────────────────────
  Total MRR                  : ${total}
  ARR projection             : ${total * 12}

Churn analysis:
  Churned this period : {n} users (${revenue_lost})
  Reason (if known)  : {from memory/logs}

LTV estimate:
  Avg subscription length : {months}
  LTV per customer        : ${avg_mrr * months}

MCU upsell revenue:
  MCU packs sold          : {n}
  Revenue                 : ${amount}
```

### `usage`
```
⚡ USAGE REPORT — {period}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tasks by agent:
  CTO    : {n} tasks  ({n} MCU)  ${cost}
  CMO    : {n} tasks  ({n} MCU)  ${cost}
  COO    : {n} tasks  ({n} MCU)  ${cost}
  (... all 8 agents)

Model usage:
  claude-opus-4-6    : {n} calls  ${cost}
  claude-sonnet-4-6  : {n} calls  ${cost}
  gemini-2.0-flash   : {n} calls  ${cost}
  ollama (local)     : {n} calls  $0.00
  ─────────────────────────────────────
  Total LLM cost     : ${total}
  MCU revenue        : ${total_mcu * 0.049}
  Margin             : ${margin} ({pct}%)

Top task categories:
  1. {category} — {n} tasks
  2. {category} — {n} tasks
  3. {category} — {n} tasks
```

### `agents`
```
🤖 AGENT PERFORMANCE — {period}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Agent   Tasks  Success  Avg MCU  Avg Latency  Model
CTO       47    94%       3.8     12.3s        opus/sonnet
CMO       23    96%       1.2      4.1s        gemini
COO       89    99%       1.0      2.8s        llama (local)
CFO       12    92%       1.1      3.2s        qwen (local)
CS       134    91%       1.0      3.5s        haiku
Sales     31    88%       1.3      4.8s        haiku
Editor    18    95%       1.4      5.2s        gemini
Data      56    97%       1.1      6.1s        qwen (local)

⚠️  Alert: Sales success rate 88% < 90% threshold
   → Recommendation: Review sales agent prompt, add FAQ context
```

### `health`
```
🏥 SYSTEM HEALTH — {period}
━━━━━━━━━━━━━━━━━━━━━━━━━━
API Uptime    : {pct}%
Error rate    : {pct}% ({n} errors)
Top error     : {error_type}

MCU gate:
  Locks       : {n}
  Confirms    : {n}
  Refunds     : {n} (fail rate: {pct}%)

Fallback activations:
  Total       : {n}
  Reason      : {top_reason}
  
Ollama local:
  Requests    : {n}
  Avg VRAM    : {pct}%
  Downgrade   : {n} times (VRAM >85%)
```

## AUTO-SAVE
Lưu mọi report vào `.mekong/reports/{date}-{type}.md`
