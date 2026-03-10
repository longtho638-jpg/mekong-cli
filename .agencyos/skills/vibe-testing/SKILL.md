---
name: vibe-testing
description: Use when writing tests for VIBE projects with 100% pass gate and real data requirements.
license: MIT
---

# VIBE Testing Standards

Testing guidelines for AntigravityKit projects with strict quality gates.

## When to Use

Use this skill when:
- Writing unit tests
- Writing integration tests
- Running test suites
- Debugging test failures

## Core Rules

### 100% Pass Gate

Tests must pass 100% before proceeding to code review.

### No Cheating

**FORBIDDEN:**
- Commenting out tests
- Changing assertions to pass
- TODO/FIXME to defer fixes
- Fake data in integration tests
- Mocks for core business logic

### Allowed Mocks

Unit tests MAY use mocks for:
- External APIs
- Database connections
- Third-party services
- File system operations

## Test Types

| Type | Purpose | Mocks Allowed |
|------|---------|---------------|
| Unit | Test single functions | Yes |
| Integration | Test component interactions | Limited |
| E2E | Test full user flows | No |

## Test Structure

```python
def test_feature_description():
    """
    Test that [feature] does [expected behavior].
    
    Given: [setup conditions]
    When: [action taken]
    Then: [expected result]
    """
    # Arrange
    input_data = create_test_data()
    
    # Act
    result = feature_under_test(input_data)
    
    # Assert
    assert result.success is True
    assert result.value == expected_value
```

## Coverage Requirements

| Type | Minimum |
|------|---------|
| Happy path | 100% |
| Edge cases | 80% |
| Error scenarios | 80% |
| Overall | 80% |

## Running Tests

```bash
# Python projects
python -m pytest -v

# With coverage
python -m pytest --cov=antigravity --cov-report=html

# Specific test file
python -m pytest tests/test_feature.py -v
```

## Debugging Failures

1. Read the error message carefully
2. Check the test setup (Arrange phase)
3. Verify the action (Act phase)
4. Review the assertion (Assert phase)
5. Use `debugger` subagent if stuck

## Agent Workflow

1. Run `tester` subagent
2. If failures, run `debugger` subagent
3. Fix issues
4. Re-run `tester`
5. Repeat until 100% pass

---

🧪 **"Test trước, code sau"** - Test first, code later
