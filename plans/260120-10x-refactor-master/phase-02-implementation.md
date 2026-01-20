# Phase 2: Core Refactoring

**Context Links**
- [Master Plan](./plan.md)
- [High-Priority Mapping](../reports/planner-260120-1551-high-priority-mapping.md)
- [Env Manager Split](../reports/planner-260120-1551-env-manager-split.md)
- [Validate Fixes Split](../reports/planner-260120-1551-validate-fixes-split.md)

## Overview
- **Priority**: P1
- **Status**: Pending
- **Description**: Systematic modularization of high-priority targets identified in Phase 1. Focusing on Security, Finance, HR, and Ops.

## Key Insights
- Extraction of shared utilities (`vibe_ui.py`, `naming.py`) is a prerequisite for cleaning up HR and Finance modules.
- Security modules must be refactored first to ensure environment stability during subsequent changes.

## Requirements
- All new files MUST be < 200 LOC.
- Strict adherence to `kebab-case` for file names and `snake_case` for Python functions/variables.
- Maintain full functional parity with legacy code.

## Architecture
- **Layered Approach**: Split logic into `models`, `services`, `repositories`, and `utils`.
- **Coordinator Pattern**: Large classes become coordinators delegating to smaller, specialized components.

## Related Code Files
- `core/security/*`
- `core/hr/*`
- `core/finance/*`
- `core/ops/*`
- `core/utils/*`

## Implementation Steps

### 1. Infrastructure Preparation
- [ ] Create `core/utils/vibe_ui.py` with box-drawing and progress bar helpers.
- [ ] Create `core/utils/naming.py` for ID generation logic.

### 2. Security Module Refactor
- [ ] Implement `core/security/env/` sub-package split (Definitions, Validator, Generator).
- [ ] Implement `core/security/validation/` sub-package split for `validate_phase2_fixes.py`.
- [ ] Modularize `auth_middleware.py`.

### 3. Business Logic Refactor (HR & Finance)
- [ ] Refactor `investor_relations.py`: Move models to `core/finance/models/investor.py`.
- [ ] Refactor `career_development.py`: Move models to `core/hr/models/career.py`.
- [ ] Apply `vibe_ui` to all `format_dashboard` methods.

### 4. Ops & Core Refactor
- [ ] Split `core/ops/network.py` into specialized monitors.
- [ ] Modularize `core/memory/memory.py` (Short-term vs Long-term separation).

## Success Criteria
- 0 files in `core/` exceed 250 LOC (Target < 200).
- All modules successfully import their new dependencies.
- Codebase remains "Green" (Passes basic smoke tests).
