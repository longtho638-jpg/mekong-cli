---
description: Quản lý 8 agents — list, ask, train, handoff, pause, resume
allowed-tools: Read, Write, Edit, Bash
---

# /company agent — Agent Management

## USAGE
```
/company agent <subcommand> [args]
```

## SUBCOMMANDS

### `list`
Đọc `.mekong/agents/*.md` và `.mekong/memory.json`

Output:
```
╔══════════════════════════════════════════════════════════════╗
║  Agents — {company_name}                                    ║
╠════════╦════════════╦══════════════════╦═══════╦════════════╣
║ AGENT  ║ STATUS     ║ MODEL            ║ TASKS ║ LAST ACTIVE║
╠════════╬════════════╬══════════════════╬═══════╬════════════╣
║ CTO    ║ [●] active ║ claude-opus-4-6  ║   47  ║ 2h ago    ║
║ CMO    ║ [●] active ║ gemini-flash     ║   23  ║ 1d ago    ║
║ COO    ║ [●] active ║ llama3.2:3b      ║   89  ║ 30m ago   ║
║ CFO    ║ [●] active ║ qwen2.5:7b       ║   12  ║ 3d ago    ║
║ CS     ║ [●] active ║ claude-haiku     ║  134  ║ 5m ago    ║
║ Sales  ║ [●] active ║ claude-haiku     ║   31  ║ 6h ago    ║
║ Editor ║ [✗] paused ║ gemini-flash     ║   18  ║ 5d ago    ║
║ Data   ║ [●] active ║ qwen2.5:7b       ║   56  ║ 12h ago   ║
╚════════╩════════════╩══════════════════╩═══════╩════════════╝
```

### `status <role>`
```
Đọc .mekong/agents/{role}.md + filter memory.json by agent

Output:
  Agent   : {role} ({company_name})
  Status  : active | paused
  Model   : {model}
  Prompt  : (first 3 lines of agent prompt)
  
  Last 5 tasks:
  [2026-03-10] "build rate limiting" → ✅ 5 MCU
  [2026-03-09] "fix JWT bug" → ✅ 3 MCU
  ...
  
  Stats:
  Success rate : 94%
  Avg MCU/task : 3.2
  Total tasks  : {n}
```

### `ask <role> "<question>"`
```
1. Đọc .mekong/agents/{role}.md → load agent prompt
2. Inject company context
3. Route qua /cook với agent_role = {role}
4. Deduct MCU (1-3 MCU tuỳ complexity)
5. Output câu trả lời trực tiếp

EXAMPLE:
  /company agent ask cfo "MCU margin tháng này bao nhiêu?"
  /company agent ask cto "Architecture nào tốt nhất cho rate limiting?"
  /company agent ask cs "Script trả lời khi customer hỏi về pricing?"
```

### `train <role> --file <notes.md>`
```
1. Đọc {notes.md}
2. Đọc .mekong/agents/{role}.md hiện tại
3. Append knowledge block vào cuối file:
   
   ---
   ## Additional Knowledge (added {date})
   {content from notes.md}
   ---

4. Print: ✅ Agent {role} trained with {n} lines from {notes.md}

EXAMPLE:
  /company agent train cs --file support-faq.md
  /company agent train cmo --file brand-guidelines.md
  /company agent train cto --file coding-standards.md
```

### `handoff <from_role> <to_role> "<context>"`
```
1. Save handoff note:
   .mekong/memory.json append:
   {
     "type": "handoff",
     "from": "{from_role}",
     "to": "{to_role}",
     "context": "{context}",
     "timestamp": "{iso_now}"
   }

2. Print:
   📨 Handoff saved
   From  : {from_role}
   To    : {to_role}
   Note  : {context}
   
   → {to_role} agent sẽ thấy context này trong task tiếp theo.

EXAMPLE:
  /company agent handoff cs cto "Bug: JWT expires after 5min, user ID #847 reported"
  /company agent handoff cto cmo "New feature deployed: auto-MCU-topup. Brief users."
```

### `pause <role>`
```
1. Đọc .mekong/agents/{role}.md
2. Prepend: "STATUS: PAUSED — {date}\n\n"
3. Update .openclaw/config.json: set fallback cho {role}
4. Print: ⏸ Agent {role} paused. Tasks sẽ fallback sang {fallback_role}.
```

### `resume <role>`
```
1. Đọc .mekong/agents/{role}.md
2. Remove "STATUS: PAUSED" line nếu có
3. Print: ▶️ Agent {role} resumed.
```
