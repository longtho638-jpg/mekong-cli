# Phase 3: Testing & QA

**Context Links**
- [Master Plan](./plan.md)
- [Development Rules](../../.claude/rules/development-rules.md)

## Overview
- **Priority**: P1
- **Status**: Pending
- **Description**: Ensuring 100% test coverage and functional parity for all refactored modules. Validation of performance and architectural integrity.

## Key Insights
- Refactoring core security and finance modules requires high-fidelity tests to prevent revenue or data loss.
- Using the `tester` agent is mandatory for cross-validation.

## Requirements
- 100% pass rate for all existing unit tests.
- New unit tests for all newly created sub-modules.
- Integration tests for "Coordinator" classes.
- No "fake data" or "mocks" for core business logic per VIBE standards.

## Related Code Files
- All files modified in Phase 2.
- `tests/` directory.

## Implementation Steps

### 1. Test Suite Expansion
- [ ] Generate unit tests for `core/utils/vibe_ui.py` and `core/utils/naming.py`.
- [ ] Create tests for each sub-module in `core/security/env/`.
- [ ] Verify that coordinator classes properly handle exceptions from sub-modules.

### 2. Coverage Baseline
- [ ] Run `pytest --cov=core` to establish a new baseline.
- [ ] Identify and fill coverage gaps in refactored `hr` and `finance` modules.

### 3. Verification Gates
- [ ] Delegate to `tester` agent to perform a full system audit.
- [ ] Perform "Smoke Test" of the CLI: `python3 main.py --help` and basic outreach/finance commands.

## Success Criteria
- 100% unit test coverage for refactored code.
- Zero regressions in existing test suite.
- `Binh Pháp` validation: Functional parity confirmed for all 3 WINs.
