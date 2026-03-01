# Mekong CLI Codebase Scout Report

**Date:** 2026-03-01 14:05  
**Project:** mekong-cli  
**Scope:** Comprehensive architecture & capability overview  

---

## Executive Summary

Mekong CLI is a **Revenue-as-a-Service (RaaS) Agency Operating System** built on the **Plan-Execute-Verify (PEV) pattern** and the **孫子兵法 (Binh Phap) philosophy**. The codebase consists of:

- **130 test files** (830 total tests collected)
- **~2.1MB** of core Python code (`src/`)
- **34 microservices/apps** (13 Submodules + 21 Local)
- **80+ Hub SDKs** (Wellness, Commerce, HR, Travel, Fashion, PropTech, etc.)
- **Mature orchestration layers** (Swarm, Scheduler, Memory, Telegram Bot, AGI Loop)

**NO existing calendar/booking/scheduling features** found. Foundation ready for cal.com integration.

---

## 1. Project Structure

### Root Layout
```
mekong-cli/
├── src/                      # 2.1MB - Core engine
│   ├── core/               # Plan-Execute-Verify pipeline (34 modules)
│   ├── agents/             # 7 specialized agents
│   ├── raas/               # Revenue-as-a-Service layer (13 modules)
│   ├── commands/           # CLI sub-commands
│   ├── cli/                # TUI/CLI interface (Typer + Rich)
│   ├── binh_phap/          # Quality gates enforcement
│   └── components/         # UI components (Streamlit)
├── apps/                     # 34 projects (microservices)
│   ├── (13 git submodules)
│   └── (21 local services)
├── packages/               # 25+ Hub SDKs (monorepo)
├── tests/                  # 130 test files, 830+ tests
├── docs/                   # 120+ documentation files
├── .mekong/               # Runtime state (schedule.yaml, memory, telemetry)
└── .claude/               # ClaudeKit DNA (80+ skills, 50+ commands)
```

### Monorepo Apps (34 Total)

#### Core Infrastructure (8 apps)
| App | Purpose | Stack | Size |
|-----|---------|-------|------|
| `openclaw-worker` | Tôm Hùm daemon — autonomous task orchestrator | Node.js | 1.0G |
| `raas-gateway` | Cloud API gateway, Cloudflare Workers | Node.js | 739M |
| `engine` | Python PEV engine (planning, execution, verification) | Python/FastAPI | 900M |
| `api` | Backend API service | Python/FastAPI | 767M |
| `worker` | Background job processor | Node.js | 147M |
| `antigravity-cli` | Antigravity proxy CLI | Node.js | 16K |
| `antigravity-gateway` | Proxy gateway | Node.js | 44K |
| `gemini-proxy-clone` | Gemini API proxy | Node.js | 4.5M |

#### Client Products (8 apps) ⭐
| App | Status | Stack |
|-----|--------|-------|
| `84tea` | Active | Next.js, TS |
| `sophia-ai-factory` | Active | Next.js, TS |
| `apex-os` | Active | Next.js, TS |
| `anima119` | Active | Next.js, TS |
| `well` | Symlink | Next.js, TS |
| `com-anh-duong-10x` | Active | Next.js, TS |
| `sophia-proposal` | Archive | Next.js, TS |
| `sa-dec-flower-hunt` | Archive | Next.js, TS |

#### AgencyOS Platform (9 apps)
| App | Purpose | Status |
|-----|---------|--------|
| `agencyos-web` | Main SaaS platform | Active |
| `agencyos-landing` | Marketing landing | Active |
| `dashboard` | Client portal | Active |
| `admin` | Admin panel | Scaffold |
| `analytics` | Analytics dashboard | Active |
| `developers` | Dev portal | Active |
| `docs` | Documentation site | Active |
| `landing` | Public landing | Scaffold |
| `web` | Frontend | Active |

