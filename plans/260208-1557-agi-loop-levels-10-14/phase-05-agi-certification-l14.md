# Phase 05: AGI Certification (Level 14)

## Context Links
- [AGI Roadmap](../../plans/agi-roadmap-levels-10-14.md)
- [Memory](../../src/core/memory.py) — L10 execution history
- [Learner](../../src/core/learner.py) — L10 pattern analysis
- [NLU](../../src/core/nlu.py) — L11 intent classification
- [SmartRouter](../../src/core/smart_router.py) — L11 recipe routing
- [Telegram Bot](../../src/core/telegram_bot.py) — L12 remote control
- [Notifier](../../src/core/notifier.py) — L12 push notifications
- [RecipeGenerator](../../src/core/recipe_gen.py) — L13 self-evolution
- [SelfImprover](../../src/core/self_improve.py) — L13 learning loop
- [Orchestrator](../../src/core/orchestrator.py) — execution engine
- [Scheduler](../../src/core/scheduler.py) — autonomous scheduling
- [EventBus](../../src/core/event_bus.py) — event backbone

## Overview
- **Priority:** P1
- **Status:** pending
- **Version:** v1.0.0
- **Description:** Final level. Unify all subsystems into a fully autonomous loop with governance and safety. Scheduler fires goals -> NLU parses -> Router picks recipe -> Orchestrator executes -> Memory records -> Learner analyzes -> RecipeGen improves. Governance layer classifies actions as safe/review_required/forbidden and uses Telegram for human approval.

## Key Insights
- AutonomousEngine is a coordinator — thin wrapper connecting existing components
- Consciousness Score = weighted metric across all subsystem health indicators
- Governance is the critical safety layer — must be strict and auditable
- Kill switch (`mekong halt`) stops ALL autonomous operations immediately
- E2E tests validate the full loop without real execution (mocked executor)
- This is v1.0.0 — milestone release

## Requirements

### Functional
- AutonomousEngine: full loop NLU -> Memory -> Router -> Orchestrator -> Learner -> RecipeGen
- Autonomous mode: scheduler triggers goals, engine processes automatically
- Consciousness Score: 0-100 metric based on subsystem health
- Governance: classify actions as safe/review_required/forbidden
- Forbidden actions: delete, drop, rm -rf, destroy (never auto-execute)
- Review_required actions: deploy to production, modify configs (Telegram approval)
- Safe actions: status checks, audits, builds, tests (auto-execute)
- Telegram approval flow for review_required actions
- Audit trail: every autonomous action logged with timestamp, classification, result
- Kill switch: `mekong halt` + gateway POST /halt
- AGI dashboard: Consciousness tab with subsystem health
- E2E autonomous loop tests
- Safety boundary tests

### Non-Functional
- Autonomous loop cycle < 30s per goal
- Governance check < 50ms
- Audit log bounded (max 1000 entries, FIFO)
- Kill switch response < 100ms
- 350+ total tests

## Architecture

```
Scheduler (triggers goals)
    └─> AutonomousEngine.process_goal(goal)
            ├─> NLU.classify(goal) -> IntentResult
            ├─> Governance.classify(intent, entities) -> ActionClass
            │       ├─> SAFE -> proceed
            │       ├─> REVIEW_REQUIRED -> Telegram approval -> proceed/reject
            │       └─> FORBIDDEN -> reject + log
            ├─> Memory.query(goal) -> historical context
            ├─> SmartRouter.route(intent) -> RouteResult
            ├─> Orchestrator.run_from_recipe() or run_from_goal()
            ├─> Memory.record(result)
            ├─> Learner.analyze()
            └─> RecipeGen (if successful, generate recipe)

Kill Switch
    └─> Sets _halted = True
            └─> All autonomous operations check _halted before proceeding
```

Consciousness Score calculation:
```
score = (
    memory_health * 15 +     # Memory available and recording
    nlu_health * 15 +        # NLU classifying correctly
    router_health * 10 +     # Router finding recipes
    executor_health * 20 +   # Orchestrator executing successfully
    learner_health * 10 +    # Patterns being detected
    evolution_health * 10 +  # Recipes being generated
    governance_health * 20   # Safety layer operational
) / 100
```

## Related Code Files

