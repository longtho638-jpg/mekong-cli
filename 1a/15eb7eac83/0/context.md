# Session Context

## User Prompts

### Prompt 1

Base directory for this skill: /Users/macbookprom1/.claude/skills/cook

# Cook - Smart Feature Implementation

End-to-end implementation with automatic workflow detection.

**Principles:** YAGNI, KISS, DRY | Token efficiency | Concise reports

## Usage

```
/cook <natural language task OR plan path>
```

**IMPORTANT:** If no flag is provided, the skill will use the `interactive` mode by default for the workflow.

**Optional flags to select the workflow mode:** 
- `--interactive`: Full workflow w...

### Prompt 2

[Request interrupted by user]

### Prompt 3

Fix daemon stagger bug in apps/openclaw-worker. Read swarm.sh start_swarm function, then add 10s sleep between each daemon start and 30s between echelons. Also create lib/api-rate-gate.js with file-based locking. Add API_RATE_GATE_MS=5000 to config.js.

### Prompt 4

/exit
claude --model claude-sonnet-4-5
/cook "Trả lời bằng TIẾNG VIỆT. Fix hunter-daemon.js và các daemon khác để KHÔNG tạo duplicate tasks. Hiện tại daemons chạy loop tạo hàng trăm mission files trùng nhau (đã phải dọn 328 → 42). Thêm dedup logic: trước khi tạo mission file, check xem đã có task cùng loại (cùng project + cùng type) trong tasks/ chưa. Nếu có rồi thì skip, không tạo thêm. Tối đa 5 file/mission."

### Prompt 5

[Request interrupted by user]

### Prompt 6

tail -f /Users/macbookprom1/tom_hum_cto.log