#### Experimental/Support (9 apps)
- `algo-trader` — Algorithmic trading engine (Experimental)
- `agentic-brain` — AI research (Research)
- `stealth-engine` — Execution engine (Experimental)
- `vibe-coding-cafe` — Dev environment (Experimental)
- `raas-demo` — Demo app (Demo)
- `starter-template` — Project template (Template)
- `tasks` — Task queue inbox (System)
- `project` — Build placeholder (Scaffold)

### Hub SDKs (25+ Packages)
Located in `packages/`:
- `vibe-wellness` — Health & fitness
- `vibe-composable-commerce` — E-commerce
- `vibe-identity` — Auth & user mgmt
- `vibe-hr` — Human resources
- `events-hub-sdk` — Event management
- `travel-hub-sdk` — Travel bookings
- `people-hub-sdk` — CRM
- `fashion-hub-sdk` — Fashion/apparel
- `proptech-hub-sdk` — Real estate
- `mekong-clawwork` — Task queue SDK
- UI components, tooling, analytics

---

## 2. Core Architecture (Plan-Execute-Verify)

### PEV Pipeline (`src/core/`)

#### Key Modules (34 files)

| Module | Purpose | Loc |
|--------|---------|-----|
| `orchestrator.py` | Coordinates Plan→Execute→Verify | 250+ |
| `planner.py` | LLM-powered goal decomposition | 200+ |
| `executor.py` | Multi-mode step execution (shell/LLM/API) | 200+ |
| `verifier.py` | Result validation & quality gates | 180+ |
| `parser.py` | Markdown recipe parsing | 150+ |
| `llm_client.py` | OpenAI-compatible LLM interface | 200+ |
| `scheduler.py` | Recurring job scheduling (interval/daily) | 250+ |
| `agent_base.py` | Abstract agent base class | 100+ |
| `memory.py` | Persistent memory store (chroma) | 180+ |
| `memory_client.py` | Memory client wrapper | 100+ |
| `swarm.py` | Multi-node agent dispatch | 250+ |
| `autonomous.py` | AGI loop autonomy control | 180+ |
| `agi_loop.py` | Continuous learning loop | 200+ |
| `nlu.py` | Intent classification | 120+ |
| `smart_router.py` | Smart task routing | 150+ |
| `gateway.py` | FastAPI REST API gateway | 350+ |
| `gateway_dashboard.py` | Web dashboard (Streamlit) | 250+ |
| `event_bus.py` | Event emission system | 100+ |
| `telemetry.py` | Execution tracing | 150+ |
| `registry.py` | Recipe/agent registry | 150+ |
| `recipe_gen.py` | Recipe generation from goals | 120+ |
| `parser.py` | Recipe/workflow parsing | 150+ |
| `exceptions.py` | Custom exception hierarchy | 80+ |
| `notifier.py` | Notifications (Telegram, etc) | 120+ |
| `telegram_bot.py` | Telegram bot integration | 150+ |
| `nlp_commander.py` | NLP command processing | 100+ |
| `cc_spawner.py` | CC CLI launcher | 100+ |
| `self_improve.py` | Self-healing logic | 120+ |

**Data Structures:**
- `OrchestrationResult` — Complete workflow result
- `ExecutionResult` — Step output (exit_code, stdout, stderr, metadata)
- `VerificationReport` — Quality gate report
- `StepResult` — Single step result with retry/healing info
- `ScheduledJob` — Recurring job definition
- `MemoryEntry` — Searchable memory record

### Plan-Execute-Verify Flow