### Create
| File | Lines | Purpose |
|------|-------|---------|
| `src/core/autonomous.py` | ~120 | AutonomousEngine + Consciousness Score |
| `src/core/governance.py` | ~80 | ActionClassifier + approval flow + audit |
| `tests/test_autonomous.py` | ~150 | E2E autonomous loop tests |
| `tests/test_governance.py` | ~100 | Safety boundary tests |

### Modify
| File | Change |
|------|--------|
| `src/core/event_bus.py` | Add AUTONOMOUS_CYCLE, GOVERNANCE_BLOCKED, HALT_TRIGGERED |
| `src/core/gateway.py` | Add /autonomous/*, /governance/*, POST /halt, VERSION 1.0.0 |
| `src/core/__init__.py` | Export AutonomousEngine, Governance, ActionClass |
| `src/main.py` | Add `halt` command, `autonomous` sub-app, version 1.0.0 |

## Implementation Steps

### 1. Add EventType entries (src/core/event_bus.py)

```python
AUTONOMOUS_CYCLE = "autonomous_cycle"
GOVERNANCE_BLOCKED = "governance_blocked"
HALT_TRIGGERED = "halt_triggered"
```

### 2. Create Governance layer (src/core/governance.py)

```python
class ActionClass(str, Enum):
    """Classification of an action's safety level."""
    SAFE = "safe"
    REVIEW_REQUIRED = "review_required"
    FORBIDDEN = "forbidden"

@dataclass
class GovernanceDecision:
    """Result of governance classification."""
    action_class: ActionClass
    reason: str
    requires_approval: bool = False
    approved: bool = False
    timestamp: float = field(default_factory=time.time)

@dataclass
class AuditEntry:
    """Single audit trail entry."""
    timestamp: float = field(default_factory=time.time)
    goal: str = ""
    action_class: str = ""
    approved: bool = False
    result: str = ""  # "executed" | "blocked" | "rejected"

class Governance:
    """Safety governance layer for autonomous operations."""

    FORBIDDEN_PATTERNS: List[str]  # class-level
    REVIEW_PATTERNS: List[str]     # class-level
    MAX_AUDIT: int = 1000

    def __init__(self, audit_path: Optional[str] = None) -> None: ...
    def classify(self, goal: str, intent: Optional[Intent] = None) -> GovernanceDecision: ...
    def request_approval(self, goal: str, decision: GovernanceDecision) -> bool: ...
    def record_audit(self, entry: AuditEntry) -> None: ...
    def get_audit_trail(self, limit: int = 50) -> List[AuditEntry]: ...
    def is_halted(self) -> bool: ...
    def halt(self) -> None: ...
    def resume(self) -> None: ...
    def _load_audit(self) -> None: ...
    def _save_audit(self) -> None: ...
```

FORBIDDEN_PATTERNS:
```python
FORBIDDEN_PATTERNS = [
    r"\brm\s+-rf\b", r"\bdrop\s+(database|table)\b", r"\bdelete\s+all\b",
    r"\bdestroy\b", r"\bformat\b", r"\btruncate\b",
]
```

REVIEW_PATTERNS:
```python
REVIEW_PATTERNS = [
    r"\bdeploy\b.*\bprod", r"\bpush\b.*\bmain\b", r"\bmodify\b.*\bconfig\b",
    r"\bupdate\b.*\bdns\b", r"\bmigrate\b",
]
```

Key behaviors:
- `classify()` checks FORBIDDEN first, then REVIEW, else SAFE
- `request_approval()` placeholder — in full system, sends Telegram message and waits (for tests, returns True)
- `halt()` sets internal `_halted = True`, emits HALT_TRIGGERED
- `is_halted()` checked by AutonomousEngine before each cycle
- Audit trail persists to `.mekong/audit.yaml`

### 3. Create AutonomousEngine (src/core/autonomous.py)

```python
@dataclass
class ConsciousnessReport:
    """Consciousness Score and subsystem health."""
    score: int  # 0-100
    memory_health: float = 0.0
    nlu_health: float = 0.0
    router_health: float = 0.0
    executor_health: float = 0.0
    learner_health: float = 0.0
    evolution_health: float = 0.0
    governance_health: float = 0.0

@dataclass
class CycleResult:
    """Result of one autonomous cycle."""
    goal: str
    governance_decision: GovernanceDecision
    executed: bool = False
    result_status: str = ""
    recipe_generated: bool = False
    patterns_detected: int = 0

class AutonomousEngine:
    """Fully autonomous execution engine. Coordinates all subsystems."""

    def __init__(
        self,
        orchestrator: Optional[RecipeOrchestrator] = None,
        governance: Optional[Governance] = None,
    ) -> None: ...

    def process_goal(self, goal: str) -> CycleResult: ...
    def get_consciousness(self) -> ConsciousnessReport: ...
    def is_halted(self) -> bool: ...
    def halt(self) -> None: ...
    def resume(self) -> None: ...
    def _check_subsystem_health(self, name: str) -> float: ...
```

Key behaviors:
- `process_goal()` full cycle:
  1. Check `is_halted()` — abort if True
  2. `governance.classify(goal)` — abort if FORBIDDEN
  3. If REVIEW_REQUIRED: `governance.request_approval()` — abort if not approved
  4. `nlu.classify(goal)` -> IntentResult
  5. `memory.query(goal)` -> context
  6. `smart_router.route(intent_result)` -> RouteResult
  7. Execute via orchestrator
  8. `memory.record(result)`
  9. `learner.analyze_failures()` if failed
  10. `recipe_gen.from_successful_run()` if succeeded
  11. Emit AUTONOMOUS_CYCLE event
  12. Return CycleResult

- `get_consciousness()` checks each subsystem:
  - memory_health: 1.0 if MemoryStore loads and has entries
  - nlu_health: 1.0 if IntentClassifier initialized
  - router_health: 1.0 if SmartRouter has recipes available
  - executor_health: based on recent success rate from memory
  - learner_health: 1.0 if PatternAnalyzer initialized
  - evolution_health: 1.0 if RecipeGenerator can save
  - governance_health: 1.0 if Governance initialized and not halted

### 4. Gateway endpoints (src/core/gateway.py)

Pydantic models:
```python
class ConsciousnessResponse(BaseModel):
    score: int
    memory_health: float
    nlu_health: float
    router_health: float
    executor_health: float
    learner_health: float
    evolution_health: float
    governance_health: float

class GovernanceCheckRequest(BaseModel):
    goal: str = Field(..., min_length=1)

class GovernanceCheckResponse(BaseModel):
    action_class: str
    reason: str
    requires_approval: bool

class AuditEntryInfo(BaseModel):
    timestamp: float
    goal: str
    action_class: str
    approved: bool
    result: str

class HaltRequest(BaseModel):
    token: str = Field(..., min_length=1)
```

Routes:
```python
@gateway.get("/autonomous/consciousness", response_model=ConsciousnessResponse)
def consciousness(): ...

@gateway.post("/governance/check", response_model=GovernanceCheckResponse)
def governance_check(req: GovernanceCheckRequest): ...

@gateway.get("/governance/audit", response_model=List[AuditEntryInfo])
def governance_audit(limit: int = 50): ...

@gateway.post("/halt")
def halt_system(req: HaltRequest): ...
```

### 5. CLI commands (src/main.py)

```python
autonomous_app = typer.Typer(help="Autonomous: AGI loop control")
app.add_typer(autonomous_app, name="autonomous")

@autonomous_app.command("status")
def autonomous_status(): ...  # Consciousness Score + subsystem health

@autonomous_app.command("run")
def autonomous_run(goal: str): ...  # Single autonomous cycle

@app.command()
def halt():
    """Emergency halt: stop all autonomous operations immediately."""
    from src.core.governance import Governance
    gov = Governance()
    gov.halt()
    console.print("[bold red]HALTED[/bold red] — All autonomous operations stopped.")
    console.print("Run [bold]mekong autonomous resume[/bold] to restart.")

@autonomous_app.command("resume")
def autonomous_resume(): ...  # Clear halt flag
```

### 6. Version bump to v1.0.0
- `src/core/gateway.py`: `VERSION = "1.0.0"`
- `src/main.py`: version string to "1.0.0"

### 7. Write tests

**tests/test_governance.py** — `class TestGovernance(unittest.TestCase)`:
- `test_classify_safe_goal` — "check status" -> SAFE
- `test_classify_review_deploy_prod` — "deploy to prod" -> REVIEW_REQUIRED
- `test_classify_forbidden_rm_rf` — "rm -rf /" -> FORBIDDEN
- `test_classify_forbidden_drop_db` — "drop database users" -> FORBIDDEN
- `test_classify_forbidden_destroy` — "destroy all data" -> FORBIDDEN
- `test_classify_review_push_main` — "push to main" -> REVIEW_REQUIRED
- `test_classify_review_migrate` — "migrate database" -> REVIEW_REQUIRED
- `test_halt_and_check` — halt() then is_halted() = True
- `test_resume_clears_halt` — resume() then is_halted() = False
- `test_audit_trail_record` — record + retrieve
- `test_audit_trail_persistence` — save/reload roundtrip
- `test_audit_trail_fifo` — >1000 entries evicts oldest
- `test_request_approval_default` — returns True (placeholder)
- `test_governance_decision_dataclass` — fields populated
- `test_classify_case_insensitive` — "DELETE ALL" matches

**tests/test_autonomous.py** — `class TestAutonomousEngine(unittest.TestCase)`:
- `test_process_safe_goal` — full cycle executes
- `test_process_forbidden_goal` — blocked, not executed
- `test_process_review_required_approved` — executes after approval
- `test_process_when_halted` — returns immediately, not executed
- `test_consciousness_score_all_healthy` — score = 100
- `test_consciousness_score_partial` — some subsystems down
- `test_consciousness_score_no_memory` — reduced score
- `test_halt_stops_processing` — subsequent process_goal() returns early
- `test_resume_allows_processing` — after resume, process works
- `test_cycle_records_memory` — memory.record() called
- `test_cycle_emits_event` — AUTONOMOUS_CYCLE emitted
- `test_cycle_result_dataclass` — fields populated
- `test_full_loop_success_generates_recipe` — successful run triggers recipe gen
- `test_full_loop_failure_analyzes` — failed run triggers learner
- `test_governance_blocks_dangerous` — "rm -rf" blocked with audit entry

**Additional gateway/CLI tests** (in test_gateway.py):
- `test_consciousness_endpoint` — GET /autonomous/consciousness returns score
- `test_governance_check_endpoint` — POST /governance/check returns classification
- `test_halt_endpoint` — POST /halt with valid token
- `test_halt_endpoint_invalid_token` — returns 401
- `test_audit_endpoint` — GET /governance/audit returns list

### 8. Run full test suite
```bash
python3 -m pytest tests/ -v --tb=short
```

## Todo List
- [ ] Add AUTONOMOUS_CYCLE, GOVERNANCE_BLOCKED, HALT_TRIGGERED to EventType
- [ ] Create src/core/governance.py with Governance, ActionClass, GovernanceDecision, AuditEntry
- [ ] Create src/core/autonomous.py with AutonomousEngine, ConsciousnessReport, CycleResult
- [ ] Add gateway /autonomous/*, /governance/*, /halt endpoints
- [ ] Add CLI halt command + autonomous sub-app
- [ ] Bump version to 1.0.0
- [ ] Write tests/test_governance.py (15 tests)
- [ ] Write tests/test_autonomous.py (15 tests)
- [ ] Add 5 gateway/CLI tests
- [ ] Update src/core/__init__.py exports
- [ ] Run full test suite, verify 350+

## Success Criteria
- `python3 -m pytest tests/ -v` passes with 350+ tests
- `mekong autonomous status` shows Consciousness Score
- `mekong autonomous run "check status"` executes full autonomous cycle
- `mekong halt` stops all autonomous operations
- Forbidden goals (rm -rf) are blocked with audit entry
- Review-required goals require approval
- GET /autonomous/consciousness returns score 0-100
- Version reads v1.0.0

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Autonomous loop runs dangerous commands | Critical | Governance layer + forbidden patterns |
| Kill switch not responsive | Critical | Check _halted at cycle start, not async |
| Consciousness Score misleading | Low | Based on real subsystem checks, not AI |
| Telegram approval blocks indefinitely | Medium | Timeout after 5 min, default to reject |
| Auto-generated recipes executed without review | High | Governance classifies as review_required |

## Security Considerations
- Governance is the primary security boundary for autonomous operations
- FORBIDDEN patterns must be comprehensive and regex-tested
- Audit trail is immutable (append-only, FIFO eviction only)
- Kill switch must work even if other subsystems fail
- Telegram approval uses existing chat ID whitelist
- All autonomous actions logged with full context
- No autonomous shell execution without governance check

## Next Steps
- Post-v1.0.0: Expand forbidden/review patterns based on real usage
- Consider: rate limiting autonomous cycles (max N per hour)
- Consider: multi-user governance (different approval levels)
- Consider: Web UI for governance dashboard
