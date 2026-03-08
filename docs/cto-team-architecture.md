# CTO Team Architecture — M1 16GB 4-Pane Reality

> **Thiết kế thực chất** cho MacBook M1 16GB. Không lý thuyết, không lý tưởng hoá.
> Dựa trên codebase thực: `apps/openclaw-worker/`, `config.js`, brain modules.

---

## 1. Đội Hình 4 Pane (tmux session: `tom_hum_brain`)

```
┌─────────────────────────────────────────────────────────┐
│ P0: CHAIRMAN (BẤT KHẢ XÂM PHẠM)                        │
│ Role: CTO Brain — Dispatch, Monitor, Coordinate         │
│ Process: node task-watcher.js (OpenClaw Worker)          │
│ Model: qwen3.5-plus (flagship, 1M context)               │
│ RAM: ~800MB (Node.js + file watchers)                    │
│ KHÔNG chạy CC CLI ở pane này — chỉ orchestrator          │
├──────────────────────────┬──────────────────────────────┤
│ P1: ALGO-TRADER          │ P2: WELL                     │
│ Dir: apps/algo-trader    │ Dir: apps/well               │
│ Brain: claude -p (direct)│ Brain: claude -p (direct)    │
│ Model: kimi-k2.5         │ Model: qwen3-coder-plus      │
│ RAM: ~2GB per session    │ RAM: ~2GB per session        │
├──────────────────────────┼──────────────────────────────┤
│ P3: SOPHIA               │                              │
│ Dir: apps/sophia-ai-*    │ (P3 tái dụng khi P1/P2 idle)│
│ Brain: claude -p (direct)│                              │
│ Model: qwen3-coder-next  │                              │
│ RAM: ~2GB per session    │                              │
└──────────────────────────┴──────────────────────────────┘
```

### RAM Budget (16GB thực tế)

| Component | RAM | Ghi chú |
|-----------|-----|---------|
| macOS + System | ~4GB | Không thể giảm |
| P0 Chairman (Node.js) | ~800MB | task-watcher + watchers + health server |
| P1 Worker (CC CLI) | ~2GB | claude -p subprocess |
| P2 Worker (CC CLI) | ~2GB | claude -p subprocess |
| P3 Worker (CC CLI) | ~2GB | claude -p subprocess |
| Antigravity Proxy | ~200MB | Port 20129 → 20128 |
| Buffer (thermal headroom) | ~5GB | M1 thermal throttle prevention |
| **Tổng** | **~16GB** | **MAX 3 CLI đồng thời** |

**Quy tắc cứng:** Max 3 CC CLI workers cùng lúc. Nếu RAM < 200MB free → m1-cooling-daemon tự kill.

---

## 2. P0 Chairman — Chức Năng CTO Thực Chất

### 2.1 Biết Ai Đang Làm Gì (tmux Awareness)

P0 KHÔNG dùng tmux send-keys (đã bị cấm theo RULE 2 của TOM_HUM_DESIGN_RULES). Thay vào đó:

**Cơ chế giám sát:**
```
P0 đọc trạng thái từ:
├── /tmp/tom_hum_mission_P1.json   # {project, task, started_at, status}
├── /tmp/tom_hum_mission_P2.json
├── /tmp/tom_hum_mission_P3.json
├── ~/tom_hum_cto.log              # Unified log (tail -f)
└── brain-health-server.js :9090   # GET /health, GET /metrics
```

**Mỗi worker khi bắt đầu/kết thúc mission:**
1. `mission-dispatcher.js` ghi atomic JSON vào `/tmp/tom_hum_mission_P{N}.json`
2. Format: `{pane, project, task_summary, started_at, estimated_timeout, status}`
3. P0 poll file này mỗi 500ms (đã có `POLL_INTERVAL_MS: 500`)

**Dashboard lệnh (P0 terminal):**
```bash
# Xem trạng thái tất cả workers
cat /tmp/tom_hum_mission_P{1,2,3}.json | jq -s '.'

# Xem log realtime
node lib/live-mission-viewer.js
```

### 2.2 Scan Thực Tế Rồi Phân Công (Reality-First Dispatch)

**Trước khi phân công mission, P0 PHẢI scan:**

```javascript
// Trong mission-dispatcher.js — buildPrompt() enhancement
async function scanBeforeDispatch(projectDir) {
  const checks = {
    // 1. Git status — có uncommitted changes không?
    gitDirty: execSync(`cd ${projectDir} && git status --porcelain`).toString().trim(),
    // 2. Test suite — pass hay fail?
    testResult: execSync(`cd ${projectDir} && npm test --silent 2>&1 || true`).toString(),
    // 3. Build — compilable không?
    buildOk: execSync(`cd ${projectDir} && npm run build --silent 2>&1 || true`).toString(),
  };
  return checks;
}
```

**Phân công dựa trên kết quả scan:**

| Scan Result | Action |
|-------------|--------|
| git dirty + test fail | `/fix` mission — ưu tiên cao |
| git clean + test pass | `/cook` mission — feature mới |
| build fail | BLOCK — không dispatch cho đến khi fix |
| test flaky (pass/fail ngẫu nhiên) | `/debug` mission — investigate |