```
User Goal
   ↓
[PLAN] RecipePlanner.plan()
   ├─ NLU intent classification
   ├─ Agent routing suggestion
   ├─ LLM-powered decomposition
   └─ → Recipe (Markdown with verification criteria)
   ↓
[EXECUTE] RecipeExecutor.execute_step()
   ├─ Multi-mode: shell / LLM / API
   ├─ Self-healing on failure (AI-corrects)
   ├─ Retry with exponential backoff
   └─ → ExecutionResult (exit_code, stdout, stderr)
   ↓
[VERIFY] RecipeVerifier.verify()
   ├─ Exit code checks
   ├─ File existence checks
   ├─ Output pattern matching
   ├─ Custom shell checks
   ├─ Binh Phap Quality Gates
   └─ → VerificationReport (passed/failed/warning)
   ↓
[ROLLBACK] if verification failed & enable_rollback=True
   └─ Reverse completed steps via rollback callbacks
```

---

## 3. Agents (7 Specialized)

Located in `src/agents/`:

| Agent | Inherits | Capabilities |
|-------|----------|--------------|
| `GitAgent` | AgentBase | status, diff, log, commit, branch, merge, rebase, push, pull |
| `FileAgent` | AgentBase | find, read, write, copy, move, delete, rename, tree, stats |
| `ShellAgent` | AgentBase | Execute shell commands with output capture |
| `LeadHunter` | AgentBase | Company/CEO lead discovery via web scraping |
| `ContentWriter` | AgentBase | Content generation (articles, blogs, SEO) |
| `RecipeCrawler` | AgentBase | Recipe discovery & learning from docs |
| `AGIBridge` | AgentBase | Bridge to external AGI systems |

All agents implement: `plan() → execute() → verify()` pattern.

---

## 4. Existing Features & Capabilities

### CLI Commands (Main Entry: `mekong`)

#### Core Commands
- `mekong init` — Initialize .mekong/ directory
- `mekong list` — Show available recipes
- `mekong search <query>` — Search recipes
- `mekong run <recipe>` — Execute recipe workflow
- `mekong cook <goal>` — Full PEV pipeline (plan + execute + verify)
- `mekong plan <goal>` — Plan only (preview steps)
- `mekong ask <question>` — Ask codebase questions
- `mekong debug <issue>` — Debug workflow
- `mekong ui` — Launch Streamlit dashboard
- `mekong version` — Show version (v2.2.0)

#### Sub-Commands
- `mekong gateway` — Start FastAPI server (:8000)
- `mekong dash` — Open dashboard
- `mekong halt` — Stop operations
- `mekong evolve` — Self-improvement loop

#### Swarm Management
- `mekong swarm add <name> <url>` — Register node
- `mekong swarm list` — List registered nodes
- `mekong swarm dispatch <goal>` — Route to best node
- `mekong swarm remove <name>` — Deregister node

#### Scheduling (BUILT-IN!)
- `mekong schedule list` — Show all scheduled jobs
- `mekong schedule add <name> <goal> [--interval 300] [--daily HH:MM]`
- `mekong schedule remove <job_id>`

**Note:** Scheduler exists but does NOT integrate with calendar systems. Currently supports:
- Interval jobs (every X seconds)
- Daily jobs (at HH:MM)
- Persistent storage (.mekong/schedule.yaml)
- Event emission (JOB_STARTED, JOB_COMPLETED)

#### Memory System
- `mekong memory list` — Show memory entries
- `mekong memory stats` — Memory statistics
- `mekong memory clear` — Clear memory store

#### Telegram Bot
- `mekong telegram start` — Start Telegram bot
- `mekong telegram status` — Bot health check

#### Autonomous Mode
- `mekong autonomous status` — Show AGI loop status
- `mekong autonomous run` — Run autonomy cycle
- `mekong autonomous resume` — Resume after pause

#### Binh Phap Quality Gates
- `mekong binh-phap` — Sub-command group
- Quality checks: type safety, tech debt, security, performance

#### BMAD Workflows
- `mekong bmad` — Sub-command group (169 workflows)

#### AGI Daemon (Tôm Hùm)
- `mekong agi start` — Boot autonomous daemon
- `mekong agi status` — Daemon health
- `mekong agi stop` — Graceful shutdown
- `mekong agi restart` — Restart daemon

