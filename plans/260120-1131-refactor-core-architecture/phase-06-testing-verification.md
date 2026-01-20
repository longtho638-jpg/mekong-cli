# Phase 6: Testing & Verification (P0 - Required)

> **Priority:** P0 - REQUIRED
> **Status:** pending
> **Effort:** 2h

## Overview

Comprehensive testing phase to ensure all refactoring maintains behavior and quality.

## Requirements

### Functional
- 100% of existing tests pass
- No regressions in functionality

### Non-Functional
- Type coverage > 90%
- All files <= 200 lines verified

## Test Categories

### 1. Unit Tests
```bash
# Run all unit tests
pytest tests/ -v --tb=short

# Run with coverage
pytest tests/ --cov=antigravity --cov=cli --cov-report=html
```

### 2. Type Checking
```bash
# Full type check
mypy antigravity/ cli/ --ignore-missing-imports

# Strict mode on core modules
mypy antigravity/core --strict --ignore-missing-imports
```

### 3. Line Count Verification
```bash
# Check all Python files
find antigravity cli -name "*.py" -exec wc -l {} \; | sort -rn | head -20

# Fail if any file > 200 lines
find antigravity cli -name "*.py" -exec sh -c 'if [ $(wc -l < "$1") -gt 200 ]; then echo "FAIL: $1 has $(wc -l < "$1") lines"; exit 1; fi' _ {} \;
```

### 4. Import Verification
```bash
# Check for circular imports
python -c "import antigravity"
python -c "import cli"

# Check all modules import cleanly
python -c "from antigravity.core import *"
```

### 5. Integration Tests
```bash
# Run integration tests
pytest tests/integration/ -v
```

## Verification Checklist

### After Each Phase
- [ ] `pytest tests/` passes
- [ ] No new files > 200 lines
- [ ] All imports work

### After All Phases
- [ ] Full test suite passes
- [ ] mypy passes
- [ ] Manual CLI verification
- [ ] Line count verification

## Test Files to Run

```bash
# Core tests
pytest tests/test_opentelemetry.py -v      # Phase 1
pytest tests/test_revenue_engine.py -v     # Phase 2
pytest tests/test_moat_engine.py -v        # Phase 2
pytest tests/test_code_guardian.py -v      # Phase 2
pytest tests/test_agent_swarm.py -v        # Phase 2
pytest tests/test_algorithm_core.py -v     # Phase 2

# Integration tests
pytest tests/integration/ -v                # All phases

# CLI tests
pytest tests/test_cli_refactor.py -v       # Phase 5
```

## Quality Gates

| Gate | Requirement | Command |
|------|-------------|---------|
| Tests | 100% pass | `pytest tests/` |
| Types | No errors | `mypy antigravity/` |
| Lines | All <= 200 | `wc -l` check |
| Imports | No errors | `python -c "import ..."` |

## Todo List

- [ ] Run pytest after Phase 1
- [ ] Run pytest after Phase 2
- [ ] Run mypy after Phase 3
- [ ] Run pytest after Phase 4
- [ ] Run pytest after Phase 5
- [ ] Full verification suite
- [ ] Manual CLI testing
- [ ] Generate coverage report

## Success Criteria

- [ ] 100% test pass rate
- [ ] Zero mypy errors
- [ ] Zero files > 200 lines
- [ ] All CLI commands functional

## Reports

Generate final report:
```bash
# Generate coverage report
pytest tests/ --cov=antigravity --cov=cli --cov-report=html --cov-report=term

# Save to reports directory
mv htmlcov plans/260120-1131-refactor-core-architecture/reports/coverage/
```

## Next Steps

After Phase 6:
- Proceed to Phase 7 (Documentation & Delivery)
