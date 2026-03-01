# Mekong-CLI Codebase Exploration Report

**Date:** March 1, 2026  
**Status:** Comprehensive Architecture Analysis Complete  
**Scope:** Full codebase review (src/core, src/agents, src/main.py, tests)

---

## Executive Summary

Mekong-CLI is a sophisticated **Plan-Execute-Verify (PEV)** autonomous execution engine built on the Binh Pháp (Art of War) framework. The codebase is extensive (~13.5K lines in core), well-structured but with significant architectural opportunities for refactoring.

**Key Finding:** 35 files exceed 200-line threshold. This requires strategic modularization to maintain code maintainability per development rules (max 200 lines).

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 Core Design Pattern: Plan-Execute-Verify (PEV)

```
User Goal
   │
   ├─→ RecipePlanner (PLAN phase)
   │   └─→ Recipe object with ordered steps
   │
   ├─→ RecipeExecutor (EXECUTE phase)
   │   └─→ Shell/LLM/API mode execution
   │   └─→ ExecutionResult with exit_code, stdout, stderr
   │
   ├─→ RecipeVerifier (VERIFY phase)
   │   └─→ VerificationReport with quality gates
   │
   └─→ RecipeOrchestrator (COORDINATION)
       └─→ Manages Plan→Execute→Verify→Rollback workflow
       └─→ Integrates telemetry, memory, NLU, swarm dispatch
```

**Strengths:**
- Clean separation of concerns (Plan/Execute/Verify are distinct classes)
- Proper dataclass usage for immutable results (ExecutionResult, VerificationReport)
- Rollback capability on failure
- Telemetry integration via TelemetryCollector
- Memory integration (MemoryStore for goal→recipe matching)

**Weaknesses:**
- Orchestrator is 624 lines (should be <200)
- Too many responsibilities in RecipeOrchestrator (planning context, NLU, swarm dispatch, memory, telemetry)
- No clear separation between happy path and error handling

---

## 2. PROJECT STRUCTURE

### 2.1 File Organization

```
src/
├── main.py (1186 lines)              ❌ MASSIVE - Contains 30+ commands
├── core/
│   ├── __init__.py (49 lines)        ✅ Exports are clean
│   ├── orchestrator.py (624 lines)   ❌ OVERSIZED
│   ├── gateway.py (774 lines)        ❌ OVERSIZED
│   ├── telegram_bot.py (742 lines)   ❌ OVERSIZED
│   ├── agi_loop.py (505 lines)       ❌ OVERSIZED
│   ├── llm_client.py (504 lines)     ❌ OVERSIZED
│   ├── planner.py (447 lines)        ❌ OVERSIZED
│   ├── verifier.py (468 lines)       ❌ OVERSIZED
│   ├── gateway_dashboard.py (384)    ❌ OVERSIZED
│   ├── [51 more files...]
│
├── agents/
│   ├── __init__.py (27 lines)        ✅ Clean registry
│   ├── file_agent.py (290 lines)     ❌ OVERSIZED
│   ├── git_agent.py (206 lines)      ⚠️  Borderline
│   ├── [4 more agents...]
│
├── cli/, commands/, components/, pages/, raas/, binh_phap/
```

**File Count:** 57 core Python files  
**Total Core Lines:** ~13,500 lines  
**Average File Size:** ~237 lines (exceeds 200 limit)

---

## 3. ARCHITECTURE GAPS & ISSUES

### 3.1 Files OVER 200 Lines (35 total - CRITICAL)

| File | Lines | Issue | Priority |
|------|-------|-------|----------|
| main.py | 1186 | 30+ commands, CLI entry point bloated | CRITICAL |
| gateway.py | 774 | FastAPI + WebSocket + auth + config mixing | CRITICAL |
| telegram_bot.py | 742 | Bot logic + handlers + middleware tangled | CRITICAL |
| orchestrator.py | 624 | PEV coordination + NLU + swarm + memory | CRITICAL |
| agi_loop.py | 505 | AGI loop + patterns + decisions mixed | HIGH |
| llm_client.py | 504 | Provider failover + cache + hooks all together | HIGH |
| verifier.py | 468 | 6 different verification types monolithic | HIGH |
| planner.py | 447 | Planning + decomposition + validation coupled | HIGH |
| gateway_dashboard.py | 384 | HTML rendering + logic mixed | HIGH |
| nlp_commander.py | 341 | NLU parsing + intent classification | HIGH |
| routing_strategy.py | 325 | Smart routing + memory integration | HIGH |
| telemetry.py | 323 | Metrics collection + traces + storage | HIGH |
| provider_registry.py | 307 | Provider configs + health checks | HIGH |
| zx_executor.py | 306 | Shell execution + self-healing + retry logic | HIGH |
| hooks.py | 304 | Hook system + middleware + caching | HIGH |
| executor.py | 301 | 3 execution modes in 1 class | HIGH |
| file_agent.py | 290 | 6 file operations in monolithic class | HIGH |
| [20 more files with 200-265 lines...] | | | MEDIUM |

