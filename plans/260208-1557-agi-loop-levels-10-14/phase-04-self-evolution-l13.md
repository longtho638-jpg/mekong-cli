# Phase 04: Self-Evolution (Level 13)

## Context Links
- [AGI Roadmap](../../plans/agi-roadmap-levels-10-14.md)
- [Memory Store](../../src/core/memory.py) — (L10) source of successful runs
- [Learner](../../src/core/learner.py) — (L10) pattern analysis
- [NLU](../../src/core/nlu.py) — (L11) intent patterns for recipe generation
- [Parser](../../src/core/parser.py) — Recipe/RecipeStep dataclasses for validation
- [Gateway](../../src/core/gateway.py) — add /recipes/generate, /recipes/auto
- [Main CLI](../../src/main.py) — add `evolve` command

## Overview
- **Priority:** P1
- **Status:** pending
- **Version:** v0.10.0
- **Description:** Mekong learns to create its own recipes from successful runs. Analyzes failures, deprecates bad recipes, tracks evolution in a journal. The system improves itself.

## Key Insights
- Recipe generation from successful runs = template extraction from memory entries
- Recipe validation uses existing RecipeParser — round-trip parse test
- Auto-generated recipes go to `recipes/auto/` — separate from human-authored
- SelfImprover watches patterns from PatternAnalyzer and triggers recipe generation
- Journal (``.mekong/journal.yaml`) creates audit trail of all evolution decisions
- New EventBus events: RECIPE_GENERATED, RECIPE_DEPRECATED

## Requirements

### Functional
- Generate recipe from successful execution memory entry
- Generate recipe from goal pattern via LLM
- Validate recipe structure (parseable, has required fields)
- Save auto-generated recipes to `recipes/auto/`
- Track recipe effectiveness over time
- Deprecate recipes with consistently low success rates (<20% over 10+ runs)
- Learning journal: log all generation/deprecation decisions
- Gateway: POST /recipes/generate, GET /recipes/auto, POST /recipes/validate
- CLI: `mekong evolve` — show evolution status + trigger analysis

### Non-Functional
- Recipe generation < 5s (LLM path) or < 100ms (template path)
- Auto-recipes directory created on first save
- Journal file bounded (max 200 entries, FIFO)

## Architecture

```
MemoryStore (successful runs)
    └─> RecipeGenerator.from_successful_run(entry)
            └─> Recipe markdown template
                    └─> RecipeGenerator.validate_recipe(md)
                            └─> RecipeGenerator.save_recipe(md, name)
                                    └─> recipes/auto/<name>.md
                                    └─> EventBus.emit(RECIPE_GENERATED)

PatternAnalyzer (failure patterns)
    └─> SelfImprover.analyze_failures()
            └─> Deprecate bad recipes
                    └─> EventBus.emit(RECIPE_DEPRECATED)
            └─> Suggest new recipes
                    └─> RecipeGenerator.from_goal_pattern()
```

## Related Code Files

### Create
| File | Lines | Purpose |
|------|-------|---------|
| `src/core/recipe_gen.py` | ~150 | RecipeGenerator class |
| `src/core/self_improve.py` | ~100 | SelfImprover + Journal |
| `tests/test_recipe_gen.py` | ~120 | Recipe generation tests |
| `tests/test_self_improve.py` | ~80 | Self-improvement tests |

### Modify
| File | Change |
|------|--------|
| `src/core/event_bus.py` | Add RECIPE_GENERATED, RECIPE_DEPRECATED to EventType |
| `src/core/gateway.py` | Add /recipes/* endpoints, VERSION 0.10.0 |
| `src/core/__init__.py` | Export RecipeGenerator, SelfImprover |
| `src/main.py` | Add `evolve` command, version 0.10.0 |

## Implementation Steps

### 1. Add EventType entries (src/core/event_bus.py)

```python
RECIPE_GENERATED = "recipe_generated"
RECIPE_DEPRECATED = "recipe_deprecated"
```

### 2. Create RecipeGenerator (src/core/recipe_gen.py)

```python
RECIPE_TEMPLATE = """# {name}
> {description}

## Steps

{steps}

## Metadata
- Generated: {timestamp}
- Source: {source}
- Tags: auto-generated
"""

@dataclass
class GeneratedRecipe:
    """A generated recipe with metadata."""
    name: str
    content: str
    source: str  # "successful_run" | "goal_pattern" | "llm"
    valid: bool = False

class RecipeGenerator:
    """Generates recipes from execution history and goal patterns."""

    AUTO_DIR: str = "recipes/auto"

    def __init__(self, llm_client: Optional[Any] = None) -> None: ...
    def from_successful_run(self, entry: MemoryEntry) -> GeneratedRecipe: ...
    def from_goal_pattern(self, goal: str, steps: List[str] = None) -> GeneratedRecipe: ...
    def validate_recipe(self, recipe_md: str) -> Tuple[bool, List[str]]: ...
    def save_recipe(self, recipe: GeneratedRecipe) -> str: ...  # Returns file path
    def list_auto_recipes(self) -> List[Dict[str, str]]: ...
    def _slugify(self, name: str) -> str: ...
    def _generate_via_llm(self, goal: str) -> str: ...
```

Key behaviors:
- `from_successful_run()` extracts goal as recipe name, creates single-step recipe from the entry
- `from_goal_pattern()` if steps provided, creates multi-step recipe; else uses LLM
- `validate_recipe()` tries RecipeParser.parse_string(), returns (valid, errors)
- `save_recipe()` writes to `recipes/auto/<slug>.md`, emits RECIPE_GENERATED
- `list_auto_recipes()` scans `recipes/auto/`, returns [{name, path, created}]

### 3. Create SelfImprover (src/core/self_improve.py)

```python
@dataclass
class JournalEntry:
    """A single evolution journal entry."""
    timestamp: float = field(default_factory=time.time)
    action: str = ""  # "generated" | "deprecated" | "suggestion"
    target: str = ""  # recipe name or goal
    reason: str = ""
    data: Dict[str, Any] = field(default_factory=dict)

class SelfImprover:
    """Analyzes execution patterns and triggers self-improvement."""

    MAX_JOURNAL: int = 200
    DEPRECATION_THRESHOLD: float = 0.2  # 20% success rate
    MIN_RUNS_FOR_DEPRECATION: int = 10

    def __init__(
        self,
        memory_store: MemoryStore,
        recipe_generator: RecipeGenerator,
        journal_path: Optional[str] = None,
    ) -> None: ...

    def analyze_and_improve(self) -> List[JournalEntry]: ...
    def deprecate_bad_recipes(self) -> List[str]: ...
    def suggest_new_recipes(self) -> List[str]: ...
    def get_journal(self, limit: int = 20) -> List[JournalEntry]: ...
    def get_evolution_stats(self) -> Dict[str, Any]: ...
    def _load_journal(self) -> None: ...
    def _save_journal(self) -> None: ...
    def _record(self, entry: JournalEntry) -> None: ...
```

Key behaviors:
- `analyze_and_improve()` orchestrates full cycle: deprecate bad + suggest new + generate
- `deprecate_bad_recipes()` checks memory for recipes with <20% success rate over 10+ runs, renames file to `.deprecated`, emits RECIPE_DEPRECATED
- `suggest_new_recipes()` finds goals that succeeded manually but have no recipe — generates one
- Journal persists to `.mekong/journal.yaml`, FIFO at 200 entries
- `get_evolution_stats()` returns {total_generated, total_deprecated, journal_size, last_evolution}

### 4. Gateway endpoints (src/core/gateway.py)

Pydantic models:
```python
class RecipeGenerateRequest(BaseModel):
    goal: str = Field(..., min_length=1)
    steps: List[str] = Field(default_factory=list)

class RecipeGenerateResponse(BaseModel):
    name: str
    content: str
    source: str
    valid: bool
    path: str

class RecipeValidateRequest(BaseModel):
    content: str = Field(..., min_length=1)

class RecipeValidateResponse(BaseModel):
    valid: bool
    errors: List[str]

class AutoRecipeInfo(BaseModel):
    name: str
    path: str
```

Routes:
```python
@gateway.post("/recipes/generate", response_model=RecipeGenerateResponse)
def recipes_generate(req: RecipeGenerateRequest): ...

@gateway.get("/recipes/auto", response_model=List[AutoRecipeInfo])
def recipes_auto_list(): ...

@gateway.post("/recipes/validate", response_model=RecipeValidateResponse)
def recipes_validate(req: RecipeValidateRequest): ...
```

### 5. CLI command (src/main.py)

```python
@app.command()
def evolve():
    """Trigger self-evolution: analyze patterns, generate recipes, deprecate bad ones."""
    from src.core.memory import MemoryStore
    from src.core.recipe_gen import RecipeGenerator
    from src.core.self_improve import SelfImprover

    memory = MemoryStore()
    generator = RecipeGenerator()
    improver = SelfImprover(memory, generator)
    results = improver.analyze_and_improve()
    # Display results table
    ...
```

### 6. Version bump
- `src/core/gateway.py`: `VERSION = "0.10.0"`
- `src/main.py`: version string to "0.10.0"

### 7. Write tests

**tests/test_recipe_gen.py** — `class TestRecipeGenerator(unittest.TestCase)`:
- `test_from_successful_run` — generates valid recipe from MemoryEntry
- `test_from_goal_pattern_with_steps` — multi-step recipe
- `test_from_goal_pattern_no_steps_no_llm` — returns empty/basic recipe
- `test_validate_valid_recipe` — returns (True, [])
- `test_validate_invalid_recipe` — returns (False, [errors])
- `test_save_recipe_creates_file` — file exists in recipes/auto/
- `test_save_recipe_emits_event` — RECIPE_GENERATED emitted
- `test_list_auto_recipes_empty` — returns []
- `test_list_auto_recipes_with_files` — returns recipe list
- `test_slugify` — "Deploy App" -> "deploy-app"
- `test_auto_dir_created` — recipes/auto/ created on save
- `test_generated_recipe_dataclass` — fields populated

**tests/test_self_improve.py** — `class TestSelfImprover(unittest.TestCase)`:
- `test_deprecate_low_success_rate` — recipe with <20% deprecated
- `test_no_deprecation_few_runs` — <10 runs = not enough data
- `test_no_deprecation_high_success` — >50% kept
- `test_suggest_new_from_manual_success` — goal without recipe -> suggestion
- `test_journal_persistence` — save, reload, entries preserved
- `test_journal_fifo` — >200 entries evicts oldest
- `test_evolution_stats` — correct counts
- `test_analyze_and_improve_full_cycle` — deprecates + suggests + generates
- `test_record_journal_entry` — entry appended with timestamp

### 8. Run tests
```bash
python3 -m pytest tests/ -v --tb=short
```

## Todo List
- [ ] Add RECIPE_GENERATED, RECIPE_DEPRECATED to EventType
- [ ] Create src/core/recipe_gen.py with RecipeGenerator, GeneratedRecipe
- [ ] Create src/core/self_improve.py with SelfImprover, JournalEntry
- [ ] Add gateway /recipes/* endpoints
- [ ] Add CLI evolve command
- [ ] Bump version to 0.10.0
- [ ] Write tests/test_recipe_gen.py (12 tests)
- [ ] Write tests/test_self_improve.py (9 tests)
- [ ] Update src/core/__init__.py exports
- [ ] Run full test suite, verify 310+

## Success Criteria
- `python3 -m pytest tests/ -v` passes with 310+ tests
- `mekong evolve` runs analysis and shows results
- Successful run generates recipe in recipes/auto/
- Low-success recipes get deprecated
- `.mekong/journal.yaml` tracks all evolution decisions
- POST /recipes/generate returns valid recipe

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Auto-recipes of poor quality | Medium | Validate before save; deprecation loop |
| recipes/auto/ cluttered | Low | Periodic cleanup; journal tracks |
| LLM generation hallucinated steps | Medium | Validate via RecipeParser |
| Deprecation of good recipe (data skew) | Medium | Require 10+ runs before deprecation |

## Security Considerations
- Auto-generated recipes may contain shell commands — mark as "review_required" in L14
- recipes/auto/ should be git-ignored or reviewed before committing
- Journal entries don't contain sensitive data (goal strings only)

## Next Steps
- L14 AGI Certification connects RecipeGenerator to autonomous loop
- Governance layer (L14) classifies auto-generated recipes as safe/review_required
