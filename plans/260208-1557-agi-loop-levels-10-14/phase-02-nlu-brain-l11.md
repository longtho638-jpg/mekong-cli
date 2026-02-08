# Phase 02: NLU Brain (Level 11)

## Context Links
- [AGI Roadmap](../../plans/agi-roadmap-levels-10-14.md)
- [Memory Store](../../src/core/memory.py) — (created in L10) used by SmartRouter
- [Orchestrator](../../src/core/orchestrator.py) — integrate NLU into run_from_goal()
- [Gateway](../../src/core/gateway.py) — add POST /nlu/parse
- [Main CLI](../../src/main.py) — NLU integration in cook command

## Overview
- **Priority:** P1
- **Status:** pending
- **Version:** v0.8.0
- **Description:** Add natural language understanding to parse goals into intents + entities. Smart router maps intent to best recipe using memory-aware selection. Supports Vietnamese keywords.

## Key Insights
- No ML needed — keyword/regex matching handles 90% of cases
- Vietnamese keyword support is critical (bilingual CLI)
- LLM fallback only for ambiguous/complex goals (lazy import, no hard dependency)
- SmartRouter integrates MemoryStore: "goal X failed 3x with recipe A, try recipe B"
- Orchestrator's `run_from_goal()` should try NLU parse before raw planning

## Requirements

### Functional
- Classify goals into intents: DEPLOY, AUDIT, CREATE, FIX, STATUS, SCHEDULE, UNKNOWN
- Extract entities: project name, time interval, target node
- Vietnamese keyword mapping (e.g., "trien khai" -> DEPLOY)
- Confidence score (0.0-1.0) per classification
- Smart router: intent+entities -> best recipe or action
- Memory-aware routing: avoid recipes with high failure rate
- LLM fallback for low-confidence classifications
- Gateway: POST /nlu/parse
- Orchestrator integration: NLU before planning

### Non-Functional
- Classification < 10ms for keyword matching
- No external dependencies for basic NLU
- Graceful degradation when LLM unavailable

## Architecture

```
Goal string
    └─> IntentClassifier.classify(goal)
            ├─> Keyword/regex match (fast path)
            └─> LLM fallback (slow path, if confidence < 0.5)
                    └─> IntentResult(intent, confidence, entities)
                            └─> SmartRouter.route(intent_result)
                                    ├─> Exact recipe match
                                    ├─> Intent-based match
                                    └─> LLM recipe generation (fallback)
```

Integration: `Orchestrator.run_from_goal()` -> NLU parse -> SmartRouter -> execute

## Related Code Files

### Create
| File | Lines | Purpose |
|------|-------|---------|
| `src/core/nlu.py` | ~120 | IntentClassifier + entity extraction |
| `src/core/smart_router.py` | ~80 | Memory-aware intent-to-recipe routing |
| `tests/test_nlu.py` | ~130 | NLU classification tests |
| `tests/test_smart_router.py` | ~80 | Router tests |

### Modify
| File | Change |
|------|--------|
| `src/core/orchestrator.py` | Import NLU, use in run_from_goal() before planning |
| `src/core/gateway.py` | Add POST /nlu/parse endpoint, Pydantic models, VERSION 0.8.0 |
| `src/core/__init__.py` | Export IntentClassifier, IntentResult, SmartRouter |
| `src/main.py` | Version bump to 0.8.0 |

## Implementation Steps

### 1. Create IntentClassifier (src/core/nlu.py)

