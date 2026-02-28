# 🦞 TÔM HÙM (OpenClaw) — DESIGN RULES VĨNH VIỄN v17

> TUYỆT ĐỐI. KHÔNG thay đổi trừ Chairman directive.

---

## RULE 1: DISPATCH — JSON STREAM INJECTION

### Architecture:

```
VS Code Terminal:  bash tom-hum-cc.sh  (CC CLI live, "xe xịn")
Task Watcher:      append JSON → /tmp/tom_hum_stream_in.jsonl
```

### VS Code Terminal (User chạy 1 lần):

```bash
bash /Users/macbookprom1/mekong-cli/scripts/tom-hum-cc.sh
```

Lệnh bên trong:

```bash
tail -f /tmp/tom_hum_stream_in.jsonl | \
  claude -p --model claude-opus-4-6-thinking \
  --dangerously-skip-permissions \
  --input-format stream-json \
  --output-format stream-json \
  --verbose
```

### JSON Message Format (from source cli.js:7291):

```json
{
  "type": "user",
  "message": { "role": "user", "content": "/binh-phap implement: ... /cook" }
}
```

### Node.js inject:

```javascript
const msg = JSON.stringify({
  type: "user",
  message: { role: "user", content: prompt },
});
fs.appendFileSync("/tmp/tom_hum_stream_in.jsonl", msg + "\n");
```

### Fallback (khi gateway chưa bật):

```bash
cat prompt.txt | claude -p --output-format json
```

---

## RULE 2: CẤM TUYỆT ĐỐI

| Method                               | Bug                          |
| ------------------------------------ | ---------------------------- |
| ❌ `claude -p "prompt"` (argument)   | Hangs 0% CPU from background |
| ❌ `spawn('claude', ['-p', prompt])` | Same hang                    |
| ❌ tmux send-keys                    | Not official                 |
| ❌ AppleScript                       | Window focus unreliable      |
| ❌ `script -q` wrapper               | Still hangs                  |

---

## RULE 3: CC CLI FLAGS CHÍNH THỨC

```
-p, --print                  Non-interactive
--input-format stream-json   JSON via stdin (PHẢI CÓ --verbose)
--output-format stream-json  JSON output events
--verbose                    Required for stream-json output
--dangerously-skip-permissions  Bypass permission checks
--model <model>              Model selection
--output-format json         Single JSON result (fallback mode)
```

---

_v17 — JSON STREAM GATEWAY (CONFIRMED WORKING)_
_Updated: 2026-02-10_
