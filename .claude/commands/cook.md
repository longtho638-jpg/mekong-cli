---
description: Execute any goal via hybrid LLM router → PEV pipeline → MCU billing
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# /cook — Universal Task Executor

**Đọc lệnh này trước khi làm bất cứ điều gì.**

## USAGE
```
/cook "<goal>" [--agent <role>] [--model <id>] [--dry-run] [--no-bill] [--strict] [--verbose]
```

## BƯỚC 0 — PARSE INPUT
Đọc `$ARGUMENTS`. Tách:
- `goal` = chuỗi text chính (bắt buộc)
- flags: `--agent`, `--model`, `--dry-run`, `--no-bill`, `--strict`, `--verbose`

Nếu không có goal → in: `❌ Thiếu goal. Dùng: /cook "mô tả việc cần làm"`  rồi DỪNG.

## BƯỚC 1 — SCAN (BẮT BUỘC, KHÔNG ĐƯỢC BỎ QUA)
```
SCAN checklist:
□ Đọc CLAUDE.md (nếu tồn tại) → lấy company context, constraints
□ Đọc .mekong/company.json (nếu tồn tại) → lấy company name, tier, language
□ Đọc .openclaw/config.json (nếu tồn tại) → lấy model routing config
□ Đọc .mekong/cto-memory.md (nếu tồn tại) → lấy relevant past decisions
□ Check MCU balance: đọc .mekong/mcu_balance.json (nếu không có → assume sufficient)
```

**ANTI-LAZY RULE:** Không được assume. Không được skip SCAN. Nếu file không tồn tại → ghi chú và tiếp tục.

## BƯỚC 2 — CLASSIFY TASK
Phân tích `goal` để xác định:

```
domain:
  "code"     → keywords: build, fix, implement, refactor, test, API, function, bug, deploy
  "content"  → keywords: viết, write, blog, email, post, social, copy, marketing
  "ops"      → keywords: setup, configure, install, migrate, backup, monitor
  "analysis" → keywords: report, analyze, data, chart, metric, revenue, usage
  "support"  → keywords: trả lời, reply, customer, ticket, khiếu nại, issue

agent_role (default by domain):
  code     → cto
  content  → cmo (hoặc editor nếu long-form)
  ops      → coo
  analysis → data
  support  → cs

complexity:
  simple   (0-3 steps, no file creation)  → 1 MCU
  standard (4-8 steps, ≤3 files)          → 3 MCU
  complex  (9+ steps, architecture level) → 5 MCU

IF --agent flag set → override agent_role
IF --model flag set → override model selection
```

## BƯỚC 3 — DRY RUN (nếu có flag)
Nếu `--dry-run`:
```
📋 DRY RUN — Không execute, không deduct MCU

Goal    : {goal}
Domain  : {domain}
Agent   : {agent_role}
Model   : {selected_model}
MCU cost: {mcu} MCU
Steps   : (list 3-5 planned steps)

→ Chạy thật: /cook "{goal}" (bỏ --dry-run)
```
Sau đó DỪNG.

## BƯỚC 4 — MODEL SELECTION
Chọn model dựa trên routing matrix:

```
CTO + complex + public data   → claude-opus-4-6 (API)
CTO + standard                → claude-sonnet-4-6 (API)
CMO + any                     → gemini-2.0-flash (API)
COO + any                     → ollama:llama3.2:3b (Local)
CFO/Data + sensitive          → ollama:qwen2.5:7b (Local)
CS + standard                 → claude-haiku-4-5 (API)
Editor + any                  → gemini-2.0-flash (API)

OVERRIDE: IF .openclaw/config.json tồn tại → đọc routing_rules từ file đó
OVERRIDE: IF --model flag → dùng model được chỉ định
FALLBACK: Nếu model unavailable → dùng claude-sonnet-4-6
```

**Data sensitivity rule:** Nếu goal chứa: "password", "secret", "key", "token", "private", "internal", "confidential" → FORCE local model, không được gọi API.

## BƯỚC 5 — EXECUTE (PEV Pipeline)

### 5a. PLAN
Viết ra kế hoạch ngắn gọn trước khi làm:
```
🎯 Goal: {goal}
🤖 Agent: {agent_role} via {model}
📋 Steps:
  1. ...
  2. ...
  3. ...
```

### 5b. EXECUTE
Thực hiện từng bước. Rules:
- Mỗi file tạo ra: tối đa 200 lines
- Không được tạo placeholder code (`# TODO`, `pass`, `...`)
- Không được để hardcoded secrets/API keys
- Không được commit path tuyệt đối (e.g. `Users/username/...`)
- Code phải có error handling

**JIDOKA STOP-THE-LINE — DỪNG và báo CEO nếu:**
- Task đụng đến database schema migration
- Task thay đổi public API contract
- Task liên quan đến billing/payment logic
- Task có thể xóa data không recover được

```
🚨 JIDOKA STOP
Lý do: {reason}
Cần approval từ CEO trước khi tiếp tục.
Gõ: /cook "{goal}" --confirmed để bỏ qua (NGUY HIỂM)
```

### 5c. VERIFY
Sau khi execute, kiểm tra:
```
Code output:
  □ Không có syntax error
  □ Không có placeholder (TODO, pass, ...)
  □ File size < 200 lines
  □ Tests tồn tại (nếu task yêu cầu)
  □ Import statements đầy đủ

Content output:
  □ Tối thiểu 100 words
  □ Không có lorem ipsum
  □ Có CTA hoặc next step
  □ Tone phù hợp với company

Nếu verify fail:
  → Retry với reflection: "Output trước có vấn đề: {issue}. Sửa lại."
  → Max 2 retries
  → Nếu vẫn fail sau 2 retries → báo lỗi rõ ràng, KHÔNG im lặng
```

## BƯỚC 6 — BILLING
```
IF NOT --no-bill:
  Ghi vào .mekong/mcu_ledger.json:
    {
      "mission_id": "cook_{timestamp}",
      "goal": "{goal}",
      "agent": "{agent_role}",
      "model": "{model}",
      "mcu_charged": {mcu},
      "status": "completed",
      "timestamp": "{iso_timestamp}"
    }
  
  Update .mekong/mcu_balance.json:
    balance = balance - mcu_charged
```

## BƯỚC 7 — MEMORY SAVE
Lưu vào `.mekong/memory.json`:
```json
{
  "goal": "{goal}",
  "agent": "{agent_role}",
  "model": "{model}",
  "files_touched": ["{list of files created/modified}"],
  "key_decisions": ["{important decisions made}"],
  "timestamp": "{iso}"
}
```

## BƯỚC 8 — OUTPUT SUMMARY
```
✅ Done: {goal}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Agent  : {agent_role}
⚡ Model   : {model}
💳 MCU    : -{mcu} (balance: {remaining})
📁 Files  : {files_touched}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## FLAGS REFERENCE
```
--agent <role>   cto|cmo|coo|cfo|cs|sales|editor|data
--model <id>     claude-opus-4-6|claude-sonnet-4-6|gemini-2.0-flash|...
--dry-run        Classify + plan only, no execute, no MCU
--no-bill        Execute nhưng không ghi MCU ledger (dev/test mode)
--strict         Fail ngay nếu verify không pass, không retry
--verbose        Show routing decisions, fallback chain, full logs
```