```python
class Intent(str, Enum):
    """Recognized goal intents."""
    DEPLOY = "deploy"
    AUDIT = "audit"
    CREATE = "create"
    FIX = "fix"
    STATUS = "status"
    SCHEDULE = "schedule"
    UNKNOWN = "unknown"

@dataclass
class IntentResult:
    """Result of NLU classification."""
    intent: Intent
    confidence: float  # 0.0-1.0
    entities: Dict[str, str] = field(default_factory=dict)
    suggested_recipe: str = ""
    raw_goal: str = ""

class IntentClassifier:
    """Keyword + regex intent classifier with LLM fallback."""

    KEYWORD_MAP: Dict[Intent, List[str]]  # class-level constant

    def __init__(self, llm_client: Optional[Any] = None) -> None: ...
    def classify(self, goal: str) -> IntentResult: ...
    def _keyword_match(self, goal: str) -> Tuple[Intent, float]: ...
    def _extract_entities(self, goal: str, intent: Intent) -> Dict[str, str]: ...
    def _llm_fallback(self, goal: str) -> IntentResult: ...
```

KEYWORD_MAP:
```python
KEYWORD_MAP = {
    Intent.DEPLOY: ["deploy", "ship", "push", "publish", "trien khai", "triển khai"],
    Intent.AUDIT: ["audit", "check", "scan", "inspect", "kiem tra", "kiểm tra"],
    Intent.CREATE: ["create", "new", "init", "generate", "tao", "tạo"],
    Intent.FIX: ["fix", "repair", "debug", "patch", "sua", "sửa"],
    Intent.STATUS: ["status", "health", "info", "trang thai", "trạng thái"],
    Intent.SCHEDULE: ["schedule", "every", "daily", "cron", "len lich", "lên lịch"],
}
```

Entity extraction rules:
- **project**: word after "deploy/ship/audit/check" that's not a keyword — regex `(?:deploy|ship|audit|check)\s+(\w[\w-]*)`
- **interval**: regex `every\s+(\d+)\s*(min|mins|minutes|hour|hours|s|sec|seconds)` -> normalize to seconds
- **target**: regex `(?:of|on|for)\s+([\w.-]+)` -> node/target identifier

### 2. Create SmartRouter (src/core/smart_router.py)

```python
@dataclass
class RouteResult:
    """Result of smart routing."""
    action: str  # "recipe" | "direct" | "plan"
    recipe_path: str = ""
    recipe_name: str = ""
    reason: str = ""

class SmartRouter:
    """Memory-aware intent-to-recipe router."""

    def __init__(self, memory_store: Optional[MemoryStore] = None) -> None: ...
    def route(self, intent_result: IntentResult) -> RouteResult: ...
    def _find_recipe_by_name(self, name: str) -> Optional[str]: ...
    def _find_recipe_by_intent(self, intent: Intent) -> Optional[str]: ...
    def _check_memory(self, recipe_name: str) -> bool: ...  # True if recipe is viable
    def _scan_recipes(self) -> Dict[str, str]: ...  # {name: path}
```

Key behaviors:
- `route()` priority: exact recipe match > intent-based match > fallback to "plan"
- `_check_memory()` queries MemoryStore: if recipe has <30% success rate over last 10 runs, mark as non-viable
- Recipe scanning: look in `recipes/` directory for `.md` files

### 3. Integrate NLU into Orchestrator (src/core/orchestrator.py)

In `__init__()`:
```python
from .nlu import IntentClassifier
self.nlu = IntentClassifier(llm_client=llm_client)
```

In `run_from_goal()`, before planning phase:
```python
# NLU Phase (pre-planning)
intent_result = self.nlu.classify(goal)
if intent_result.confidence > 0.7 and intent_result.suggested_recipe:
    # Try direct recipe execution
    from .smart_router import SmartRouter
    router = SmartRouter(memory_store=self.memory)
    route = router.route(intent_result)
    if route.action == "recipe" and route.recipe_path:
        from .parser import RecipeParser
        recipe = RecipeParser().parse_file(route.recipe_path)
        return self.run_from_recipe(recipe, progress_callback=progress_callback)
```

### 4. Gateway endpoint (src/core/gateway.py)

Pydantic models:
```python
class NLUParseRequest(BaseModel):
    goal: str = Field(..., min_length=1)

class NLUParseResponse(BaseModel):
    intent: str
    confidence: float
    entities: Dict[str, str]
    suggested_recipe: str
```

