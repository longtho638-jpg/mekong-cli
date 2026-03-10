---
description: Quản lý execution memory — search, save, list, clear, export
allowed-tools: Read, Write, Edit, Bash
---

# /memory — Execution Memory Manager

## USAGE
```
/memory <search|save|list|clear|export> [args]
```

## SUBCOMMANDS

### `search "<query>"`
```
1. Đọc .mekong/memory.json
2. Tìm entries có goal hoặc key_decisions chứa keywords từ query
3. Sort theo timestamp DESC
4. Show top 5 kết quả:

🔍 Memory search: "{query}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2026-03-10] CTO/Opus — "build JWT auth"
  Files: auth.py, middleware.py
  Decision: Used PyJWT, 24h expiry

[2026-03-08] CMO/Gemini — "viết blog launch"
  Files: blog-launch.md
  Decision: Vietnamese + English bilingual
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### `save "<note>"`
```
1. Đọc .mekong/memory.json (tạo nếu chưa có)
2. Append entry:
   {
     "goal": "[manual] {note}",
     "agent": "human",
     "model": "manual",
     "files_touched": [],
     "key_decisions": ["{note}"],
     "timestamp": "{iso_now}"
   }
3. Print: ✅ Saved to memory
```

### `list [--agent <role>] [--limit <n>]`
```
1. Đọc .mekong/memory.json
2. IF --agent: filter theo agent_role
3. Sort DESC by timestamp
4. Show limit (default 10) entries:

📚 Memory (last {n} entries)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
2026-03-10  cto    "build rate limiting"      claude-opus-4-6
2026-03-09  cmo    "write launch email"       gemini-2.0-flash
2026-03-08  data   "monthly revenue report"   qwen2.5:7b
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: {n} entries
```

### `clear [--confirm]`
```
IF NOT --confirm:
  Print: "⚠️  Xóa toàn bộ memory. Gõ /memory clear --confirm để xác nhận."
  DỪNG

IF --confirm:
  Backup file: .mekong/memory-backup-{date}.json
  Reset .mekong/memory.json → []
  Print: "✅ Memory cleared. Backup: .mekong/memory-backup-{date}.json"
```

### `export`
```
1. Đọc .mekong/memory.json
2. Write to .mekong/memory-export-{date}.json (formatted JSON)
3. Print: "✅ Exported {n} entries → .mekong/memory-export-{date}.json"
```

## AUTO-SAVE (được gọi bởi /cook sau mỗi task thành công)
Format chuẩn lưu vào `.mekong/memory.json`:
```json
{
  "goal": "string",
  "agent": "cto|cmo|coo|...",
  "model": "claude-opus-4-6|...",
  "files_touched": ["path/to/file"],
  "key_decisions": ["decision 1", "decision 2"],
  "mcu_charged": 3,
  "timestamp": "2026-03-10T10:30:00Z"
}
```
