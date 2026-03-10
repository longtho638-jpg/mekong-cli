---
description: Hiển thị command reference — tự detect dev vs non-tech persona
allowed-tools: Read
---

# /help — Command Reference

## BƯỚC 1 — DETECT PERSONA
```
Đọc CLAUDE.md hoặc .mekong/company.json nếu tồn tại:
  IF có flag "non_tech: true" → persona = "non-tech"
  IF primary_language = "vi" → persona = "non-tech"
  ELSE → persona = "dev"

FALLBACK: default persona = "dev"
```

## BƯỚC 2 — OUTPUT THEO PERSONA

### Non-tech output:
```
╭──────────────────────────────────────────────────────╮
│  AgencyOS — {company_name}  v4.0                    │
│  Xin chào! Dưới đây là những gì bạn có thể làm:    │
╰──────────────────────────────────────────────────────╯

✨ DÙNG NHIỀU NHẤT:
  /company run "việc bạn cần làm"
    Ví dụ: /company run "viết email marketing tuần này"
    Ví dụ: /company run "báo cáo doanh thu tháng 3"
    Ví dụ: /company run "trả lời khiếu nại khách hàng #42"

📊 XEM BÁO CÁO:
  /company report          ← Tóm tắt tuần (CEO brief)
  /company report revenue  ← Doanh thu chi tiết
  /company report agents   ← Hiệu suất từng agent

💳 BILLING:
  /company billing         ← Xem MCU balance
  /company billing topup   ← Mua thêm MCU

🤖 QUẢN LÝ AGENTS:
  /company agent list      ← Xem 8 agents
  /company agent ask cto "câu hỏi về code"

🔄 TỰ ĐỘNG HÓA:
  /company workflow list   ← Xem workflows có sẵn
  /company workflow run weekly-brief

─────────────────────────────────────────────────────
🚀 Chưa setup? Chạy: /company init  (2 phút, miễn phí)
```

### Dev output:
```
Mekong CLI × AgencyOS — v4.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TIER 0 — META
  /help [command]          This help
  /status                  System health dashboard
  /version                 Version + hybrid config

TIER 1 — DEV CORE
  /cook "<goal>"           Execute via hybrid router + MCU billing
    --agent <role>         Override: cto|cmo|coo|cfo|cs|sales|editor|data
    --model <id>           Override model
    --dry-run              Plan only, no execute
    --no-bill              No MCU deduction (dev/test)
    --strict               No retry on verify fail
    --verbose              Show routing + fallback chain
  
  /plan "<goal>"           Decompose → agent assignments + MCU estimate
    --execute              Auto-execute after planning
  
  /fix "<bug>"             Mandatory SCAN → root cause → Jidoka → minimal fix
    --file <path>          Target file
    --line <n>             Target line
    --confirmed            Bypass Jidoka gate (⚠️ dangerous)
  
  /review [<file>]         Domain-aware review checklist
    --security             Force security checklist
    --perf                 Include perf analysis
    --full                 All checklists
  
  /memory <sub> [args]     Execution memory CRUD
    search "<query>"       Semantic search
    save "<note>"          Manual save
    list [--agent <role>]  List entries
    clear --confirm        Clear all
    export                 Export to JSON

TIER 2 — COMPANY
  /company init            Setup wizard (5 questions, free)
    --reset                Reconfigure
  
  /company run "<goal>"    Universal task (dev + non-tech)
    --agent --urgent --silent --dry-run
  
  /company agent <sub>     Agent management
    list                   All 8 agents status
    status <role>          Detailed stats
    ask <role> "<q>"       Direct agent query
    train <role> --file    Inject knowledge
    handoff <from> <to>    Context handoff
    pause/resume <role>    Enable/disable
  
  /company workflow <sub>  Workflow management
    list                   All workflows
    run <n> [args]         Execute workflow
    add <n> --trigger      Register new
    log <n>                Execution history
  
  /company report [type]   Business intelligence
    brief (default) | revenue | usage | agents | health
    --period week|month|quarter
  
  /company billing [sub]   MCU + Polar management
    status | history | topup | tenants | reconcile

TIER 3 — AGI
  /agi status              9 subsystem dashboard + routing stats
  /agi benchmark           Run external benchmark suite
  /agi score               Calculate real score (not self-reported)
  /collab debate "<topic>" CTO vs CMO adversarial debate
  /collab review <file>    Multi-agent review

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ROUTING QUICK REF:
  code tasks     → CTO → claude-opus-4-6 / claude-sonnet-4-6
  content/marketing → CMO → gemini-2.0-flash
  ops/infra      → COO → ollama:llama3.2:3b (local)
  data/reports   → Data → ollama:qwen2.5:7b (local)
  customer/support → CS → claude-haiku-4-5

Docs: docs.agencyos.network
```

## BƯỚC 3 — SPECIFIC COMMAND HELP (nếu có args)
```
IF $ARGUMENTS có tên command:
  Đọc .claude/commands/{command}.md
  Extract: USAGE, FLAGS, EXAMPLES
  Print formatted help cho command đó
  
EXAMPLE: /help cook → show cook command detail
```