### Scheduling & Job System

#### Scheduler Class (`scheduler.py`)
- **Types:** `interval` (every X sec) | `daily` (at HH:MM)
- **Persistence:** YAML file (`.mekong/schedule.yaml`)
- **API:**
  - `add_job(name, goal, job_type, interval_seconds, daily_time)`
  - `remove_job(job_id)`
  - `list_jobs()` → ScheduledJob[]
  - `get_due_jobs()` → jobs ready to run
  - `mark_completed(job)` → reschedule next run
  - `tick()` → async check & execute due jobs
  - `run_loop(check_interval=60)` → main event loop

#### ScheduledJob Dataclass
```python
@dataclass
class ScheduledJob:
    id: str                    # UUID hex[:8]
    name: str                  # User-friendly name
    goal: str                  # Mekong goal to execute
    job_type: str             # "interval" | "daily"
    interval_seconds: int = 0 # For interval jobs
    daily_time: str = ""      # "HH:MM" for daily jobs
    enabled: bool = True
    last_run: float = 0.0     # Unix timestamp
    next_run: float = 0.0     # Unix timestamp
    run_count: int = 0        # Execution count
```

### RaaS Layer (`src/raas/`)

#### Modules
- `auth.py` — API key & user authentication
- `billing.py` — Credit system, billing cycles, invoicing
- `credits.py` — Credit ledger & usage tracking
- `dashboard.py` — RaaS analytics dashboard
- `mission_models.py` — Mission data models
- `mission_store.py` — Mission persistence
- `missions.py` — Mission lifecycle management
- `registry.py` — Service registry & discovery
- `sdk.py` — RaaS SDK for external apps
- `sse.py` — Server-Sent Events for real-time updates
- `tenant.py` — Multi-tenant isolation

#### RaaS Features
- Multi-tier billing (Free / Agency / Enterprise)
- Credit allocation & enforcement
- Mission tracking (submitted → executing → completed)
- Real-time SSE updates
- API endpoint protection (gateway)
- Tenant isolation

### Memory System (`memory.py`, `memory_client.py`)

- **Backend:** Chroma vector DB (semantic search)
- **Scope:** Cross-session goal→recipe matching
- **Storage:** `.mekong/memory.yaml` (local) + Chroma (cloud)
- **Query:** Semantic search for similar past executions
- **Use Case:** Learn from previous runs, suggest recipes

### Event Bus (`event_bus.py`)

- **Types:** JOB_STARTED, JOB_COMPLETED, EXECUTION_BEGAN, STEP_COMPLETED, etc
- **Listeners:** Async event dispatch
- **Use Case:** Dashboard real-time updates, webhooks

### Telegram Bot (`telegram_bot.py`)

- **Integration:** Telegram webhook for remote commands
- **Commands:** `/cook`, `/plan`, `/schedule add`, status checks
- **Use Case:** Remote mission dispatch from Telegram

### Autonomous Loop (`agi_loop.py`, `autonomous.py`)

- **Pattern:** Continuous learning → execute → improve
- **Features:**
  - Self-CTO pilot (auto-generates quality tasks)
  - Self-healing (AI corrects failed steps)
  - Binh Phap auto-audits (console cleanup, type safety, security)
  - Event tracing for learning

### SwarmDispatcher (`swarm.py`)

- **Nodes:** Multiple edge nodes registered
- **Routing:** Smart dispatch based on:
  - Task complexity
  - Node capacity
  - Historical performance
- **Execution:** Parallel agent execution across nodes
- **Registry:** SwarmRegistry for node discovery

### Tôm Hùm Daemon (`apps/openclaw-worker/`)

- **Type:** Autonomous background orchestrator (Node.js)
- **Functions:**
  - Watch `tasks/` directory for mission files
  - Spawn/monitor CC CLI brain process
  - Inject goals via stdin (expect script)
  - Emit results to `.mekong/mission_done`
  - Auto-CTO: generate quality tasks during idle time
  - M1 thermal protection (kill resource hogs)

