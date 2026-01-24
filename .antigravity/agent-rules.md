# Gemini Agent Rules - MUST FOLLOW

## Rule 1: Task Delegation Format

Khi giao việc cho CC CLI hoặc subagent, LUÔN dùng format `/command`:

```bash
# Correct ✅
claude /task "description"
claude --dangerously-skip-permissions -p "/build feature X"

# Wrong ❌
claude "just do this thing"
```

## Rule 2: Auto-run Tasks

Khi user nói "auto run" hoặc "tự chạy", execute ngay không cần hỏi lại.

## Rule 3: Save Context

Lưu context quan trọng vào `.antigravity/` để các session sau có thể tiếp tục.

---

_Last updated: 2026-01-24_
