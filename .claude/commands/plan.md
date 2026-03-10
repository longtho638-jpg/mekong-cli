---
description: Decompose goal thành subtasks với agent assignment, model routing, MCU estimate
allowed-tools: Read, Glob, Grep
---

# /plan — Smart Task Decomposer

## USAGE
```
/plan "<goal>" [--assign] [--execute]
```

## BƯỚC 1 — SCAN CONTEXT
```
□ Đọc CLAUDE.md → constraints, company context
□ Đọc .mekong/company.json → company name, tier
□ Đọc .mekong/cto-memory.md → relevant past work
□ Glob "**/*.py" hoặc relevant files (max 5) → understand codebase structure
```

## BƯỚC 2 — CLASSIFY + DECOMPOSE
Phân tích goal → chia thành subtasks độc lập nhỏ nhất.

Rule decompose:
- Mỗi subtask = 1 agent làm 1 việc rõ ràng
- Subtask nên độc lập hoặc ghi rõ `depends_on`
- Không decompose quá 8 subtasks (nếu nhiều hơn → nhóm lại)

## BƯỚC 3 — ASSIGN AGENTS + MODELS
Với mỗi subtask, assign:

```
agent_role dựa vào domain:
  code/architecture → cto
  marketing/content → cmo
  ops/infra         → coo
  finance/metrics   → cfo
  customer-facing   → cs
  long-form writing → editor
  data/reporting    → data

model dựa vào (agent + complexity):
  cto + complex  → claude-opus-4-6      (5 MCU)
  cto + standard → claude-sonnet-4-6    (3 MCU)
  cmo + any      → gemini-2.0-flash     (1 MCU)
  coo + any      → ollama:llama3.2:3b   (1 MCU)
  data + any     → ollama:qwen2.5:7b    (1 MCU)
  cs + standard  → claude-haiku-4-5    (1 MCU)
```

## BƯỚC 4 — OUTPUT PLAN TABLE

```
╔══════════════════════════════════════════════════════════════╗
║  PLAN: "{goal}"
╠══════════════════════════════════════════════════════════════╣
║  ID    AGENT/MODEL              TASK                    MCU  ║
╠══════════════════════════════════════════════════════════════╣
║  T001  CTO/Opus                 {task description}        5  ║
║  T002  CTO/Sonnet               {task description}        3  ║
║  T003  CMO/Gemini               {task description}        1  ║
║  T004  COO/Local                {task description}        1  ║
╠══════════════════════════════════════════════════════════════╣
║  Total: {n} tasks · {total} MCU · est. {time}               ║
╚══════════════════════════════════════════════════════════════╝

Dependencies:
  T002 → requires T001 complete
  T003, T004 → parallel after T001

Execution order: T001 → T002 → [T003 ∥ T004]
```

## BƯỚC 5 — CONFIRM EXECUTE

Hỏi user:
```
Execute plan? [y/N]
  y → chạy từng task theo thứ tự, dùng /cook pipeline
  N → dừng tại đây (user có thể chỉnh plan rồi chạy thủ công)
```

Nếu `--execute` flag có sẵn → tự động execute không hỏi.

Nếu user confirm `y`:
→ Chạy từng subtask theo thứ tự `execution order`
→ Mỗi task dùng `/cook` pipeline với agent + model đã assign
→ Dừng toàn bộ nếu bất kỳ task nào fail (Jidoka principle)
→ Report kết quả sau mỗi task
