---
title: "Phase 1 — Mission Type System"
status: pending
priority: P1
effort: 2h
---

# Phase 1: Mission Type System

## Overview
Cal.com event types (personal/collective/round-robin) mapped to mekong-cli **MissionType**.
A MissionType is a bookable, reusable service template that agents execute.

## Related Code Files
- **Create:** `src/core/mission_types.py`
- **Create:** `tests/test_mission_types.py`
- **Modify:** `src/main.py` — add `mission` CLI group

## Architecture

```
MissionType (dataclass)
  id, name, slug, duration_minutes
  description, agent_pool: List[str]
  mode: Literal["personal", "collective", "round-robin"]
  pricing: float = 0.0
  verification_criteria: List[str]

MissionTypeRegistry
  _store: Dict[str, MissionType]          # slug → MissionType
  register(mt) → MissionType
  get(slug) → Optional[MissionType]
  list() → List[MissionType]
  delete(slug) → bool
  _persist() / _load()                    # .mekong/mission_types.yaml
```

## Implementation Steps

1. Create `src/core/mission_types.py`:
   - `MissionMode` Literal type
   - `MissionType` dataclass with all fields + `__post_init__` slug validation
   - `MissionTypeRegistry` with YAML persistence to `.mekong/mission_types.yaml`
   - `get_registry()` singleton factory

2. Add CLI group to `src/main.py`:
   ```python
   @app.command("mission")
   # sub-commands: list, create, show, delete
   # list → rich Table (id, name, mode, duration, price)
   # create → interactive prompts via typer.prompt()
   # show <slug> → rich Panel with all fields
   ```

3. Create `tests/test_mission_types.py`:
   - test register, get, list, delete
   - test slug validation (kebab-case enforcement)
   - test YAML persistence round-trip
   - test round-robin mode field

## CLI Interface
```bash
mekong mission list
mekong mission create --name "Code Review" --duration 30 --mode round-robin
mekong mission show code-review
mekong mission delete code-review
```

## Success Criteria
- [ ] `MissionTypeRegistry` CRUD operations pass tests
- [ ] YAML persistence round-trip verified
- [ ] `mekong mission list` renders rich table
- [ ] All 3 modes (personal/collective/round-robin) accepted

## Notes
- Reuse `MekongError` from `src/core/exceptions.py`
- No DB — flat YAML file only (KISS)
- `agent_pool` is list of agent names from `AGENT_REGISTRY`