**Impact:** Violates dev rule (max 200 lines for optimal context management). Harder to:
- Unit test individual components
- Read full file in context window
- Apply single responsibility principle
- Reuse isolated logic

---

### 3.2 Import Dependencies - High Coupling

**Files with Most Imports:**
- `main.py`: 46 imports (knows about 20+ modules)
- `gateway.py`: 31 imports (highly coupled to orchestration)
- `telegram_bot.py`: 29 imports (tightly coupled)
- `orchestrator.py`: 27 imports (central hub, expected)

**Problem:** Circular dependency risk
```python
# orchestrator.py imports from llm_client, memory, nlu
# llm_client imports from hooks, cache
# hooks imports from orchestrator? (not yet, but fragile)
```

**Recommendation:** Create dependency injection pattern to decouple LLMClient from orchestration context.

---

### 3.3 Missing Type Hints & Validations

**Status:** Generally good, but areas of concern:

```python
# ❌ In gateway.py, some functions use implicit Any
def handle_webhook(data: dict) -> dict:  # Should be Dict[str, Any]
    ...

# ✅ Most core classes properly typed:
@dataclass
class ExecutionResult:
    exit_code: int = 0
    stdout: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
```

**Assessment:** ~95% coverage, ~5 files need type hint cleanup.

---

### 3.4 Code Quality Metrics

| Metric | Status | Details |
|--------|--------|---------|
| `any` types | ✅ Good | Only in verifier.py (checking for `: any` in code) |
| Console logs | ⚠️ 191 instances | Mostly in main.py and gateway.py (Rich console printing) |
| TODO/FIXME | ✅ Clean | Only in verifier.py comments (tech debt checks) |
| Test coverage | ⚠️ ~40% | 148 test files, but many are smoke/integration |
| Circular imports | ✅ None detected | Imports are well-ordered |

---

## 4. KEY COMPONENTS ANALYSIS

### 4.1 Core Module: Orchestrator (624 lines)

**Current Responsibilities:**
1. Plan-Execute-Verify coordination
2. NLU intent classification integration
3. Smart routing (recipe lookup)
4. Memory recording
5. Telemetry collection
6. Retry policy management
7. Swarm dispatch (optional)
8. BMAD workflow loading
9. Progress callbacks

**Should Be Split Into:**
```
orchestrator.py (core logic only: 150 lines)
├── orchestrator_nlu.py (NLU integration: 80 lines)
├── orchestrator_routing.py (smart routing: 100 lines)
├── orchestrator_memory.py (memory recording: 80 lines)
├── orchestrator_telemetry.py (telemetry integration: 70 lines)
└── orchestrator_swarm.py (swarm dispatch: 90 lines)
```

---

### 4.2 Gateway Module (774 lines)

