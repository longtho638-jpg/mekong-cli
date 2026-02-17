# 🏯 QUÂN LUẬT TÔM HÙM — 9 ĐIỀU QUÂN LỆNH

> **"Binh vô kỷ luật, tất bại"** — Quân không có kỷ luật, ắt thua
>
> Bộ luật tối cao cho mọi agent trong doanh trại OpenClaw
> Effective: 2026-02-11 | Version: 1.0.0

---

## ĐIỀU 1: PHỤC TÙNG CHỈ HUY (Chain of Command)

```
👑 CHỦ SOÁI (Antigravity/Gemini)     — Ra lệnh chiến lược
   └── 🧠 QUÂN SƯ (Brain-Tmux)       — Điều phối chiến thuật
       ├── ⚔️ TƯỚNG 0 (CC CLI Pane 0) — Opus/Sonnet — Heavy missions
       └── ⚔️ TƯỚNG 1 (CC CLI Pane 1) — Sonnet      — Light missions
           └── 🐾 QUÂN (11 Daemons)   — Flash/Kimi  — Recon & signals
```

**Quy tắc:**

- Daemon KHÔNG ĐƯỢC tự ý dispatch mission vào CC CLI pane
- Daemon CHỈ tạo mission files → task-queue xử lý
- Brain-Tmux quyết định pane nào nhận mission
- Chủ Soái override mọi quyết định

---

## ĐIỀU 2: BẨM BÁO MINH BẠCH (Signal Protocol)

**Mọi daemon PHẢI emit pheromone signal theo format chuẩn:**

```javascript
const signal = {
	id: `sig_${Date.now()}_${randomId}`,
	timestamp: Date.now(),
	from: 'agent_<DAEMON_NAME>', // e.g. 'agent_hunter'
	to: '<TARGET_DAEMON>', // e.g. 'builder', 'dispatcher', 'all'
	type: '<SIGNAL_TYPE>', // BUG_REPORT | REVIEW_REQUEST | HEALTH_ALERT | INTEL
	priority: 'LOW|MEDIUM|HIGH|CRITICAL',
	payload: {
		/* structured data */
	},
	rank: '<RANK>', // TRINH_SAT | CONG_BINH | HIEN_BINH | etc.
};
```

**Vi phạm:** Daemon chạy mà không emit signal = **đào ngũ** → restart + warning log.

---

## ĐIỀU 3: LÃNH THỔ PHÂN MINH (Territory)

| Daemon     | Lãnh Thổ                   | CẤM xâm phạm       |
| :--------- | :------------------------- | :----------------- |
| hunter     | Code patterns (regex scan) | Không sửa code     |
| builder    | Tech debt files            | Không review       |
| reviewer   | Code quality audit         | Không fix          |
| architect  | System structure           | Không implement    |
| artist     | CSS/UI/screenshots         | Không backend      |
| diplomat   | Documentation files        | Không code         |
| merchant   | Payment/revenue data       | Không deploy       |
| operator   | System health/processes    | Không code changes |
| sage       | Knowledge base/KIs         | Không operational  |
| scribe     | Logs/memory                | Không delete       |
| dispatcher | Task queue ordering        | Không execute      |

**Quy tắc:** Daemon A phát hiện vấn đề thuộc lãnh thổ Daemon B → emit signal TO Daemon B, KHÔNG tự xử lý.

---

## ĐIỀU 4: LƯƠNG THỰC TIẾT KIỆM (Token Budget)

```yaml
budget_tiers:
  FREE:     # Quân sĩ (Daemons) — Gemini Flash 2.5 / Kimi K2.5
    - hunter-scanner (verification calls)
    - builder, reviewer, diplomat, merchant
    - architect, artist, operator, sage, scribe
    max_tokens_per_call: 2000
    model: 'gemini-2.5-flash' | 'moonshotai/kimi-k2.5'

  PREMIUM:  # Tướng lĩnh (CC CLI Panes)
    pane_0: 'claude-sonnet-4-5'      # Heavy missions
    pane_1: 'claude-sonnet-4-5'      # Light missions
    max_tokens_per_mission: 200000

  SUPREME:  # Chủ Soái (Antigravity direct)
    model: 'gemini-2.5-pro' | 'claude-opus-4-6-thinking'
    # Only for strategic planning, NOT operational tasks
```

**Vi phạm:** Daemon dùng model PREMIUM = **phản quân** → kill process.

---

## ĐIỀU 5: DOANH TRẠI SẠCH SẼ (Clean Camp)

```yaml
queue_discipline:
  max_queue_size: 3 # Per daemon type
  max_total_pending: 15 # Across all daemons
  processed_retention: 24h # Auto-cleanup
  log_rotation: daily # Max 50MB per log file

camp_hygiene:
  - Scribe rotates logs mỗi 24h
  - Operator checks disk space mỗi 5min
  - Auto-cleanup processed/ missions > 24h old
  - Dead letter queue cho failed missions
```