**Routing theo project:**

| Keyword trong mission file | Pane | Project Dir |
|---------------------------|------|-------------|
| `algo-trader`, `trading`, `algo` | P1 | `apps/algo-trader` |
| `well`, `wellness`, `health` | P2 | `apps/well` |
| `sophia`, `ai-factory` | P3 | `apps/sophia-ai-factory` |
| `mekong`, `cli`, `core` | P1 (khi idle) | mekong-cli root |
| `openclaw`, `tom-hum` | **CẤM** — P0 tự xử lý | `apps/openclaw-worker` |

### 2.3 Track Progress Từng Worker

**File-based progress tracking (không cần DB):**

```
~/.openclaw/progress/
├── P1-current.json    # {task_id, phase, percent, last_output_at}
├── P2-current.json
├── P3-current.json
└── history.jsonl       # Append-only log mọi mission outcomes
```

**Progress signals từ worker output:**
- `✓ Step [N]:` → update percent
- `DONE` / `Complete` → mission finished
- `ERROR` / `FAILED` → trigger escalation
- Output hash stagnation (>5min same output) → `brain-output-hash-stagnation-watchdog.js` detect

**P0 dashboard format:**
```
┌─────────────────────────────────────────────┐
│ CTO DASHBOARD — 2026-03-09 00:42            │
├──────┬──────────┬───────┬──────┬────────────┤
│ Pane │ Project  │ Task  │ %    │ Status     │
├──────┼──────────┼───────┼──────┼────────────┤
│ P1   │ algo-tr  │ #047  │ 60%  │ RUNNING    │
│ P2   │ well     │ #023  │ 100% │ VERIFYING  │
│ P3   │ sophia   │ idle  │ —    │ AVAILABLE  │
└──────┴──────────┴───────┴──────┴────────────┘
RAM: 11.2/16GB | Load: 3.4 | Temp: 72°C
```

### 2.4 Phối Hợp Giữa Workers

**Kịch bản cần phối hợp:**

| Tình huống | P0 Action |
|------------|-----------|
| P1 cần API từ P2 đang build | P0 queue P1 mission, chờ P2 xong |
| P2 và P3 cùng sửa shared lib | P0 serialize — P2 trước, P3 sau |
| P1 xong feature, cần P2 test | P0 tạo test mission cho P2 |
| Shared dependency update | P0 broadcast STOP → update → RESUME |

**Inter-worker dependency file:**
```json
// ~/.openclaw/dependencies.json
{
  "P1-algo-047": {
    "depends_on": null,
    "blocks": ["P2-well-024"]
  },
  "P2-well-024": {
    "depends_on": "P1-algo-047",
    "blocks": []
  }
}
```

**P0 dispatch rule:** Không dispatch mission có `depends_on` chưa complete.

### 2.5 Escalation Khi Stuck 10 Phút

**Escalation ladder (đã có sẵn trong codebase):**

```
0-5min:   Normal — worker đang chạy
5-10min:  WARNING — brain-output-hash-stagnation-watchdog.js alert
10min:    ESCALATION LEVEL 1 — P0 gửi newline (Kickstart Protocol)
12min:    ESCALATION LEVEL 2 — P0 kill + respawn worker process
15min:    ESCALATION LEVEL 3 — P0 chuyển mission sang model mạnh hơn
           (mission-recovery.js: failover model)
20min:    ESCALATION LEVEL 4 — P0 ghi DLQ, skip mission, báo Chairman
```

**Cơ chế detect stuck (đã tồn tại):**
- `brain-output-hash-stagnation-watchdog.js` — hash output mỗi 30s, nếu 10 hash liên tiếp giống nhau = stuck
- `circuit-breaker.js` — CLOSED → OPEN sau 3 failures liên tiếp
- `brain-heartbeat.js` — file-based liveness, nếu heartbeat >60s = dead

**Escalation output:**
```
🚨 ESCALATION P2 (well) — stuck 10min on task #023
  Last output: "Running npm test..." (lặp 10x)
  Action: Kickstart sent → waiting 2min
  Next: Kill + respawn if no progress
```

### 2.6 RAM Budget Enforcement

**m1-cooling-daemon.js (chạy mỗi 90s):**

```javascript
// Đã tồn tại trong codebase
// Thresholds:
const LOAD_THRESHOLD = 8;     // system load average
const RAM_MIN_FREE_MB = 200;  // minimum free RAM

// Actions:
// 1. Kill resource hogs: pyrefly, pyright, eslint_d
// 2. Nếu vẫn quá tải → kill youngest CC CLI worker (P3 first)
// 3. Log thermal event → ~/tom_hum_thermal.log
```

**P0 RAM management policy:**

| Free RAM | Action |
|----------|--------|
| >4GB | All 3 workers active |
| 2-4GB | Max 2 workers, P3 paused |
| 1-2GB | Max 1 worker, P2+P3 paused |
| <1GB | EMERGENCY — kill all workers, cool down 60s |
| <200MB | HARD STOP — m1-cooling-daemon kills everything |