**Current Responsibilities:**
1. FastAPI app setup
2. Route handlers (/cmd, /health, /swarm/*, /schedule/*, /memory/*)
3. Response models (20+ Pydantic classes)
4. Preset actions definition
5. Dashboard rendering
6. WebSocket handling (partial)
7. Authentication

**Should Be Split Into:**
```
gateway.py (core FastAPI setup: 100 lines)
├── gateway_routes.py (command endpoint: 150 lines)
├── gateway_models.py (all Pydantic models: 200 lines)
├── gateway_handlers/ (separate by domain)
│   ├── swarm_handlers.py (swarm routes)
│   ├── schedule_handlers.py (schedule routes)
│   ├── memory_handlers.py (memory routes)
│   └── admin_handlers.py (config, presets)
└── gateway_auth.py (API token validation: 50 lines)
```

---

### 4.3 LLM Client (504 lines)

**Current Responsibilities:**
1. Provider management (Gemini, OpenAI, Antigravity)
2. Circuit breaker logic
3. Request/response handling
4. Caching via LLMCache
5. Hook pipeline execution
6. Failover logic
7. Request queuing

**Issues:**
- Provider health tracking mixed with request logic
- No clear separation between "client" and "provider registry"
- Cache integration tightly coupled

**Should Be Split Into:**
```
llm_client.py (main chat/completion interface: 150 lines)
├── llm_provider_health.py (circuit breaker: 80 lines)
├── llm_failover.py (failover strategy: 120 lines)
├── llm_request_queue.py (request management: 80 lines)
└── [llm_cache.py already separate - 252 lines, also oversized]
```

---

### 4.4 Main CLI Entry Point (1186 lines)

**Current Commands:**
1. Initialization (init)
2. Recipe management (list, search, run)
3. UI mode (ui)
4. Execution (cook, plan, ask, debug)
5. Gateway (gateway, dash)
6. Swarm (swarm add/list/dispatch/remove)
7. Scheduling (schedule add/list/remove)
8. Memory (memory list/stats/clear)
9. Telegram (telegram start/status)
10. Autonomous (autonomous status/run/resume)
11. Miscellaneous (halt, evolve, version)

**Problem:** Mixed concerns in single file
- CLI framework setup (Typer)
- Command implementations (could delegate to subcommand modules)
- UI logic (could go to separate UI module)

**Refactor Plan:**
```
main.py (core CLI setup: 100 lines)
├── cli/
│   ├── recipe_commands.py (list, search, run, ui)
│   ├── execution_commands.py (cook, plan, ask, debug)
│   ├── gateway_commands.py (gateway, dash)
│   ├── agent_commands.py (swarm, schedule, memory, telegram)
│   ├── autonomous_commands.py (autonomous, halt, evolve)
│   └── info_commands.py (version, status)
```

---

## 5. AGENTS SUBSYSTEM

### 5.1 Agent Architecture

**Pattern:** All agents inherit from `AgentBase` with `plan() → execute() → verify()` flow.

```python
class AgentBase:
    def plan(input: str) -> List[Task]
    def execute(task: Task) -> Result
    def verify(result: Result) -> bool
```

**Agents in Registry:**
| Agent | Lines | Status | Role |
|-------|-------|--------|------|
| GitAgent | 206 | ✅ Good | Git operations |
| FileAgent | 290 | ⚠️ Large | File system ops |
| ShellAgent | ~150 | ✅ Good | Shell execution |
| LeadHunter | ~140 | ✅ Good | CEO discovery |
| ContentWriter | ~140 | ✅ Good | Content gen |
| RecipeCrawler | ~140 | ✅ Good | Recipe discovery |

**Observations:**
- FileAgent is 290 lines (supports 6 operations: find, read, write, tree, stats, grep)
- GitAgent is 206 lines (supports 7 operations: status, diff, log, commit, push, pull, checkout)
- Both could be split by operation

**Refactor: FileAgent**
```
file_agent.py (base class: 80 lines)
├── file_find_op.py (find operation)
├── file_read_op.py (read operation)
├── file_write_op.py (write operation - SECURITY)
├── file_tree_op.py (tree operation)
├── file_stats_op.py (stats operation)
└── file_grep_op.py (grep operation)
```

---

## 6. TEST INFRASTRUCTURE

### 6.1 Test File Inventory

**Total Test Files:** 148  
**Largest Tests:**
- test_opentelemetry.py: 1182 lines (instrumentation tests)
- test_gateway.py: 1670 lines (API route tests)
- test_ab_testing.py: 445 lines (A/B test framework)
- test_cc_client.py: 406 lines (Claude Code client)

**Test Structure:**
```
tests/
├── test_*.py (unit tests)
├── backend/ (backend-specific)
├── e2e/ (end-to-end tests, including test_purchase_flow.py: 460 lines)
├── integration/ (integration tests)
├── regression/ (regression suite)
├── deployment/ (deployment validation)
└── fixtures/ (test data)
```

**Assessment:**
- ✅ Comprehensive test coverage
- ✅ Good separation (unit, integration, e2e, regression)
- ⚠️ Some test files also oversized (>200 lines) - should extract fixtures/helpers

---

## 7. DEPENDENCY GRAPH

### 7.1 Core Module Dependencies

```
main.py
├─→ parser.py
├─→ executor.py
├─→ registry.py
├─→ orchestrator.py (HUB)
│   ├─→ planner.py
│   ├─→ verifier.py
│   ├─→ llm_client.py
│   ├─→ memory.py
│   ├─→ nlu.py
│   ├─→ smart_router.py
│   ├─→ execution_history.py
│   ├─→ retry_policy.py
│   ├─→ workflow_state.py
│   ├─→ swarm.py (optional)
│   └─→ telemetry.py
├─→ gateway.py (EXPOSES via FastAPI)
│   ├─→ orchestrator.py
│   ├─→ swarm.py
│   ├─→ scheduler.py
│   ├─→ memory.py
│   ├─→ event_bus.py
│   └─→ gateway_dashboard.py
└─→ agents/*
    └─→ agent_base.py
```

**Key Observation:** Orchestrator is the central hub. Almost everything depends on it either directly or indirectly.

---

## 8. MISSING/INCOMPLETE FEATURES

### 8.1 Webhook Delivery Engine (webhook_delivery_engine.py: 197 lines)

**Status:** Exists but underutilized
- Has webhook retry logic
- Has signature validation
- NOT integrated into orchestrator result pipeline

**Gap:** No automatic webhook notifications when goals complete.

### 8.2 Vector Memory Store (vector_memory_store.py: 214 lines)

**Status:** Partially implemented
- Has embedding interface
- Memory storage abstraction
- NOT connected to main memory store for goal→recipe matching

**Gap:** Semantic search not used in orchestrator NLU phase.

### 8.3 Protocol Handler (protocol_handler.py: 154 lines)

**Status:** Stub implementation
- Handles "protocol://" URLs in goals
- Could delegate to external services
- NOT tested or documented

### 8.4 Smart Router (smart_router.py: 135 lines)

**Status:** Implemented but underutilized
- Routes goals to recipes based on confidence
- Checks memory for similar patterns
- Used in orchestrator but not exposed in CLI

**Gap:** No standalone `/route` command to inspect routing decisions.

---

## 9. CODE PATTERNS & STANDARDS

### 9.1 Good Patterns Observed

✅ **Dataclass Usage**
```python
@dataclass
class ExecutionResult:
    exit_code: int = 0
    stdout: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
```

✅ **Enum for State Management**
```python
class OrchestrationStatus(Enum):
    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"
```

✅ **Proper Separation of Concerns**
- Parser handles recipe parsing
- Executor handles command execution
- Verifier handles result validation
- Orchestrator handles coordination

✅ **Type Hints**
Most functions are properly typed with `→` return annotations.

### 9.2 Anti-patterns Observed

❌ **God Objects**
- Orchestrator trying to do too much
- Gateway mixing HTTP routing with business logic
- LLMClient mixing provider selection with request handling

❌ **String-based Configuration**
```python
# In planner.py AGENT_KEYWORDS - magic strings
AGENT_KEYWORDS: Dict[str, List[str]] = {
    "git": ["git", "commit", ...],
    "file": ["file", "read", ...],
    ...
}
```

❌ **Implicit Type Conversions**
```python
# In gateway.py - some responses don't match declared types
def handle_command(...) -> CommandResponse:
    result = orchestrator.run_from_goal(goal)
    # Converting result fields to response model manually
```

---

## 10. SECURITY OBSERVATIONS

### 10.1 Strengths

✅ API token validation (required in gateway)  
✅ Path traversal protection (FileAgent checks `is_relative_to`)  
✅ No hardcoded secrets in codebase  
✅ LLM input validation via hooks  

### 10.2 Gaps

⚠️ **File Write Operation** (FileAgent)
- Can write arbitrary files if not restricted
- Should add whitelist of writable directories

⚠️ **Shell Execution** (ShellAgent, executor.py)
- Uses subprocess.run() with shell output
- Should sanitize/validate shell commands

⚠️ **Webhook Delivery**
- webhook_delivery_engine.py has retry logic but no rate limiting
- Could be abused for DDoS via goal→webhook loop

---

## 11. PERFORMANCE CONSIDERATIONS

### 11.1 Caching

**LLMCache (252 lines):**
- LRU cache for LLM responses
- Supports key generation with parameters
- TTL support

**Assessment:** Good, but could be extracted to separate package.

### 11.2 Concurrency

**Status:** Limited async support
- Gateway uses FastAPI (async-ready)
- Core orchestrator is synchronous
- Telegram bot has async handlers
- No thread pooling for parallel agent execution

**Gap:** Swarm dispatch could benefit from asyncio.gather() for parallel remote execution.

### 11.3 Resource Management

**Positive:**
- LLMCache limits size (memory bounded)
- Event bus clears subscribers (no memory leaks)
- ExecutionHistory discards old entries

**Concern:**
- No explicit cleanup of memory store entries
- TelemetryCollector accumulates traces (unbounded growth)

---

## 12. DOCUMENTATION & MAINTAINABILITY

### 12.1 Code Comments

**Status:** Good docstrings in core classes
```python
class RecipeOrchestrator:
    """
    Coordinates Plan → Execute → Verify workflow.
    
    This is the main entry point for executing goals...
    """
```

**Gap:** Many helper functions lack docstrings. `if TYPE_CHECKING` imports not documented.

### 12.2 Module-level Documentation

**Pattern:** Most files have module docstring
```python
"""
Mekong CLI - Recipe Orchestrator

Coordinates Plan → Execute → Verify workflow.
Implements ClaudeKit DNA's triadic pattern.
"""
```

**Gap:** No architecture documentation file (arch.md) in docs/.

---

## 13. RECOMMENDED REFACTORING PLAN

### Phase 1: HIGH PRIORITY (Unblock maintainability)

**Objective:** Split 9 files >400 lines

| File | Current | Target | Effort |
|------|---------|--------|--------|
| main.py | 1186 → | 6 files of ~200ea | 3 days |
| gateway.py | 774 → | 5 files of ~150ea | 2 days |
| orchestrator.py | 624 → | 5 files of ~120ea | 2 days |
| telegram_bot.py | 742 → | 4 files of ~180ea | 2 days |
| agi_loop.py | 505 → | 3 files of ~170ea | 1.5 days |

**Total Phase 1 Effort:** ~10.5 days

### Phase 2: MEDIUM PRIORITY (Improve testability)

**Objective:** Extract agent operations into separate classes

| Agent | Current | Target | Effort |
|-------|---------|--------|--------|
| FileAgent | 290 → | 6 operation classes | 2 days |
| GitAgent | 206 → | 7 operation classes | 1.5 days |
| LLMClient | 504 → | 4 files (provider, failover, queue, cache) | 2 days |

**Total Phase 2 Effort:** ~5.5 days

### Phase 3: QUALITY (Polish & test)

**Objective:** Improve code coverage and reduce cognitive complexity

- Extract 20 test helper functions from large test files
- Add architecture documentation
- Create type stubs for external integrations

**Effort:** ~3 days

---

## 14. UNRESOLVED QUESTIONS

1. **Vector Memory Integration**: Is semantic search (vector_memory_store) supposed to power NLU intent classification? Currently unused.

2. **Protocol Handler**: What protocols should be supported? (http://, ftp://, custom://) Currently stubbed.

3. **Webhook Bidirectional Communication**: Can webhook results feed back into goal execution? Current implementation is one-way.

4. **BMAD Workflow Loader**: Why does orchestrator try to load BMAD workflows on init? Should be lazy-loaded.

5. **Swarm Dispatcher Concurrency**: Does SwarmDispatcher support parallel dispatch to multiple nodes? Or is it sequential?

6. **Memory Store Cleanup**: Is there a garbage collection policy for old execution entries? Risk of unbounded growth.

7. **LLM Provider Preferences**: How are provider preferences configured? (Gemini vs OpenAI vs Antigravity) Currently env-based, no per-goal override.

8. **Governance System**: governance.py exists (172 lines) but orchestrator doesn't integrate halt/resume. Should it?

9. **Auto Discovery Feature**: auto_discovery.py (169 lines) discovers collectors in apps/ - is this used? Not visible in CLI.

10. **Health Watchdog Integration**: health_watchdog.py (236 lines) monitors subsystems - is it running? Not started in main.py.

---

## 15. METRICS SUMMARY

| Metric | Value | Status |
|--------|-------|--------|
| Total Core Files | 57 | |
| Total Core Lines | ~13,500 | |
| Files >200 lines | 35 | ❌ HIGH TECH DEBT |
| Files >400 lines | 9 | ❌ CRITICAL |
| Test Files | 148 | ✅ Good coverage |
| Type Hint Coverage | ~95% | ✅ Good |
| Circular Imports | 0 | ✅ Good |
| Documented Modules | 50/57 | ✅ Good |
| CLI Commands | 30+ | ⚠️ Large |
| Agent Types | 6 | ✅ Manageable |

---

## 16. NEXT STEPS

1. **Immediate:** Create architecture.md documenting PEV pattern and module dependencies
2. **This Week:** Split main.py into 6 CLI subcommand modules (highest impact)
3. **Next Week:** Refactor orchestrator.py into 5 focused modules
4. **Later:** Address gateway.py and LLM client complexity

---

**Report Generated:** 2026-03-01  
**Analysis Time:** Comprehensive (all major files read)  
**Recommendations:** Actionable with effort estimates  

