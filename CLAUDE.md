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

## LOADING ORDER — CSS-Specificity Cascade

> Like CSS specificity, deeper CLAUDE.md files override higher ones. Each level owns its domain.

```
PRIORITY (highest wins):
┌────────────────────────────────────────────────────────────────┐
│ 3. NESTED   apps/openclaw-worker/CLAUDE.md    ← Most specific │
│             apps/sophia-ai-factory/CLAUDE.md   (lazy-loaded    │
│             apps/raas-gateway/CLAUDE.md         only when CC   │
│             apps/engine/CLAUDE.md               CLI works in   │
│             apps/api/CLAUDE.md                  that dir)      │
│             apps/worker/CLAUDE.md                              │
│             tests/CLAUDE.md                                    │
├────────────────────────────────────────────────────────────────┤
│ 2. PROJECT  /CLAUDE.md (THIS FILE)            ← Constitution  │
│             Team conventions, Binh Phap, Stakeholder Matrix    │
│             Loaded when in mekong-cli project dir              │
├────────────────────────────────────────────────────────────────┤
│ 1. GLOBAL   ~/.claude/CLAUDE.md               ← Personal      │
│             User preferences, always loaded                    │
│             CC CLI supervision rules, ĐIỀU 1-46                │
└────────────────────────────────────────────────────────────────┘
```

### Resolution Rules

1. **Nested overrides Project** — `apps/sophia-ai-factory/CLAUDE.md` tech stack overrides root tech stack when CC CLI is in that directory
2. **Project overrides Global** — Root CLAUDE.md Binh Phap rules take precedence over generic global preferences
3. **Global is always present** — `~/.claude/CLAUDE.md` provides baseline (CC CLI supervision, proxy rules, commit conventions)
4. **Lazy loading** — Nested files only load when CC CLI's working directory is within that app
5. **No duplication** — Each level owns ONLY its domain. Don't repeat proxy rules in nested files (inherited from root)

### Nested File Registry

| File | Domain | Binh Phap Chapter |
|------|--------|-------------------|
| `apps/openclaw-worker/CLAUDE.md` | Tôm Hùm daemon, expect brain, task queue | 第九篇 行軍 |
| `apps/raas-gateway/CLAUDE.md` | Cloud API gateway, Telegram webhooks | 第二篇 作戰 |
| `apps/sophia-ai-factory/CLAUDE.md` | Video SaaS, payments, AI pipeline | 第五篇 兵勢 |
| `apps/engine/CLAUDE.md` | Core Python engine, Plan-Execute-Verify | 第三篇 謀攻 |
| `apps/api/CLAUDE.md` | Backend API service | 第四篇 軍形 |
| `apps/worker/CLAUDE.md` | Background job processing | 第八篇 九變 |
| `apps/84tea/CLAUDE.md` | Vietnamese tea franchise, MD3 brand guidelines | 第十一篇 九地 |
| `apps/anima119/CLAUDE.md` | Fermented Oriental medicine e-commerce | 第十三篇 用間 |
| `apps/apex-os/CLAUDE.md` | Trading platform, .ai/ agent structure | 第十二篇 火攻 |
| `apps/agencyos-web/CLAUDE.md` | Dashboard & admin panel, system visibility | 第六篇 虛實 |
| `apps/agencyos-landing/CLAUDE.md` | Marketing landing page, conversion | 第五篇 兵勢 |
| `apps/sophia-proposal/CLAUDE.md` | Sales proposals, competitive pitches | 第七篇 軍爭 |
| `apps/sophia-video-bot/CLAUDE.md` | Telegram content delivery bot | 第二篇 作戰 |
| `apps/com-anh-duong-10x/CLAUDE.md` | Restaurant POS + customer app | 第一篇 始計 |
| `packages/CLAUDE.md` | Shared SDK packages, dependency rules | 第三篇 謀攻 |
| `tests/CLAUDE.md` | Test conventions, pytest patterns | 第十篇 地形 |

---