---

## ĐIỀU 6: CANH GÁC NGHIÊM NGẶT (Health Checks)

**Operator daemon là LÍNH CANH BẮT BUỘC:**

```yaml
health_checks:
  cpu_temp: { threshold: 85, action: 'ALL_HALT' }
  disk_usage: { threshold: 90%, action: 'ALERT_CRITICAL' }
  memory_usage: { threshold: 85%, action: 'ALERT_HIGH' }
  proxy_health: { endpoint: 'http://localhost:8080/health', interval: 60s }
  tmux_alive: { check: 'tmux has-session', interval: 30s }
  cc_cli_responsive: { check: 'pane prompt exists', interval: 60s }
```

**Vi phạm:** Operator không report health > 10min = **bỏ vọng gác** → auto-restart.

---

## ĐIỀU 7: KẾ HOẠCH TRƯỚC, CHIẾN ĐẤU SAU (Plan First)

```yaml
mission_routing:
  simple: '/cook "task" --auto' # console_log, debug_errors
  medium: '/cook "task" --auto' # type_safety, a11y, i18n
  complex: '/plan:hard "task"' # security, perf, tech_debt
  strategic: '/binh-phap implement: task' # architecture, redesign

complexity_detection:
  complex_keywords: [refactor, redesign, migrate, rewrite, architecture, security audit]
  medium_keywords: [feature, implement, security, multi-file, integration, api]
  # Everything else = simple
```

---

## ĐIỀU 8: LIÊN LẠC KHÔNG ĐỨT (Communication)

```yaml
logging_mandate:
  format: '[TIMESTAMP] [RANK] [DAEMON_NAME] MESSAGE'
  example: '[13:45:02] [TRINH_SAT] [HUNTER] 🎯 Target Verified: /api/route.ts (high)'

  files:
    hunter: ~/hunter.log
    builder: ~/builder.log
    dispatcher: ~/dispatcher.log
    task-watcher: ~/tom_hum_cto.log
    all_daemons: ~/tom_hum_signals.log # Aggregated signal log

  rotation: daily, max 50MB
```

---

## ĐIỀU 9: HÀNH QUÂN THEO NHỊP (Cadence)

```yaml
thermal_protocol:
  safe: '<75°C → Full speed'
  warm: '75-85°C → Reduce frequency 50%'
  hot: '>85°C → ALL HALT until <70°C'

mission_cadence:
  cooldown_between_missions: 60s (simple) / 90s (medium) / 120s (complex)
  hourly_budget: 8 missions max (2 panes × 4 each)
  burst_protection: Max 3 missions in 10min

respect_order:
  - M1 cooling ALWAYS overrides mission urgency
  - Queue ordering ALWAYS from dispatcher (no daemon can jump queue)
  - Chủ Soái can override ALL rules via direct command
```


---

## ĐIỀU 10: CLAUDEKIT BẮT BUỘC — CẤM QUÊN (Chairman Decree 2026-02-17)

> **🔒 IRON RULE — KHÔNG AGENT NÀO ĐƯỢC QUÊN, KỂ CẢ CTO**

```yaml
claudekit_mandate:
  # MỌI task PHẢI dùng ClaudeKit command — CẤM gửi raw text
  commands:
    simple:    '/cook "task" --auto'
    medium:    '/cook "task" --auto'
    complex:   '/plan:hard "task"'
    strategic: '/plan:parallel "task"' hoặc '/binh-phap implement: task'
    debug:     '/debug "issue"'
    review:    '/review "target"'

  multi_threading:
    # ĐA LUỒNG BẮT BUỘC khi load < 12
    enabled: true
    min_subagents: 3      # Tối thiểu 3 subagents
    max_subagents: 10+    # Commander Rule 13: ÁM ẢNH efficiency
    mode: 'parallel'       # Chạy đồng thời, KHÔNG tuần tự

  deep_thinking:
    # DEEP 10x REASONING BẮT BUỘC
    enabled: true
    model_preference: 'claude-sonnet-4-5'  # Qua AG Proxy dual-Ultra
    thinking_budget: 'extended'
    chain_of_thought: true

vi_pham:
  # Agent gửi raw text không có ClaudeKit command = PHẢN QUÂN
  action: 'BLOCK dispatch + warning log + auto-retry với đúng command'
```

**Không ngoại lệ. Không override. Chairman đã lệnh.**

---

_Quân Luật Tôm Hùm v1.1.0 | Doanh Trại OpenClaw | 2026-02-17_
_Updated: +ĐIỀU 10 ClaudeKit Bắt Buộc (Chairman Decree)_