---

## 3. Mission Lifecycle (End-to-End)

```
1. Mission file đặt vào tasks/
   └─ Format: PRIORITY_mission_PROJECT_description.txt
   └─ Ví dụ: HIGH_mission_algo-trader_fix-backtest-engine.txt

2. P0 task-queue.js detect → FIFO + priority sort

3. P0 pre-dispatch scan:
   ├─ Check RAM budget → đủ chỗ cho worker?
   ├─ Check dependencies → mission bị block?
   ├─ Scan project (git status, test, build)
   └─ Select pane (P1/P2/P3 theo routing table)

4. P0 dispatch:
   ├─ Ghi /tmp/tom_hum_mission_P{N}.json (status: RUNNING)
   ├─ Spawn: claude -p "<prompt>" --model X --dangerously-skip-permissions
   ├─ Stream output → ~/tom_hum_cto.log
   └─ Start stagnation watchdog

5. Worker thực thi:
   ├─ CC CLI nhận prompt (đã có /cook prefix)
   ├─ Plan → Execute → Verify (PEV loop)
   └─ Output streamed realtime

6. P0 monitor (continuous):
   ├─ Poll output hash (stuck detection)
   ├─ Track progress signals (✓ Step [N])
   ├─ Check RAM/thermal (cooling daemon)
   └─ Escalation nếu stuck >10min

7. Mission complete:
   ├─ post-mission-gate.js: npm run build → pass?
   ├─ GREEN → auto git commit (AGI L3)
   ├─ RED → tạo HIGH priority fix mission
   ├─ Ghi mission-journal.js (telemetry)
   ├─ Move file → tasks/processed/
   └─ Update /tmp/tom_hum_mission_P{N}.json (status: IDLE)

8. P0 dispatch next mission (nếu có trong queue)
```

---

## 4. Config Mapping (Thực Tế vs Thiết Kế)

| Config Key | Giá Trị Hiện Tại | Thay Đổi Cần Thiết |
|------------|-------------------|---------------------|
| `PROJECTS` | 6 projects | Giữ nguyên, routing bằng keyword |
| `POLL_INTERVAL_MS` | 500ms | OK — balanced |
| `MISSION_TIMEOUT_MS` | 60min | OK — 風林火山 tiers |
| `COOLING_INTERVAL_MS` | 90s | OK |
| `MAX_CONCURRENT` | 2 (hiện tại) | **Tăng lên 3** (max 3 CLI) |
| `BRAIN_MODE` | direct | Giữ direct — tmux đã bị cấm |
| `ENGINE` | antigravity | OK — DashScope via adapter |

---

## 5. Khác Biệt vs Hiện Trạng

| Aspect | Hiện Tại (v22+) | Thiết Kế Mới |
|--------|-----------------|--------------|
| Pane layout | P0=log, P1-P3=workers | P0=Chairman brain, P1-P3=workers |
| P0 role | Passive log viewer | Active CTO orchestrator |
| Max concurrent | 2 missions | 3 missions (RAM-gated) |
| Pre-dispatch scan | Không | git status + test + build |
| Progress tracking | Log-based only | Structured JSON per-pane |
| Inter-worker deps | Không | dependency.json tracking |
| Escalation | Stagnation watchdog only | 4-level ladder (10/12/15/20min) |
| RAM management | Cooling daemon kills hogs | Policy-based worker scaling |

---

## 6. Rủi Ro & Giới Hạn

| Rủi Ro | Mức Độ | Mitigation |
|--------|--------|------------|
| 3 CLI = RAM sát ngưỡng | CAO | m1-cooling-daemon + policy scaling |
| Pre-dispatch scan chậm (npm test) | TRUNG BÌNH | Cache test results 5min |
| Worker stuck không detect | THẤP | Stagnation watchdog đã có |
| Mission file race condition | THẤP | Atomic write + FIFO queue |
| Model rate limit (DashScope) | TRUNG BÌNH | Round-robin 20 models (ĐIỀU 57) |

---

## Câu Hỏi Chưa Giải Quyết

1. **Pre-dispatch scan timeout?** — `npm test` có thể mất 2-5 phút. Chạy async hay blocking?
2. **P0 tự code được không?** — Nếu openclaw-worker cần fix, P0 dispatch cho chính nó hay delegate P1?
3. **Dependency cycle detection?** — Nếu P1 depends P2 và P2 depends P1 → deadlock. Cần cycle detection?
4. **History retention?** — `history.jsonl` grow vô hạn. Cần rotation policy (30 ngày? 1000 entries?)?
5. **Multi-repo git conflict?** — P1 và P2 cùng sửa shared package. Merge strategy?

---

_Tạo: 2026-03-09 | Dựa trên: config.js v1.1.0, OpenClaw Worker v22+, TOM_HUM_DESIGN_RULES v17_
_Tác giả: Chairman directive — CHỈ DOCS, KHÔNG CODE_
