# SUMMONING PATTERN — TRIỆU HỒI THUẬT

> **CTO = Triệu Hồi Sư.** 105+ modules Tôm Hùm = NÃO. CC CLI = XÁC.
> CTO gọi đúng NÃO, nạp vào XÁC, XÁC thực thi với chuyên môn đó.
>
> 📜 Binh Pháp Ch.13 用間: *「明君賢將，能以上智為間者，必成大功」*
> — Vua sáng tướng giỏi dùng người trí tuệ cao nhất làm gián điệp, ắt thành đại công.

---

## MỤC LỤC

1. [Kiến Trúc Tổng Quan](#1-kiến-trúc-tổng-quan)
2. [Summoning Algorithm](#2-summoning-algorithm)
3. [Squad Registry — 12 Đội Chuyên Môn](#3-squad-registry--12-đội-chuyên-môn)
4. [Module → Command Mapping (110 modules)](#4-module--command-mapping-110-modules)
5. [State-Driven Dispatch — Khi Nào Gọi Ai](#5-state-driven-dispatch--khi-nào-gọi-ai)
6. [Summoning Lifecycle](#6-summoning-lifecycle)
7. [Squad Combo Patterns](#7-squad-combo-patterns)

---

## 1. Kiến Trúc Tổng Quan

```
┌──────────────────────────────────────────────────────────────┐
│                     CTO — TRIỆU HỒI SƯ                      │
│           (auto-cto-pilot + cto-task-dispatch)               │
│                                                              │
│   Detect State → Pick Squad → Summon Module → Inject CC CLI  │
└──────────────────────┬───────────────────────────────────────┘
                       │ /command
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                   SUMMONING GATEWAY                          │
│                                                              │
│   /command → load module expertise → build system prompt     │
│           → inject into CC CLI pane as skill/context         │
└──────────────────────┬───────────────────────────────────────┘
                       │ system prompt + MISSION BRIEF
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                CC CLI PANE (XÁC — Executor)                  │
│                                                              │
│   Nhận chuyên môn + mission → code/test/commit/deploy        │
│   Xong → báo done → pane idle → Tôm Hùm ẩn                 │
└──────────────────────────────────────────────────────────────┘
```

**Nguyên lý NÃO-XÁC:**
- **NÃO** (Tôm Hùm module): Biết CHIẾN LƯỢC, biết KHI NÀO, biết TẠI SAO
- **XÁC** (CC CLI): Biết CODE, biết TEST, biết COMMIT, biết DEPLOY
- **Triệu Hồi**: CTO nạp NÃO vào XÁC → XÁC hành động với trí tuệ chuyên gia

---

## 2. Summoning Algorithm

```
INPUT:  project_state (scan results, test results, revenue data, error logs)
OUTPUT: /command → CC CLI executes with expert knowledge

ALGORITHM summon(project_state):
  1. DETECT  → Phân tích state, xác định VẤN ĐỀ/CƠ HỘI
  2. MATCH   → Ánh xạ vấn đề → Squad phù hợp
  3. SELECT  → Chọn module cụ thể trong squad
  4. INJECT  → Đọc module, trích expertise → system prompt
  5. DISPATCH→ Gửi /command + MISSION BRIEF vào CC CLI pane
  6. MONITOR → Theo dõi execution, thu thập kết quả
  7. DISMISS → Xong → clear expertise, pane trở lại idle
```

### Injection Format

Khi summon module, expertise được inject dưới dạng:

```
SUMMONED EXPERT: [module-name]
EXPERTISE DOMAIN: [mô tả chuyên môn]
BINH PHÁP CHAPTER: [章 áp dụng]
────────────────────────────
[Nội dung expertise trích từ module JSDoc + logic comments]
────────────────────────────
MISSION BRIEF: [task cụ thể từ CTO]
```

---

## 3. Squad Registry — 12 Đội Chuyên Môn

### SQUAD 1: 🧠 STRATEGIC COMMAND (Bộ Tham Mưu)
> Hoạch định, phân tích, ra quyết định chiến lược

| # | Module | Command | Vai Trò |
|---|--------|---------|---------|
| 1 | `strategic-brain.js` | `/strategist` | Tạo mission chủ động từ learning insights |
| 2 | `binh-phap-strategist.js` | `/wise-counsel` | Đánh giá chiến lược sâu bằng LLM Vision |
| 3 | `strategy-optimizer.js` | `/optimize-strategy` | Phân tích failure → correction hints |
| 4 | `swarm-intelligence.js` | `/swarm` | Điều phối đa dự án thông minh |
| 5 | `project-commander.js` | `/commander` | Chỉ huy đa dự án (AGI L7) |
| 6 | `mission-complexity-classifier.js` | `/classify-mission` | Phân loại SIMPLE/MEDIUM/COMPLEX |
| 7 | `work-order-decomposer.js` | `/decompose` | Phân rã dự án → work orders 5W1H |
| 8 | `binh-phap-registry.js` | `/binh-phap-lookup` | Tra cứu Binh Pháp DNA/ClaudeKit fusion |
| 9 | `doanh-trai-registry.js` | `/doanh-trai` | Registry phân chia quân đoàn |

### SQUAD 2: 🔍 RECONNAISSANCE (Trinh Sát)
> Scan, phát hiện vấn đề, thu thập intelligence

| # | Module | Command | Vai Trò |
|---|--------|---------|---------|
| 10 | `auto-cto-pilot.js` | `/cto-scan` | 3-phase scan: 始計→謀攻→軍形 |
| 11 | `cto-pre-dispatch-scan.js` | `/pre-scan` | Scan trước khi dispatch task |
| 12 | `cto-codebase-scanner.js` | `/codebase-scan` | Quét codebase tìm issues |
| 13 | `project-scanner.js` | `/project-scan` | AGI L4 self-planning scanner |
| 14 | `project-profiler.js` | `/profile-project` | Phân tích sức khỏe dự án |
| 15 | `project-score-calculator.js` | `/project-score` | Tính điểm RaaS AGI dự án |
| 16 | `hunter-scanner.js` | `/hunt` | Quét TODO/FIXME/console.log/secrets |
| 17 | `perception-engine.js` | `/perceive` | Cảm biến: CPU, disk, RAM, proxy |
| 18 | `agi-score-calculator.js` | `/agi-score` | Tính điểm AGI 5 chiều × 20 |

### SQUAD 3: 🚀 MISSION OPS (Hành Quân)
> Dispatch, chạy, theo dõi mission

| # | Module | Command | Vai Trò |
|---|--------|---------|---------|
| 19 | `mission-dispatcher.js` | `/dispatch` | Build prompt, route to project, execute |
| 20 | `mission-generator.js` | `/gen-mission` | Tạo mission tùy chỉnh via LLM |
| 21 | `cto-task-dispatch.js` | `/task-dispatch` | Agent Role mapping + chuyên môn pane |
| 22 | `brain-mission-runner.js` | `/run-mission` | Chạy mission trong brain process |
| 23 | `brain-headless-per-mission.js` | `/headless` | Spawn claude -p per mission (isolated) |
| 24 | `auto-task-chain.js` | `/chain-task` | Tự tạo task kế tiếp sau mission |
| 25 | `mission-recovery.js` | `/recover-mission` | 7-state adaptation (九變) |
| 26 | `tactical-responder.js` | `/tactical` | Real-time mission adaptation (AGI L9) |

### SQUAD 4: 🧬 EVOLUTION & LEARNING (Tiến Hóa)
> Tự học, tự cải tiến, tích lũy tri thức

| # | Module | Command | Vai Trò |
|---|--------|---------|---------|
| 27 | `evolution-engine.js` | `/evolve` | Tạo skill mới từ failure patterns |
| 28 | `learning-engine.js` | `/learn` | Track outcomes, adaptive recommendations |
| 29 | `self-analyzer.js` | `/self-analyze` | CTO tự phân tích code của chính mình |
| 30 | `knowledge-synthesizer.js` | `/synthesize` | Trích pattern từ mission thành công |
| 31 | `dynamic-syllabus.js` | `/syllabus` | Tạo task phù hợp trình độ dự án |
| 32 | `post-mortem-reflector.js` | `/reflect` | Hồi quang phản chiếu sau mission |
| 33 | `skill-factory.js` | `/forge-skill` | Auto-gen .claude/skills/ từ diff |
| 34 | `mission-journal.js` | `/journal-mission` | Nhật ký mission (AGI L5) |
| 35 | `openclaw-rl-client.js` | `/rl-feedback` | Reinforcement learning integration |

### SQUAD 5: 💰 REVENUE & BUSINESS (Doanh Thu)
> Quản lý tài chính, license, revenue health

| # | Module | Command | Vai Trò |
|---|--------|---------|---------|
| 36 | `revenue-health-scanner.js` | `/revenue-scan` | Check RaaS credit, billing, bottlenecks |
| 37 | `raas-license-validator.js` | `/license-check` | Validate RaaS license middleware |
| 38 | `client-intake-schema.js` | `/intake` | Schema thu thập client 8 mục |
| 39 | `handover-generator.js` | `/handover` | Tạo gói handover RaaS AGI |
| 40 | `clawwork-integration.js` | `/clawwork` | AGI L11 Economic Benchmark |
| 41 | `moltbook-integration.js` | `/moltbook` | AGI L12 Agent Social Identity |

### SQUAD 6: 📊 TRADING COMPANY (Giao Dịch)
> Quản lý trading operations, scheduling, decisions

| # | Module | Command | Vai Trò |
|---|--------|---------|---------|
| 42 | `trading-cadence-scheduler.js` | `/trading-schedule` | Lập lịch trading tự động |
| 43 | `trading-company-decision-engine.js` | `/trading-decide` | 3-tier: Auto/Escalate/Halt |
| 44 | `trading-post-mission-report-handler.js` | `/trading-report` | Parse report → Decision → Follow-up |

### SQUAD 7: 🔧 BRAIN INFRASTRUCTURE (Hạ Tầng Não)
> Quản lý process, spawn, state, health của CC CLI brain

| # | Module | Command | Vai Trò |
|---|--------|---------|---------|
| 45 | `brain-process-manager.js` | `/brain-mgr` | Re-export shell quản lý process |
| 46 | `brain-spawn-manager.js` | `/brain-spawn` | Spawn CC CLI brain process |
| 47 | `brain-state-machine.js` | `/brain-state` | State machine cho brain lifecycle |
| 48 | `brain-supervisor.js` | `/brain-watch` | Unified CTO & CC CLI monitoring |
| 49 | `brain-boot-sequence.js` | `/brain-boot` | Boot sequence khởi tạo brain |
| 50 | `brain-respawn-controller.js` | `/brain-respawn` | Controller tự respawn khi crash |
| 51 | `brain-heartbeat.js` | `/brain-pulse` | Heartbeat check alive |
| 52 | `brain-health-server.js` | `/brain-health` | HTTP health endpoint :9090 |
| 53 | `brain-logger.js` | `/brain-log` | Logging system cho brain |
| 54 | `brain-system-monitor.js` | `/brain-sysmon` | System resource monitor |
| 55 | `brain-output-hash-stagnation-watchdog.js` | `/stagnation-watch` | Detect output bị treo |
| 56 | `brain-dispatch-helpers.js` | `/dispatch-helpers` | Helper functions cho dispatch |
| 57 | `brain-terminal-app.js` | `/brain-terminal` | CC CLI trong macOS Terminal tabs |
| 58 | `brain-tmux-controller.js` | `/brain-tmux` | Tmux pane management |
| 59 | `brain-vscode-terminal.js` | `/brain-vscode` | CC CLI trong VS Code terminal |

### SQUAD 8: 🛡️ DEFENSE & SAFETY (Phòng Thủ)
> Bảo mật, safety guard, quân luật, circuit breaker

| # | Module | Command | Vai Trò |
|---|--------|---------|---------|
| 60 | `quan-luat-enforcer.js` | `/quan-luat` | Enforce 9 ĐIỀU Quân Lệnh runtime |
| 61 | `safety-guard.js` | `/safety` | LLM-validated intent classification |
| 62 | `circuit-breaker.js` | `/circuit` | Circuit breaker pattern |
| 63 | `post-mission-gate.js` | `/gate` | CI/CD verification sau mission |
| 64 | `self-healer.js` | `/heal` | Proactive self-healing (AGI L4) |

### SQUAD 9: 📡 COMMUNICATION & SIGNALS (Thông Tin)
> Event bus, notifications, question handling, escalation

| # | Module | Command | Vai Trò |
|---|--------|---------|---------|
| 65 | `signal-bus.js` | `/signal` | 奇正 Signal system (CHÍNH + KỲ) |
| 66 | `telegram-client.js` | `/telegram` | Push notification Telegram |
| 67 | `question-handler.js` | `/answer-question` | CTO đọc hiểu câu hỏi CC CLI |
| 68 | `cto-escalation.js` | `/escalate` | Escalation khi vượt authority |
| 69 | `cto-dashboard-logger.js` | `/dash-log` | Log vào CTO dashboard |
| 70 | `cto-visual-dashboard.js` | `/dashboard` | Visual dashboard real-time |
| 71 | `live-mission-viewer.js` | `/live-view` | Tail log real-time có màu |
| 72 | `cto-progress-tracker.js` | `/track-progress` | Theo dõi tiến độ mission |

### SQUAD 10: ⚙️ RESOURCE MANAGEMENT (Hậu Cần)
> RAM, token, quota, cooling, rate limit, throughput

| # | Module | Command | Vai Trò |
|---|--------|---------|---------|
| 73 | `resource-governor.js` | `/resources` | RAM/CPU tiered daemon killing |
| 74 | `m1-cooling-daemon.js` | `/cool` | M1 thermal protection |
| 75 | `token-tracker.js` | `/tokens` | Token consumption tracking |
| 76 | `quota-tracker.js` | `/quota` | Quota per mission/project |
| 77 | `api-rate-gate.js` | `/rate-gate` | File-based lock chống proxy overload |
| 78 | `cto-ram-policy.js` | `/ram-policy` | RAM policy cho CTO |
| 79 | `throughput-maximizer.js` | `/maximize` | 4-layer throughput optimization |
| 80 | `team-mutex.js` | `/mutex` | Mutex chống Swarm vs Agent Teams |

### SQUAD 11: 🏭 FACTORY & PIPELINE (Sản Xuất)
> Bootstrap, build, pipeline, production board

| # | Module | Command | Vai Trò |
|---|--------|---------|---------|
| 81 | `factory-pipeline.js` | `/pipeline` | Vibe Coding Factory engine |
| 82 | `project-bootstrapper.js` | `/bootstrap-project` | Auto-scaffold từ client intake |
| 83 | `production-board.js` | `/production` | Toyota Production System board |
| 84 | `claudekit-updater.js` | `/update-claudekit` | ClaudeKit auto-updater deep fix |
| 85 | `hands-registry.js` | `/hands` | Binh Pháp v5 Hands Registry |
| 86 | `system-status-registry.js` | `/system-status` | Global state monitor |

### SQUAD 12: 🤖 EXTERNAL AI & RESEARCH (Liên Minh AI)
> LLM clients, external AI agents, web research

| # | Module | Command | Vai Trò |
|---|--------|---------|---------|
| 87 | `llm-interpreter.js` | `/interpret` | CTO Vision via Antigravity Proxy |
| 88 | `llm-perception.js` | `/perceive-llm` | Brain transfer (OpenAI format) |
| 89 | `gemini-agentic.js` | `/gemini` | Qwen AI Agentic ecosystem |
| 90 | `google-ultra.js` | `/google-ultra` | Google ecosystem full access |
| 91 | `jules-agent.js` | `/jules` | Google Jules AI coding agent |
| 92 | `nvidia-client.js` | `/nvidia` | AG Proxy routing (Daemon AI) |
| 93 | `web-researcher.js` | `/web-research` | Real-time web search + synthesis |
| 94 | `vector-service.js` | `/vector` | Knowledge injection (AGI L9) |

### SQUAD 12B: 💾 MEMORY (Bộ Nhớ)
> Persistent memory, retrieval, forgetting

| # | Module | Command | Vai Trò |
|---|--------|---------|---------|
| 95 | `lightmem-memory.js` | `/mem-store` | Core memory module |
| 96 | `lightmem-retrieval.js` | `/mem-recall` | Similarity-based search |
| 97 | `lightmem-forgetting.js` | `/mem-forget` | Selective consolidation & cleanup |

### SQUAD 13: 🖥️ CTO INFRASTRUCTURE (Trụ Sở CTO)
> Pane management, coordinator, tmux, state detection

| # | Module | Command | Vai Trò |
|---|--------|---------|---------|
| 98 | `cto-pane-handler.js` | `/pane-handle` | Xử lý pane events |
| 99 | `cto-pane-state-detector.js` | `/pane-detect` | Detect idle/busy/stuck |
| 100 | `cto-worker-coordinator.js` | `/coordinate` | Điều phối workers |
| 101 | `cto-tmux-helpers.js` | `/tmux-help` | Tmux helper utilities |
| 102 | `monitor-24-7.js` | `/monitor` | 24/7 giám sát real-time |
| 103 | `task-queue.js` | `/queue` | Task queue management |
| 104 | `task-deduplicator.js` | `/dedup` | Chống duplicate missions |
| 105 | `task-dedup-registry.js` | `/dedup-registry` | Registry chống loop trùng lặp |

### V2 MODULES (Next-Gen)

| # | Module | Command | Vai Trò |
|---|--------|---------|---------|
| 106 | `v2/cli-worker.js` | `/v2-worker` | Next-gen CLI worker |
| 107 | `v2/mission-executor.js` | `/v2-executor` | Next-gen mission executor |
| 108 | `v2/worker-pool.js` | `/v2-pool` | Worker pool management |

---

## 4. Module → Command Mapping (110 modules)

### Quick-Reference Bảng Tra Cứu

```
/strategist         → strategic-brain.js
/wise-counsel       → binh-phap-strategist.js
/optimize-strategy  → strategy-optimizer.js
/swarm              → swarm-intelligence.js
/commander          → project-commander.js
/classify-mission   → mission-complexity-classifier.js
/decompose          → work-order-decomposer.js
/cto-scan           → auto-cto-pilot.js
/pre-scan           → cto-pre-dispatch-scan.js
/codebase-scan      → cto-codebase-scanner.js
/project-scan       → project-scanner.js
/profile-project    → project-profiler.js
/project-score      → project-score-calculator.js
/hunt               → hunter-scanner.js
/perceive           → perception-engine.js
/agi-score          → agi-score-calculator.js
/dispatch           → mission-dispatcher.js
/gen-mission        → mission-generator.js
/task-dispatch      → cto-task-dispatch.js
/run-mission        → brain-mission-runner.js
/headless           → brain-headless-per-mission.js
/chain-task         → auto-task-chain.js
/recover-mission    → mission-recovery.js
/tactical           → tactical-responder.js
/evolve             → evolution-engine.js
/learn              → learning-engine.js
/self-analyze       → self-analyzer.js
/synthesize         → knowledge-synthesizer.js
/syllabus           → dynamic-syllabus.js
/reflect            → post-mortem-reflector.js
/forge-skill        → skill-factory.js
/journal-mission    → mission-journal.js
/rl-feedback        → openclaw-rl-client.js
/revenue-scan       → revenue-health-scanner.js
/license-check      → raas-license-validator.js
/intake             → client-intake-schema.js
/handover           → handover-generator.js
/clawwork           → clawwork-integration.js
/moltbook           → moltbook-integration.js
/trading-schedule   → trading-cadence-scheduler.js
/trading-decide     → trading-company-decision-engine.js
/trading-report     → trading-post-mission-report-handler.js
/quan-luat          → quan-luat-enforcer.js
/safety             → safety-guard.js
/circuit            → circuit-breaker.js
/gate               → post-mission-gate.js
/heal               → self-healer.js
/signal             → signal-bus.js
/telegram           → telegram-client.js
/answer-question    → question-handler.js
/escalate           → cto-escalation.js
/dashboard          → cto-visual-dashboard.js
/live-view          → live-mission-viewer.js
/resources          → resource-governor.js
/cool               → m1-cooling-daemon.js
/tokens             → token-tracker.js
/quota              → quota-tracker.js
/rate-gate          → api-rate-gate.js
/maximize           → throughput-maximizer.js
/pipeline           → factory-pipeline.js
/bootstrap-project  → project-bootstrapper.js
/production         → production-board.js
/interpret          → llm-interpreter.js
/gemini             → gemini-agentic.js
/google-ultra       → google-ultra.js
/jules              → jules-agent.js
/web-research       → web-researcher.js
/vector             → vector-service.js
/mem-store          → lightmem-memory.js
/mem-recall         → lightmem-retrieval.js
/mem-forget         → lightmem-forgetting.js
/monitor            → monitor-24-7.js
```

---

## 5. State-Driven Dispatch — Khi Nào Gọi Ai

### Decision Matrix

CTO detect project state → tự động chọn Squad phù hợp:

```
┌─────────────────────────────┬──────────────────┬─────────────────────────┐
│ PROJECT STATE               │ SQUAD            │ PRIMARY COMMANDS        │
├─────────────────────────────┼──────────────────┼─────────────────────────┤
│ test fail / build broken    │ 🛡️ DEFENSE       │ /heal → /gate → /reflect│
│ revenue drop / billing fail │ 💰 REVENUE       │ /revenue-scan → /escalate│
│ all GREEN, idle             │ 🧠 STRATEGIC     │ /strategist → /dispatch │
│ new client onboard          │ 🏭 FACTORY       │ /intake → /decompose    │
│ mission fail (retry)        │ 🧬 EVOLUTION     │ /reflect → /optimize    │
│ RAM > 80% / CPU > 90%      │ ⚙️ RESOURCE      │ /cool → /resources      │
│ multi-project conflict      │ 🧠 STRATEGIC     │ /swarm → /commander     │
│ pane stuck/hung             │ 🔧 BRAIN INFRA   │ /stagnation-watch       │
│ need web research           │ 🤖 EXTERNAL AI   │ /web-research → /vector │
│ trading window open         │ 📊 TRADING       │ /trading-schedule       │
│ CI/CD red                   │ 🛡️ DEFENSE       │ /gate → /tactical       │
│ codebase dirty (TODO/any)   │ 🔍 RECON         │ /hunt → /codebase-scan  │
│ knowledge gap detected      │ 🧬 EVOLUTION     │ /synthesize → /syllabus │
│ need status update          │ 📡 COMMS         │ /dashboard → /telegram  │
│ deploy completed            │ 🛡️ DEFENSE       │ /gate → /reflect        │
│ complex task incoming       │ 🧠 STRATEGIC     │ /classify → /decompose  │
└─────────────────────────────┴──────────────────┴─────────────────────────┘
```

### Trigger Conditions (Auto-Detect)

```javascript
// Pseudocode cho CTO dispatcher
function detectAndSummon(projectState) {
  // Priority 1: CRITICAL (immediate response)
  if (state.buildFailed)      return summon('DEFENSE', '/heal')
  if (state.ramCritical)      return summon('RESOURCE', '/cool')
  if (state.paneDead)         return summon('BRAIN_INFRA', '/brain-respawn')

  // Priority 2: BUSINESS (revenue impact)
  if (state.revenueDrop)      return summon('REVENUE', '/revenue-scan')
  if (state.tradingWindow)    return summon('TRADING', '/trading-schedule')
  if (state.newClient)        return summon('FACTORY', '/intake')

  // Priority 3: QUALITY (proactive improvement)
  if (state.allGreen)         return summon('STRATEGIC', '/strategist')
  if (state.codebaseDirty)    return summon('RECON', '/hunt')
  if (state.missionFailed)    return summon('EVOLUTION', '/reflect')

  // Priority 4: MAINTENANCE
  if (state.knowledgeGap)     return summon('EVOLUTION', '/synthesize')
  if (state.needsReport)      return summon('COMMS', '/dashboard')
}
```

---

## 6. Summoning Lifecycle

```
Phase 1: INVOCATION (Triệu Hồi)
──────────────────────────────────
  CTO detects trigger condition
  → Selects /command from Squad
  → Reads module file (JSDoc + exports)
  → Extracts expertise summary

Phase 2: POSSESSION (Nhập Xác)
──────────────────────────────────
  Gateway builds system prompt:
    [EXPERT HEADER] + [MODULE EXPERTISE] + [MISSION BRIEF]
  → Injects into CC CLI pane stdin
  → CC CLI now operates with specialist knowledge

Phase 3: EXECUTION (Thực Thi)
──────────────────────────────────
  CC CLI executes with expert lens:
    - Code changes guided by module's domain knowledge
    - Quality gates from module's verification criteria
    - Binh Pháp chapter principles embedded

Phase 4: DISMISSAL (Giải Triệu)
──────────────────────────────────
  Mission complete signal received
  → Post-mortem triggered (/reflect)
  → Expertise cleared from pane
  → Pane returns to idle state
  → Learning engine records outcome
```

### Timeout & Fallback

| Condition | Action |
|-----------|--------|
| Expert mission > 30 min | `/tactical` intervenes |
| Expert fails 2× cùng task | `/escalate` lên Chairman |
| Squad không có module phù hợp | `/strategist` fallback |
| CC CLI pane unresponsive | `/brain-respawn` override |

---

## 7. Squad Combo Patterns

### Pattern A: 🔴 EMERGENCY FIX (Test Fail → Fix → Verify)
```
/perceive → detect test failure
/heal     → auto-fix attempt
/gate     → verify CI/CD
/reflect  → learn from failure
```

### Pattern B: 🟢 PROACTIVE IMPROVEMENT (All Green → Improve)
```
/cto-scan     → confirm all green
/strategist   → generate strategic task
/classify     → determine complexity
/dispatch     → execute via CC CLI
/reflect      → post-mortem
/learn        → update learning engine
```

### Pattern C: 💰 REVENUE OPTIMIZATION
```
/revenue-scan    → detect bottleneck
/optimize-strategy → plan fix
/dispatch        → execute fix
/gate            → verify production
/trading-report  → update business metrics
```

### Pattern D: 🆕 NEW PROJECT ONBOARD
```
/intake           → collect client requirements
/decompose        → break into work orders
/bootstrap-project → scaffold codebase
/pipeline         → setup factory pipeline
/dispatch         → start first mission
```

### Pattern E: 🧬 SELF-EVOLUTION (Post-Failure Learning)
```
/reflect         → analyze failure
/learn           → update success rates
/synthesize      → extract patterns
/evolve          → create new skill
/forge-skill     → save to .claude/skills/
/syllabus        → adjust task difficulty
```

### Pattern F: 📊 TRADING OPERATIONS
```
/trading-schedule → check trading window
/trading-decide   → auto/escalate/halt
/dispatch         → execute trading mission
/trading-report   → parse results
/revenue-scan     → verify impact
```

---

## PHỤ LỤC: Số Liệu

| Metric | Value |
|--------|-------|
| Tổng modules | 110 (107 lib + 3 v2) |
| Tổng squads | 13 (12 + 1 V2) |
| Summonable commands | 108 (trừ .bak) |
| Binh Pháp chapters covered | 13/13 |
| AGI levels represented | L1-L12 |

---

*Genesis: 2026-03-09 | Summoning Pattern v1.0*
*CTO = Triệu Hồi Sư. NÃO + XÁC = Hành Động Có Trí Tuệ.*
