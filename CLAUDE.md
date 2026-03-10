# HIẾN PHÁP MEKONG-CLI — 孫子兵法 BINH PHÁP CONSTITUTION

> **RaaS Agency Operating System** — The ONE document any agent reads to understand the entire ecosystem.
>
> *"Binh giả, quốc chi đại sự, tử sinh chi địa, tồn vong chi đạo, bất khả bất sát dã."*
> — War is a matter of vital importance to the State; a matter of life and death, survival or ruin.

---

## NGÔN NGỮ — TIẾNG VIỆT BẮT BUỘC (ĐIỀU 55)

> **LUÔN LUÔN trả lời bằng TIẾNG VIỆT.** Không dùng Tiếng Anh trừ khi là code, tên biến, hoặc thuật ngữ kỹ thuật.
> Khi commit, log, báo cáo — tất cả phải Tiếng Việt.
> Khi chạy mission từ Tôm Hùm — output, báo cáo, và console log phải Tiếng Việt.

---


## LOADING ORDER — [compressed for speed]


## STAKEHOLDER MATRIX — [compressed for speed]

## 第一篇 始計 (Shi Ji) — FOUNDATION

> *"Binh giả, quốc chi đại sự"* — Architecture is a matter of vital importance

### Tech Stack

| Layer | Technology |
|-------|------------|
| CLI Engine | Python 3.11+ · Typer · Rich · Pydantic |
| Orchestration | Node.js (OpenClaw) · Expect (brain control) |
| Gateway | FastAPI (local) · Cloudflare Workers (cloud) |
| Proxy | Antigravity Proxy (port **9191**, Anthropic-compatible) |
| Model | gemini-3-flash-preview (via proxy) |

### Architecture

```
mekong-cli/
├── src/core/                 # Plan-Execute-Verify Engine (Python)
│   ├── planner.py            # 謀 LLM-powered task decomposition
│   ├── executor.py           # 執 Multi-mode runner (shell/LLM/API)
│   ├── verifier.py           # 證 Result validation + quality gates
│   ├── orchestrator.py       # 統 Plan→Execute→Verify coordination
│   ├── llm_client.py         # LLM client (OpenAI-compatible APIs)
│   ├── gateway.py            # FastAPI server + WebSocket streaming
│   ├── telemetry.py          # Execution tracing
│   └── memory.py             # Persistent memory store
├── src/agents/               # Modular Agent System
│   ├── git_agent.py          # Git operations (status/diff/log/commit)
│   ├── file_agent.py         # File operations (find/read/tree/grep)
│   ├── shell_agent.py        # Shell command execution
│   ├── lead_hunter.py        # Lead discovery
  ... (truncated for speed)
```

### Core Components

| Component | File | Purpose |
|-----------|------|---------|
| `RecipePlanner` | `planner.py` | LLM-powered task decomposition |
| `RecipeExecutor` | `executor.py` | Multi-mode runner → `ExecutionResult` |
| `RecipeVerifier` | `verifier.py` | Result validation with quality gates |
| `RecipeOrchestrator` | `orchestrator.py` | Plan→Execute→Verify + rollback + self-healing |
| `LLMClient` | `llm_client.py` | OpenAI-compatible client via Antigravity Proxy |
| `IntentClassifier` | `nlu.py` | NLU pre-routing for goal→recipe matching |

### CLI Commands

```bash
mekong cook "<goal>"          # Full pipeline: Plan → Execute → Verify
mekong plan "<goal>"          # Plan only (preview steps, no execution)
mekong run <recipe.md>        # Execute existing recipe file
mekong agent <name> <cmd>     # Run agent directly
mekong list                   # List available recipes
mekong search <query>         # Search recipes
mekong version                # Show version (v0.2.0)
```

---

## 第二篇 作戰 (Zuo Zhan) — OPERATIONS & RESOURCES

> *"Binh quý thắng, bất quý cửu"* — Speed is the essence; prolonged war drains resources

### Antigravity Proxy (ĐIỀU 51)

All LLM calls route through Antigravity Proxy — never direct API.

```
CC CLI ──→ http://localhost:9191 ──→ Antigravity Proxy ──→ Google Cloud/Anthropic
                                       │
                                       ├── Load balancing across accounts
                                       ├── Automatic model fallback
                                       ├── Date-suffix model alias resolution
                                       └── Quota management + rate limit rotation
```