Route:
```python
@gateway.post("/nlu/parse", response_model=NLUParseResponse)
def nlu_parse(req: NLUParseRequest):
    from src.core.nlu import IntentClassifier
    classifier = IntentClassifier()
    result = classifier.classify(req.goal)
    return NLUParseResponse(
        intent=result.intent.value,
        confidence=result.confidence,
        entities=result.entities,
        suggested_recipe=result.suggested_recipe,
    )
```

### 5. Version bump
- `src/core/gateway.py`: `VERSION = "0.8.0"`
- `src/main.py`: version string to "0.8.0"

### 6. Write tests

**tests/test_nlu.py** — `class TestIntentClassifier(unittest.TestCase)`:
- `test_deploy_english` — "deploy sophia" -> DEPLOY, confidence > 0.7
- `test_deploy_vietnamese` — "trien khai sophia" -> DEPLOY
- `test_audit_keyword` — "audit security" -> AUDIT
- `test_create_keyword` — "create new project" -> CREATE
- `test_fix_keyword` — "fix login bug" -> FIX
- `test_status_keyword` — "check health" -> STATUS (note: "check" maps to AUDIT, test actual mapping)
- `test_schedule_keyword` — "schedule daily backup" -> SCHEDULE
- `test_unknown_intent` — "hello world" -> UNKNOWN, low confidence
- `test_entity_project` — "deploy sophia" -> entities["project"] = "sophia"
- `test_entity_interval` — "run every 10 mins" -> entities["interval"] = "600"
- `test_entity_target` — "check health of node-1" -> entities["target"] = "node-1"
- `test_case_insensitive` — "DEPLOY APP" works
- `test_multiple_keywords` — first matching intent wins
- `test_confidence_strong_match` — exact keyword -> confidence >= 0.8
- `test_confidence_weak_match` — partial match -> lower confidence

**tests/test_smart_router.py** — `class TestSmartRouter(unittest.TestCase)`:
- `test_route_unknown_intent` — returns action="plan"
- `test_route_with_no_recipes` — returns action="plan"
- `test_route_with_recipe_match` — returns action="recipe" with path
- `test_memory_check_low_success` — recipe with <30% success rate skipped
- `test_memory_check_viable` — recipe with >50% success rate used
- `test_route_no_memory` — works without memory store
- `test_scan_recipes_empty_dir` — handles missing recipes/ dir

### 7. Run tests
```bash
python3 -m pytest tests/ -v --tb=short
```

## Todo List
- [ ] Create src/core/nlu.py with Intent enum, IntentResult, IntentClassifier
- [ ] Create src/core/smart_router.py with SmartRouter, RouteResult
- [ ] Integrate NLU into orchestrator.run_from_goal()
- [ ] Add POST /nlu/parse gateway endpoint
- [ ] Bump version to 0.8.0
- [ ] Write tests/test_nlu.py (15 tests)
- [ ] Write tests/test_smart_router.py (7 tests)
- [ ] Update src/core/__init__.py exports
- [ ] Run full test suite, verify 260+

## Success Criteria
- `python3 -m pytest tests/ -v` passes with 260+ tests
- "deploy sophia" classified as DEPLOY intent with project=sophia
- Vietnamese goals correctly classified
- SmartRouter avoids recipes with low success rate
- POST /nlu/parse returns structured JSON

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Keyword collisions between intents | Medium | Priority ordering; first match wins |
| Vietnamese diacritics vs ASCII | Low | Match both forms in KEYWORD_MAP |
| LLM fallback adds latency | Low | Only triggered when confidence < 0.5 |
| Recipe directory missing | Low | Graceful fallback to "plan" action |

## Security Considerations
- NLU parse endpoint doesn't require token (read-only, no execution)
- Entity extraction uses regex — no injection risk
- LLM fallback input sanitized (goal string only)

## Next Steps
- L12 Telegram will use NLU to parse `/cmd` messages
- L13 Self-Evolution uses intent patterns for recipe generation