---

## 5. Test Coverage

### Statistics
- **Total Test Files:** 130
- **Total Tests:** 830+ collected
- **Categories:**
  - Unit tests: `tests/unit/` (swarm, self_improve, mcp_servers, ops)
  - Integration tests: `tests/integration/`
  - Backend tests: `tests/backend/` (API, services, workers, middleware)
  - Deployment tests: `tests/deployment/`
  - Regression tests: `tests/regression/`
  - Fixtures: `tests/fixtures/`

### Command to Run
```bash
python3 -m pytest /path/to/tests --collect-only
python3 -m pytest /path/to/tests -v
```

### Test Patterns
- Pytest fixtures for agent mocking
- Mock LLM client for executor tests
- File-based recipe parsing tests
- Verification gate tests
- Memory store semantic search tests
- RaaS billing & credit tests

---

## 6. Key Architectural Patterns

### Pattern 1: PEV (Plan-Execute-Verify)
Every task decomposes into three phases with quality gates between each.

### Pattern 2: Agent-as-a-Service
Modular agents handle different task types (git, file, shell, lead hunting, content, etc).

### Pattern 3: Recipe-Driven Execution
Goals → Recipes (Markdown with steps) → Executor → Verification.

### Pattern 4: Binh Phap Quality Gates
Automated checks for:
- Type safety (0 `any` types)
- Tech debt (0 TODO/FIXME)
- Security (0 high vulns, no secrets)
- Performance (build < 10s)
- UX polish (loading states)
- Documentation coverage

### Pattern 5: Autonomous Scheduling
Built-in scheduler with interval/daily jobs, persistent storage, event emission.

### Pattern 6: Multi-Tenant RaaS
Credit system, mission tracking, billing cycles, tenant isolation.

### Pattern 7: Swarm Orchestration
Parallel dispatch to multiple nodes, smart routing based on capacity/complexity.

---

## 7. Technology Stack

### Language & Runtime
- **Python:** 3.9+ (core engine, CLI)
- **Node.js:** 20+ (orchestration, APIs, workers)
- **TypeScript:** All Next.js apps & packages

### Core Frameworks
- **Python Backend:** FastAPI (gateway), Typer (CLI)
- **Node Backend:** Fastify, OpenClaw (autonomous)
- **Frontend:** Next.js 14+, React, Tailwind CSS
- **Async:** asyncio (Python), async/await (Node)

### Data & Storage
- **Database:** PostgreSQL (Prod), SQLite (Dev)
- **Vector DB:** Chroma (semantic search / memory)
- **Message Queue:** BullMQ (job queue)
- **Cache:** Redis (optional)
- **File Storage:** S3 / R2 (via Cloudflare)

### Infrastructure
- **API Gateway:** Cloudflare Workers (raas-gateway)
- **Proxy:** Antigravity Proxy (port 9191, load balance LLM)
- **Monitoring:** Telemetry, Sentry (optional)
- **Auth:** Supabase (OAuth), API Keys

### LLM Integration
- **Models:** Claude (Anthropic), Gemini (Google), DeepSeek
- **Load Balancing:** Antigravity Proxy (automatic failover)
- **Client:** OpenAI-compatible (custom llm_client.py)

### Development Tools
- **Testing:** pytest (130 test files, 830+ tests)
- **Linting:** ruff, mypy
- **Type Checking:** Pydantic, Zod
- **CLI:** Typer, Rich (TUI)
- **Git:** Pre-commit hooks, git worktrees
- **Documentation:** Markdown, MkDocs

---

## 8. Absence of Calendar/Booking Features