| Config | Value |
|--------|-------|
| `ANTHROPIC_BASE_URL` | `http://localhost:9191` |
| `PROXY_PORT` | **9191** (🔒 CẤM THAY ĐỔI — xem ĐIỀU 56) |
| `MODEL_NAME` | `gemini-3-pro-high` |

### Error Recovery Protocol (ĐIỀU 52)

When `RESOURCE_EXHAUSTED` (429/400):
1. Execute `scripts/proxy-recovery.sh`
2. Wait 2s, retry
3. If persistent → proxy auto-failover (Sonnet → Gemini Pro High)
4. CLI hung → send newline (Kickstart Protocol)

### M1 Resource Management (ĐIỀU 53)

MacBook M1 16GB — thermal/RAM protection built into Tôm Hùm:
- `m1-cooling-daemon.js` runs every 90s
- Kills resource hogs (pyrefly, pyright)
- Hard cool on load >8 or free RAM <200MB
- Browser automation restricted (Antigravity CẤM browser spam)

---

## 第三篇 謀攻 (Mou Gong) — PLANNING & CODE STANDARDS

> *"Thượng binh phạt mưu"* — Supreme excellence: winning without fighting

### Plan-Execute-Verify Pattern (Core DNA)

```
1. PLAN    → RecipePlanner decomposes goals via LLM
              → Recipe with tasks + dependencies + verification criteria
              → NLU pre-routing: high-confidence goals skip planning
2. EXECUTE → RecipeExecutor runs tasks (shell/LLM/API modes)
              → Returns ExecutionResult (exit_code, stdout, stderr, metadata)
              → Self-healing: AI-corrects failed shell commands
              → Retry with exponential backoff
3. VERIFY  → RecipeVerifier validates ExecutionResult against criteria
              → Exit codes, file checks, LLM quality assessment
              → Failed verification triggers rollback
```

### Quality Requirements

- Type hinting required for all functions
- Docstring for every class and public method
- Tests for every module in `/tests` (62 tests, ~2.5min)
- File size < 200 lines (split into modules)
- kebab-case file naming (snake_case for Python test files)

### Workflow Standard

```
/plan:hard "task"  → Strategy (deep research)
/cook <plan>       → Execute (atomic implementation)
python3 -m pytest  → Verify (test suite)
Browser check      → Visual confirm
```

---

## 第四篇 軍形 (Jun Xing) — SECURITY & DEFENSE

> *"Tiên vi bất khả thắng, dĩ đãi địch chi khả thắng"* — First make yourself invincible

### Security Mandates

- No secrets in codebase (`grep -r "API_KEY\|SECRET" src` = 0)
- No `any` types (`grep -r ": any" src` = 0)
- No `@ts-ignore` directives
- Input validation with Pydantic/zod
- CORS properly configured on all APIs
- Webhook security (secret-based auth)

### CI/CD GREEN PRODUCTION RULE (ĐIỀU 49)

**KHÔNG ĐƯỢC BÁO CÁO "DONE" KHI CHƯA VERIFY PRODUCTION GREEN.**

After every `git push`:
1. **CI/CD** — Poll GitHub Actions until GREEN or FAIL
2. **HTTP Check** — `curl -sI <PROD_URL>` must return HTTP 200
3. **Report** — `Build: ✅ | Tests: ✅ | CI/CD: ✅ | Production: ✅ HTTP 200`

**BANNED:** `vercel --prod`, `vercel deploy` — only deploy via `git push`.

---

## 第五篇 兵勢 (Bing Shi) — FORCE MULTIPLIERS

> *"Thế như hoãn huyệt, tiết như phát cơ"* — Momentum like a crossbow, timing like a trigger

### Agent Teams (Parallel Power)

```bash
# Enable: ~/.claude/settings.json
"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
```

Agent coordination:
```
Planner Agent    → Plan generation
Developer Agent  → Implementation (parallel FE/BE)
Tester Agent     → Verification (unit/integration)
Reviewer Agent   → Code quality + security
```

### 🦞 ĐIỀU 57 — Model Rotation Protocol (Max 20x Style)