## STAKEHOLDER MATRIX — TAM QUÂN (Three Forces)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANTIGRAVITY (Chairman)                        │
│              Gemini Brain · Strategic Orchestrator               │
│         ~/.gemini/antigravity/brain/ + knowledge/                │
│    Decides WHAT to build · Delegates via Telegram/API            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Commands (Telegram / mission files)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TÔM HÙM (General / Đại Tướng)               │
│          OpenClaw Daemon · Autonomous Task Dispatch              │
│              apps/openclaw-worker/ (Node.js)                     │
│    Watches tasks/ dir · Routes to projects · Manages brain       │
│    Self-CTO: auto-generates Binh Phap quality missions           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ File IPC (/tmp/tom_hum_next_mission.txt)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CC CLI (Soldier / Binh Sĩ)                   │
│           Claude Code CLI · Execution Engine                     │
│         claude --model claude-opus-4-6-thinking                  │
│    Executes /cook, /plan, /fix · Stays alive via expect brain    │
│    Uses Antigravity Proxy (port 11436) for LLM calls             │
└─────────────────────────────────────────────────────────────────┘
```

### Coordination Protocol

| Flow | From | To | Channel | Pattern |
|------|------|----|---------|---------|
| Strategic Command | Antigravity | Tôm Hùm | Telegram webhook → `tasks/mission_*.txt` | Cloud Ra Lệnh |
| Mission Dispatch | Tôm Hùm | CC CLI | File IPC → expect script → stdin injection | Local Thực Thi |
| Execution Report | CC CLI | Tôm Hùm | Prompt return detection → `/tmp/tom_hum_mission_done` | Completion Signal |
| Intelligence Sync | CC CLI | Antigravity | Git push → insights/ + plans/ | Knowledge Upload |
| Self-CTO Loop | Tôm Hùm | Tôm Hùm | Auto-pilot generates next quality task when queue empty | Autonomous |

### Authority Hierarchy (ĐIỀU 0)

1. **Chairman (Antigravity)** — Strategic decisions, approval gates, mission prioritization
2. **General (Tôm Hùm)** — Tactical coordination, queue management, brain lifecycle
3. **Soldier (CC CLI)** — Task execution, code changes, verification

**Rule:** Lower rank never overrides higher. CC CLI obeys Tôm Hùm. Tôm Hùm obeys Antigravity.

---

## 第一篇 始計 (Shi Ji) — FOUNDATION

> *"Binh giả, quốc chi đại sự"* — Architecture is a matter of vital importance

### Tech Stack

| Layer | Technology |
|-------|------------|
| CLI Engine | Python 3.11+ · Typer · Rich · Pydantic |
| Orchestration | Node.js (OpenClaw) · Expect (brain control) |
| Gateway | FastAPI (local) · Cloudflare Workers (cloud) |
| Proxy | Antigravity Proxy (port 11436, Anthropic-compatible) |
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
│   ├── content_writer.py     # Content generation
│   └── recipe_crawler.py     # Recipe file discovery
├── apps/openclaw-worker/     # 🦞 Tôm Hùm Autonomous Daemon
│   ├── task-watcher.js       # Thin orchestrator (boot + shutdown)
│   ├── config.js             # All constants, paths, env vars
│   └── lib/                  # 5 Modular Brain Components
│       ├── brain-process-manager.js  # Spawn/monitor/kill expect brain
│       ├── mission-dispatcher.js     # Atomic file IPC, prompt building
│       ├── task-queue.js             # File watching, queuing, archiving
│       ├── auto-cto-pilot.js         # Binh Phap auto-task generation
│       └── m1-cooling-daemon.js      # M1 thermal management
├── apps/raas-gateway/        # Cloudflare Worker API Gateway
├── scripts/
│   └── tom-hum-persistent-dispatch.exp  # Expect brain (CC CLI controller)
├── .claude/                  # ClaudeKit DNA
│   ├── skills/               # 80+ specialized skills
│   ├── commands/             # 50+ slash commands
│   └── rules/                # Constitutional rules
└── _bmad/                    # 169 BMAD workflows
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
CC CLI ──→ http://127.0.0.1:11436 ──→ Proxy v4 ──→ Ollama/OpenRouter/Google
                                       │
                                       ├── Load balancing across accounts
                                       ├── Automatic model fallback
                                       └── Quota management
```

| Config | Value |
|--------|-------|
| `ANTHROPIC_BASE_URL` | `http://127.0.0.1:11436` |
| `PROXY_PORT` | 11436 |
| `MODEL_NAME` | `gemini-3-flash-preview` |

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

### ClaudeKit DNA (Constitutional Backbone)

| Component | Count | Location |
|-----------|-------|----------|
| Skills | 80+ | `.claude/skills/` |
| Commands | 50+ | `.claude/commands/` |
| Agents | 17+ | ClaudeKit subagent system |
| BMAD Workflows | 169 | `_bmad/` |

### Skill Seekers — Skill Factory (MCP)

Universal preprocessor that converts docs, GitHub repos, and PDFs into CC CLI skills.

