# Phase 1: Analysis & High-Priority Targets

**Context Links**
- [Master Plan](./plan.md)
- [Baseline Violations Report](../reports/planner-260120-1551-10x-refactor-violations.txt)

## Overview
- **Priority**: P1
- **Status**: In Progress
- **Description**: Deep dive into the top 10 violations and architectural debt to ensure the refactor doesn't break core systems.

## Key Insights
- `core/security/env_manager.py` is the largest file (584 LOC) and contains both logic for variable definition, validation, and secret generation.
- Circular dependency risks are highest in `core/agents` and `backend/agents` due to complex persona interactions.
- Many `core/hr` and `core/finance` modules share similar logic that can be extracted into shared utilities.

## Requirements
- Identify logical split points for all files > 300 LOC.
- Map internal imports for top 20 violations.
- Define a "Standard Module Structure" for refactored files.

## Related Code Files
- `core/security/env_manager.py`
- `core/security/validate_phase2_fixes.py`
- `core/repositories/client_portal_repository.py`
- `core/repositories/analytics_repository.py`
- `core/hr/career_development.py`
- `core/finance/investor_relations.py`

## Implementation Steps
1. [ ] **Splitting Strategy Research**: Create a report on how to split `env_manager.py` into `definitions.py`, `validator.py`, and `generator.py`.
2. [ ] **Dependency Mapping**: Run an import analysis script to detect circular references in `core/`.
3. [ ] **Common Logic Extraction**: Identify repeated code in `core/hr` and `core/finance` for a `core/utils/shared` module.
4. [ ] **Phase 1 Validation**: Ensure all split targets have a clear destination and parent module.

## Todo List
- [ ] Create `reports/planner-260120-1551-env-manager-split.md`
- [ ] Run dependency check script
- [ ] Document "Standard Module Structure" in `docs/code-standards.md`

## Success Criteria
- Clear, actionable splitting path for top 10 violations.
- No circular dependencies identified (or all mapped for fixing).
- 100% of top 20 files have a mapped refactor target.