> **1 API key, 20 models, $0 cost — mỗi subagent dùng model khác → không rate limit.**
> **BaseURL:** `https://coding-intl.dashscope.aliyuncs.com/v1`
> 🎁 **Đăng ký DashScope:** [Alibaba Cloud Benefits (Referral)](https://www.alibabacloud.com/campaign/benefits?referral_code=A9245T) — Free credits + exclusive perks

**Full Model Pool** (DashScope Bailian Coding Plan — all free):

| # | Model ID | Context | Tier | Best For |
|---|----------|---------|------|----------|
| 0 | `qwen3.5-plus` | 1M | 🏆 Flagship | Main agent, complex planning |
| 1 | `qwen3-coder-plus` | 1M | 💻 Coder | Code generation, refactoring |
| 2 | `qwen3-coder-next` | 262K | 💻 Coder | Code generation v2 |
| 3 | `qwen3-max-2026-01-23` | 262K | 🏆 Flagship | Deep reasoning, strategy |
| 4 | `qwen3.5-flash` | 1M | ⚡ Fast | Quick research, summaries |
| 5 | `qwen3-coder-480b-a35b-instruct` | 262K | 💻 Coder | Largest coder model |
| 6 | `kimi-k2.5` | 262K | 🔍 Review | Code review, vision |
| 7 | `MiniMax-M2.5` | 204K | 📝 Writer | Large output (131K tokens) |
| 8 | `MiniMax-M2.5-highspeed` | 204K | ⚡ Fast | Fast large output |
| 9 | `glm-5` | 202K | 🔍 Review | Fresh perspective review |
| 10 | `glm-4.7` | 202K | 🔍 Review | Fast review, analysis |
| 11 | `qwen-plus` | 131K | ⚡ Fast | Balanced speed/quality |
| 12 | `qwen-max` | 32K | 🏆 Flagship | Best quality, short ctx |
| 13 | `qwen3-32b` | 131K | 🧠 Open | Open-source, reasoning |
| 14 | `qwen3-14b` | 131K | ⚡ Fast | Lightweight tasks |
| 15 | `qwen3-235b-a22b` | 131K | 🧠 Open | MoE, massive params |
| 16 | `qwen3-30b-a3b` | 131K | ⚡ Fast | MoE, efficient |
| 17 | `qwq-plus` | 131K | 🧠 Reason | Chain-of-thought reasoning |
| 18 | `qwen-vl-max` | 128K | 👁️ Vision | Image understanding |
| 19 | `qwen-vl-plus` | 128K | 👁️ Vision | Fast image processing |

**Round-Robin:** `Subagent #N → MODEL_POOL[N % 20]`

**Role-Based Override (ưu tiên):**

| Role | Preferred Models |
|------|-----------------|
| `planner` | qwen3.5-plus, qwen3-max, qwq-plus |
| `fullstack-developer` | qwen3-coder-plus, qwen3-coder-next, qwen3-coder-480b |
| `code-reviewer` | kimi-k2.5, glm-5, glm-4.7 |
| `researcher` | MiniMax-M2.5, qwen3.5-flash, qwen-plus |
| `tester` | glm-5, qwen3-14b, qwen3-32b |
| `docs-manager` | MiniMax-M2.5-highspeed, qwen3.5-flash |
| `ui-ux-designer` | qwen-vl-max, kimi-k2.5 (vision) |

**Execution:** Khi spawn subagent via Task tool, prepend `/model <model-id>` trước instruction.

**Pane Assignment (CTO Dispatch):**
```
P0 (mekong-cli):  qwen3.5-plus       (flagship)
P1 (well):        qwen3-coder-plus   (coder)
P2 (algo-trader): kimi-k2.5          (review+vision)
```

### ClaudeKit DNA (Constitutional Backbone)

| Component | Count | Location |
|-----------|-------|----------|
| Skills | 80+ | `.claude/skills/` |
| Commands | 50+ | `.claude/commands/` |
| Agents | 17+ | ClaudeKit subagent system |
| BMAD Workflows | 169 | `_bmad/` |

### Skill Seekers — Skill Factory (MCP)

Skill Seekers v3.0 — MCP-based skill factory. CLI: `.skill-seekers-venv/bin/skill-seekers`. 17 MCP tools.

### CTO Framework — Technical Co-Founder Phases

5-phase execution framework mapping skills to delivery stages:

5 phases: Discovery→Planning→Building→Polish→Handoff. See `docs/SKILLS_REGISTRY.md`.

### Mekong Agents

Agents: GitAgent, FileAgent, ShellAgent, LeadHunter, ContentWriter, RecipeCrawler. All inherit `AgentBase` → plan→execute→verify.

---


## 第六篇 虛實 (Xu Shi) — [compressed for speed]

## 第七篇 軍爭 (Jun Zheng) — COMMAND PROTOCOL

> *"Quân tranh chi nan giả, dĩ vu vi trực"* — The difficulty of maneuvering: making the devious route direct

### Task Delegation Mandate (ĐIỀU 47)

**NO COMMAND = NO ACTION.** Every task MUST use a ClaudeKit command.
**Deep Reference:** `knowledge/CLAUDEKIT_DEEP_REFERENCE.md` (28 commands, 13 agents, 50+ skills)

| Situation | Command | Complexity |
|-----------|---------|------------|
| Simple impl | `/cook "task" --auto` | TRIVIAL |
| Quick plan | `/plan:fast "task"` | SIMPLE |
| Complex feat | `/plan:hard "task"` | MODERATE |
| 2 approaches | `/plan:two "task"` | MODERATE |
| Mega feature | `/plan:parallel "task"` | COMPLEX |
| CI broken | `/plan:ci` | MODERATE |
| CRO optimize | `/plan:cro` | MODERATE |
| Archive plans | `/plan:archive` | TRIVIAL |
| Validate plan | `/plan:validate` | TRIVIAL |
| Debug issue | `/debug "issue"` | MODERATE |
| Run tests | `/test` | TRIVIAL |
| UI/E2E tests | `/test:ui` | SIMPLE |
| Code review | `/review` | SIMPLE |
| Parallel review | `/review:codebase` | COMPLEX |
| Quality+commit | `/check-and-commit` | SIMPLE |
| Ask codebase | `/ask "question"` | TRIVIAL |
| Project status | `/watzup` | TRIVIAL |
| Kanban board | `/kanban` | TRIVIAL |
| Dev journal | `/journal` | TRIVIAL |
| Init docs | `/docs:init` | SIMPLE |
| Update docs | `/docs:update` | SIMPLE |
| Summarize docs | `/docs:summarize` | SIMPLE |
| Git worktree | `/worktree "name"` | SIMPLE |
| Scout codebase | `/scout "what"` | SIMPLE |
| Fix bug | `/fix "issue"` | SIMPLE |
| Bootstrap new | `/bootstrap "desc"` | COMPLEX |
| Set level | `/coding-level "lvl"` | TRIVIAL |
| Preview work | `/preview` | TRIVIAL |

### Complexity Routing (Auto-select)

```
TRIVIAL   → /cook "task" --auto           (< 5 files, < 15min)
SIMPLE    → /plan:fast → /cook            (< 10 files, < 30min)
MODERATE  → /plan:hard → /cook → /test    (< 20 files, < 1h)
COMPLEX   → /plan:parallel → /cook phases (> 20 files, > 1h)
STRATEGIC → /plan:parallel [5] → phases   (Architecture-level)
```

### Agent Orchestration (13 agents, auto by commands)

```
Sequential: planner → fullstack-developer → tester → code-reviewer → git-manager
Parallel:   researcher(1) + researcher(2) + researcher(3) → planner
Explicit:   "Use debugger agent to investigate, then planner to create fix"
```

```
❌ REJECTED: "Fix the bug in the parser"
✅ ACCEPTED: "/fix the bug in the parser"
```

### Two-Call Mandate (CC CLI Sessions)

When sending commands to CC CLI:
```
Step 1: Send command text
Step 2: Send Enter separately (\n)
```

### Monitoring Protocol

```
LOOP until complete:
  1. Send command
  2. Send Enter
  3. Monitor output
  4. Check for completion indicators
  5. Verify result before reporting done
```

---


## 第八篇 九變 (Jiu Bian) — [compressed for speed]

## 第九篇 行軍 (Xing Jun) — TÔM HÙM TỰ TRỊ (ĐIỀU 54)

> *"Hành quân tất bí sinh nhi xử cao"* — On the march, seek high ground with life-giving resources

### OpenClaw Autonomous Dispatch Architecture

Tôm Hùm is a fully autonomous daemon that keeps CC CLI alive across missions.

#### Modular Architecture (v22.0)

```
apps/openclaw-worker/
├── task-watcher.js              # Thin orchestrator: boot + shutdown
├── config.js                    # Constants, paths, env vars, project registry
└── lib/
    ├── brain-process-manager.js # Spawn/monitor/kill expect brain process
    ├── mission-dispatcher.js    # Atomic file IPC, prompt building, project routing
    ├── task-queue.js            # File watching (fs.watch + poll), FIFO queue
    ├── auto-cto-pilot.js        # Self-CTO: generates Binh Phap quality tasks
    └── m1-cooling-daemon.js     # M1 thermal/RAM protection
```

#### Lifecycle Flow

```
1. BOOT
   task-watcher.js starts → spawnBrain() → startWatching() → startAutoCTO() → startCooling()

2. BRAIN SPAWN
   brain-process-manager.js spawns: expect tom-hum-persistent-dispatch.exp <dir> <log>
   → CC CLI starts with --dangerously-skip-permissions
   → Waits for ❯ prompt (120s timeout)

3. MISSION DISPATCH
   task-queue.js detects mission_*.txt in tasks/ directory
   → mission-dispatcher.js builds prompt: "/binh-phap implement: <task> /cook"
   → Atomic write to /tmp/tom_hum_next_mission.txt
   → expect script reads file, injects into CC CLI stdin
   → Polls /tmp/tom_hum_mission_done for completion

  ... (truncated for speed)
```

#### Project Routing

Mission content is keyword-matched to project directories:

| Keyword | Route |
|---------|-------|
| `84tea`, `tea` | `apps/84tea` |
| `apex` | `apps/apex-os` |
| `anima` | `apps/anima119` |
| `sophia` | `apps/sophia-ai-factory` |
| `well` | `apps/well` |
| (default) | mekong-cli root |

#### Binh Phap Auto-Tasks

| ID | Description |
|----|-------------|
| `console_cleanup` | Clean all console.log from production code |
| `type_safety` | Fix all TypeScript `any` types |
| `a11y_audit` | WCAG 2.1 AA accessibility audit |
| `security_headers` | Implement CSP, HSTS, X-Frame-Options |
| `perf_audit` | Lighthouse performance audit |
| `i18n_sync` | Sync all translation keys |

#### IPC Files

| File | Purpose |
|------|---------|
| `/tmp/tom_hum_next_mission.txt` | Mission inbox (atomic write) |
| `/tmp/tom_hum_mission_done` | Completion signal |
| `tasks/.tom_hum_state.json` | Auto-CTO state (completed tasks, cycle) |
| `~/tom_hum_cto.log` | Unified log file |

---

## 第十篇 地形 (Di Xing) — QUALITY GATES

> *"Tri bỉ tri kỷ, thắng nãi bất đãi"* — Know the enemy, know yourself; victory is never in doubt

### Six Quality Fronts

| Front | Gate | Criterion | Verification |
|-------|------|-----------|-------------|
| 始計 | Tech Debt | 0 TODOs/FIXMEs | `grep -r "TODO\|FIXME" src` |
| 作戰 | Type Safety | 0 `any` types | `grep -r ": any" src` |
| 謀攻 | Performance | Build < 10s | `time python3 -m pytest` |
| 軍形 | Security | 0 high vulns | `npm audit --audit-level=high` |
| 兵勢 | UX | Loading states | Manual review |
| 虛實 | Documentation | Updated | Git diff check |

### Enforcement

```python
# RecipeVerifier automatically checks gates
verification = verifier.verify(result, criteria)
if not verification.passed:
    orchestrator.rollback(step)  # Reverse completed steps
```

**Emergency bypass:** `mekong run --skip-gates "recipe-name"`

---

## 第十一篇 九地 (Jiu Di) — CC CLI BATTLEFIELD

> *"Tử địa tắc chiến"* — On deadly ground, fight

### CC CLI Configuration

```bash
# Spawn command (used by expect brain)
claude --model claude-opus-4-6-thinking --dangerously-skip-permissions

# Resume after crash
claude --continue --model claude-opus-4-6-thinking --dangerously-skip-permissions
```

### Session Rules

- CC CLI uses Antigravity Proxy, NEVER direct API
- Context compact 0% → send Enter to kickstart
- `RESOURCE_EXHAUSTED` → `scripts/proxy-recovery.sh`
- CLI hung → Kickstart Protocol (send newline)

### Verification Rule (ĐIỀU 48)

**KHÔNG TIN BÁO CÁO - PHẢI XÁC THỰC!**

- Agent reports "complete" → verify with browser/tools
- Check production site directly
- Validate visual/functional before shipping
- CC CLI said "PRODUCTION READY" but site was black screen → precedent

---

## 第十二篇 火攻 (Huo Gong) — DEPLOYMENT & GIT

> *"Phát hỏa hữu thời, khởi hỏa hữu nhật"* — There is a proper time for fire attacks

### Commit Convention

```
feat: [module] - Add new feature
fix: [module] - Fix bug
refactor: [module] - Code improvement
docs: Update documentation
```

### Pre-commit Rules

- Run linting before commit
- Run tests before push (`python3 -m pytest`)
- No confidential info (API keys, .env files)
- No AI references in commit messages

### Deployment Flow

```
git push origin main
  → GitHub Actions triggers
  → CI/CD builds + tests
  → Auto-deploy (Vercel/Cloudflare)
  → Poll until GREEN
  → curl production HTTP 200
  → Report format with all checks
```

---


## 第十三篇 用間 (Yong Jian) — [compressed for speed]


## SUPREME COMMANDER PROTOCOL — [compressed for speed]

## ĐIỀU INDEX (Quick Reference)

Key ĐIỀU: 0(Authority), 47(Command Mandate), 48(Verify), 49(GREEN), 50(Mission), 51-53(Proxy/Recovery/M1), 54(Tôm Hùm), 55(Vietnamese), 56(DashScope).

---

---

## ĐIỀU 56 — DASHSCOPE CODING PLAN API (🔒 PRODUCTION)

> Model: qwen3-coder-plus | Key: sk-sp-* ($50/mo) | TTFB: ~1s
> 🎁 **Đăng ký Coding Plan:** [Alibaba Cloud Benefits →](https://www.alibabacloud.com/campaign/benefits?referral_code=A9245T)

```
🔒 ANTHROPIC_BASE_URL = https://coding-intl.dashscope.aliyuncs.com/apps/anthropic
🔒 ANTHROPIC_MODEL = qwen3-coder-plus
🔒 AUTOCOMPACT = 15%
```

---

_Genesis: 2026-02-06 | Hiến Pháp v2.2: 2026-02-17_
_ClaudeKit DNA v2.9.1+ | Agent Teams + BMAD + Binh Pháp + Tôm Hùm v29.0_


## 🔴 CẤM CI/CD POLLING LOOP (Added 2026-03-04)

**TUYỆT ĐỐI CẤM chạy while loop poll CI/CD status!**

Lý do: Vòng lặp `while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; gh run list...sleep 30; done` tốn ~12,500 tokens → context cháy 0% → crash.

**LUẬT:**
1. **CẤM** `while` loop poll `gh run list` hoặc bất kỳ CI/CD status check nào
2. **CHỈ ĐƯỢC** check CI/CD status **MỘT LẦN** duy nhất: `gh run list -L1 --json status,conclusion`
3. **SAU KHI** `git push`, báo cáo kết quả push và **DỪNG** — không poll
4. **CẤM** `sleep` trong bất kỳ loop nào — mỗi giây sleep = tokens lãng phí

```bash
# ❌ CẤM (burns 12K+ tokens):
MAX_ATTEMPTS=25; while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  STATUS=$(gh run list -L 1 --json status,conclusion); sleep 30
done

# ✅ ĐÚNG (chỉ 1 lần):
gh run list -L 1 --json status,conclusion -q ".[0]"
# Báo cáo kết quả và tiếp tục task khác
```



## 📜 HIẾN PHÁP ROIaaS — DNA TỐI THƯỢNG (BẮT BUỘC MỌI PHIÊN)

> **R = ROI = RaaS = ROIaaS** — Mọi dòng code phải quy đổi thành ROI.
> Chi tiết: `docs/HIEN_PHAP_ROIAAS.md` | Chiến lược: `docs/BINH_PHAP_MASTER.md`

**DUAL-STREAM BẮT BUỘC:** Mọi dự án PHẢI có 2 dòng doanh thu:
1. **Engineering ROI (Dev Key):** `RAAS_LICENSE_KEY` gate premium CLI/agents/models
2. **Operational ROI (User UI):** Subscription trên Web UI cho business users

**HƯ-THỰC (Binh Pháp Ch.6):**
- HƯ (Open): Source code, base patterns → Public GitHub, viral marketing
- THỰC (Closed): AI Brain, prod keys, trained models → Gated, thu tiền

**QUÂN LỆNH:** Mission nào không phục vụ ít nhất 1 dòng ROI → **REJECT**.