| Config | Value |
|--------|-------|
| Venv | `.skill-seekers-venv/` (Python 3.12) |
| CLI | `.skill-seekers-venv/bin/skill-seekers` |
| Version | 3.0.0 |
| MCP | `.claude/mcp.json` → `skill-seeker` (stdio) |
| Tools | 17 MCP tools (config, scrape, package, upload, split, sources) |

Quick usage:
```bash
skill-seekers scrape --config configs/react.json   # Scrape docs → skill
skill-seekers github --repo user/repo              # GitHub repo → skill
skill-seekers install --config configs/X.json       # End-to-end pipeline
```

### CTO Framework — Technical Co-Founder Phases

5-phase execution framework mapping skills to delivery stages:

| Phase | Chapter | Key Skills | Actions |
|-------|---------|------------|---------|
| Discovery | 始計 | cellcog, deep-research, scout, research | Deep questioning, challenge assumptions, must-have vs add-later |
| Planning | 謀攻 | planning, brainstorm, agent-builder | V1 proposal, plain language spec, complexity estimation |
| Building | 軍爭 | cook, coding-agent, cc-godmode | Staged build, continuous testing, decision checkpoints |
| Polish | 兵勢 | code-review, heimdall-security, web-testing | Edge cases, responsive, professional finish |
| Handoff | 火攻 | devops, git, skill-seekers, docs-seeker | Deploy, documentation, V2 roadmap |

Full skills registry: `docs/SKILLS_REGISTRY.md`

### Mekong Agents

| Agent | Operations |
|-------|------------|
| `GitAgent` | status, diff, log, commit, branch |
| `FileAgent` | find, read, tree, stats, grep |
| `ShellAgent` | Shell command execution |
| `LeadHunter` | Company/CEO lead discovery |
| `ContentWriter` | Content generation |
| `RecipeCrawler` | Recipe file discovery |

All agents inherit `AgentBase` → `plan()` → `execute()` → `verify()` flow.

---

## 第六篇 虛實 (Xu Shi) — OPEN CORE STRATEGY

> *"Tỵ thực nhi kích hư"* — Strike the void, avoid the solid

### Public vs Private

```
PUBLIC (Open Source):
├── src/core/               # Plan-Execute-Verify engine
├── src/agents/             # Modular agent system
├── apps/openclaw-worker/   # Tôm Hùm daemon
├── apps/raas-gateway/      # API gateway
├── _bmad/                  # 169 workflows
├── CLAUDE.md               # This constitution
└── packages/               # Hub SDK structure

PRIVATE (.gitignore):
├── plans/internal/
├── dna/pricing/
├── .mekong/api-key
└── apps/dashboard-internal/
```

---

## 第七篇 軍爭 (Jun Zheng) — COMMAND PROTOCOL

> *"Quân tranh chi nan giả, dĩ vu vi trực"* — The difficulty of maneuvering: making the devious route direct

### Task Delegation Mandate (ĐIỀU 47)

**NO COMMAND = NO ACTION.** Every task MUST use a ClaudeKit command:

| Situation | Command |
|-----------|---------|
| Build/implement | `/cook "description"` |
| Complex planning | `/plan:hard "description"` |
| Quick plan | `/plan:fast "description"` |
| Debug issue | `/debug "description"` |
| Code review | `/review` |
| Scan codebase | `/scout "what to find"` |
| Run tests | `/test` |
| Fix bug | `/fix "description"` |
| Commit | `/check-and-commit` |

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

## 第八篇 九變 (Jiu Bian) — ADAPTIVE WORKFLOWS

> *"Tướng thông cửu biến chi lợi giả, tri dụng binh hĩ"* — The general who masters adaptations wins

### BMAD Integration

| Component | Count |
|-----------|-------|
| Workflows | 169 |
| Agents | 9 (PM, Architect, Dev, QA, Analyst, SM, UX, BA, DevOps) |
| Teams | 2 |

Key BMAD workflows: `/product-brief` → `/create-prd` → `/create-architecture` → `/dev-story`

### Workflow Selection Matrix

| Scope | Flow |
|-------|------|
| Bug fix, small feature | `/scout` → `/plan` → `/code` → `/review` |
| Complex feature | `/brainstorm` → `/plan:hard` → `/cook` → `/test` → `/review` |
| Full product | BMAD planning → Agent Teams parallel execution |
| Quality sweep | Tôm Hùm Auto-CTO (Binh Phap tasks across projects) |

### Binh Pháp Module (`src/binh_phap/`)

- `standards.py` — Quality standards engine
- `anima_standards.py` — Animated standards
- `immortal_loop.py` — Continuous improvement loop