### Current State
- ✅ Scheduler exists (interval/daily jobs)
- ✅ RaaS mission tracking (timestamps)
- ✅ Event bus for real-time updates
- ❌ **No cal.com integration**
- ❌ **No availability calendar**
- ❌ **No booking system**
- ❌ **No timezone handling**
- ❌ **No recurring event templates**
- ❌ **No conflict detection**
- ❌ **No calendar sync (Google, Outlook, etc)**
- ❌ **No notifications before events**
- ❌ **No user calendar preferences**

### What Exists That Can Be Reused
1. **Scheduler Framework** — Can be extended with calendar semantics
2. **Event Bus** — Perfect for booking notifications
3. **RaaS Mission Models** — Can be extended for bookings
4. **Persistent Storage** — YAML & PostgreSQL ready
5. **Telegram Bot** — Can handle booking commands
6. **Agent System** — Can route booking-related tasks
7. **PEV Pattern** — Booking operations fit perfectly

---

## 9. Code Quality Metrics

### Structure Quality
- ✅ Modular separation (core, agents, raas, cli)
- ✅ Clear data structures (dataclasses, enums)
- ✅ Type hints throughout
- ✅ Docstrings on public methods
- ✅ Custom exception hierarchy
- ✅ Abstract base classes (AgentBase)

### Test Quality
- ✅ 830+ tests collected
- ✅ Unit, integration, regression coverage
- ✅ Fixture-based test setup
- ✅ Mock LLM client for isolation
- ✅ File-based recipe test vectors

### Documentation
- ✅ 120+ docs in `docs/`
- ✅ Inline code comments
- ✅ README at project root
- ✅ Architecture diagrams
- ✅ PDR (Product Development Requirements)
- ✅ Code standards guide

### Standards Compliance
- ✅ Binh Phap Quality Gates
- ✅ Type safety enforcement (mypy)
- ✅ Linting (ruff)
- ✅ No tech debt rules
- ✅ Security scanning

---

## 10. Unresolved Questions

1. **Calendar Integration Scope:** Should cal.com integration be:
   - A standalone CLI command (`mekong calendar`)?
   - Integrated into existing scheduler (`mekong schedule add --calendar google`)?
   - A separate Hub SDK (`packages/calendar-hub-sdk`)?

2. **Availability Model:** Should availability be:
   - Per-user (each user has their own calendar)?
   - Per-service/team (shared team calendars)?
   - Hybrid (both user + team availability)?

3. **Timezone Handling:** Should the system:
   - Infer timezones from user location?
   - Require explicit timezone per booking/user?
   - Support Olson database (e.g., "Asia/Bangkok")?

4. **Booking Semantics:** Are bookings:
   - Appointments (fixed duration, specific time)?
   - Slots (available time windows)?
   - Both with different handling?

5. **Conflict Detection:** Should system:
   - Block double-booking automatically?
   - Allow overbooking with warnings?
   - Support buffer time between bookings?

6. **External Calendar Sync:** Should system:
   - Sync TO Google Calendar / Outlook?
   - Sync FROM user's Google Calendar to find availability?
   - Both bidirectional?

7. **API Design:** Should cal.com integration be:
   - REST API only?
   - gRPC for agent-to-agent communication?
   - Both with fallback?

8. **Storage:** Should booking data be:
   - In PostgreSQL alongside existing missions?
   - In a separate service (microservice pattern)?
   - Distributed (each app has local booking DB)?

---

## Summary

Mekong CLI is a **mature, production-grade orchestration platform** with:
- Solid PEV architecture
- 7 specialized agents
- 830+ tests (comprehensive coverage)
- Built-in scheduling (interval/daily only)
- Autonomous daemon (Tôm Hùm)
- Multi-tenant RaaS layer
- Event-driven architecture

**Ready for cal.com integration.** No calendar features currently exist, so we have a clean slate to design the perfect integration without legacy constraints.

**Recommended next steps:**
1. Review scheduling requirements in detail
2. Design booking data model
3. Identify which Hub SDKs need calendar features
4. Create integration plan (CLI commands, API endpoints, agents)