---

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

4. COMPLETION DETECTION
   expect script detects ❯ prompt return (with debounce)
   → Writes "done" to /tmp/tom_hum_mission_done
   → task-queue.js moves mission file to tasks/processed/

5. AUTO-CTO (Self-Generating Work)
   When queue empty for 60 checks (5min):
   → auto-cto-pilot.js picks next project from rotation
   → Generates Binh Phap quality task (console_cleanup, type_safety, a11y, security, perf, i18n)
   → Writes to tasks/mission_{project}_auto_{task_id}.txt
   → Queue picks it up automatically

6. CRASH RECOVERY
   expect script outer loop auto-respawns CC CLI with --continue
   → Rate-limited: max 5 respawns/hour
   → Brain death → respawn on next mission
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

## 第十三篇 用間 (Yong Jian) — INTELLIGENCE NETWORK

> *"Minh quân hiền tướng, sở dĩ động nhi thắng nhân"* — The enlightened ruler and wise general conquer through foreknowledge

### Knowledge Sources

| Source | Path | Owner |
|--------|------|-------|
| Antigravity Brain | `~/.gemini/antigravity/brain/` | Chairman |
| Antigravity Knowledge | `~/.gemini/antigravity/knowledge/` | Chairman |
| BMAD Workflows | `_bmad/bmm/workflows/` | Shared |
| ClaudeKit Skills | `.claude/skills/` | CC CLI |
| ClaudeKit Commands | `.claude/commands/` | CC CLI |
| Insights | `insights/accumulated.md` | Shared |
| Plans | `plans/` | Shared |
| Telemetry | `.mekong/telemetry/` | Engine |
| Memory | `.mekong/memory.yaml` | Engine |

### Memory Sync Protocol

- Each session records insights to `insights/accumulated.md`
- Telemetry traces captured in `execution_trace.json`
- Memory entries recorded via `MemoryStore` for goal→recipe matching
- claude-mem Chroma collection for cross-session retrieval

---

## SUPREME COMMANDER PROTOCOL

> T1 mekong-cli = Supreme Commander. Boot BEFORE every day.

### Morning Boot Sequence

1. **`/insight`** — Read `insights/accumulated.md`, analyze weaknesses
2. **Self-Fix** — Fix config, plans, skills, dependencies
3. **Sub-Project Scan** — Verify build all `apps/*`
4. **`/cook`** — Execute remaining phases per sub-project
5. **Daily Report** — Write to `insights/daily-report-YYYY-MM-DD.md`

### Sub-Project Registry

| Project | Path | Type |
|---------|------|------|
| agencyos-web | apps/agencyos-web | submodule |
| sophia-ai-factory | apps/sophia-ai-factory | submodule |
| 84tea | apps/84tea | submodule |
| apex-os | apps/apex-os | submodule |
| anima119 | apps/anima119 | submodule |
| openclaw-worker | apps/openclaw-worker | local |
| raas-gateway | apps/raas-gateway | local |

### Standing Orders

- **KHÔNG OFF** — Never stop the supreme commander session
- **Submodule Git** — Must `cd` into submodule before `git commit`
- **Insight Accumulation** — Every session adds to `insights/accumulated.md`
- **Proxy Check** — If CC CLI loops → check proxy/model config immediately

---

## ĐIỀU INDEX (Quick Reference)

| ĐIỀU | Title | Chapter |
|------|-------|---------|
| 0 | Authority Hierarchy | Stakeholder Matrix |
| 47 | Task Delegation Command Mandate | 第七篇 |
| 48 | Verification Before Reporting | 第十一篇 |
| 49 | GREEN Production Rule | 第四篇 |
| 50 | Mission Success = Top Priority | 第七篇 |
| 51 | Antigravity Proxy Mandate | 第二篇 |
| 52 | Error Recovery Protocol | 第二篇 |
| 53 | M1 Resource Management | 第二篇 |
| 54 | Tôm Hùm Tự Trị (Autonomous Dispatch) | 第九篇 |
| 55 | Ngôn Ngữ — Tiếng Việt Bắt Buộc | Hiến Pháp |

*ĐIỀU 1-46: Inherited from global `~/.claude/CLAUDE.md` rules (CC CLI supervision, i18n sync, production verification, skill activation, browser discipline, etc.)*

---

_Genesis: 2026-02-06 | Hiến Pháp v2.1: 2026-02-11_
_ClaudeKit DNA v2.9.1+ | Agent Teams + BMAD + Binh Pháp + Tôm Hùm v29.0_
