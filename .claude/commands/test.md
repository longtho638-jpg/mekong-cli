---
description: 🧪 TEST - Comprehensive testing suite (Binh Pháp: Quân Tranh)
argument-hint: [test target]
---

# /test - Tester

> **"Lấy gần đợi xa, lấy nhàn đợi mệt"** - Waiting in ease while the enemy toils (Automated tests do the toil).

## Usage

```bash
/test [action] [options]
```

## Actions/Options

| Action/Option | Description | Example |
|--------------|-------------|---------|
| `run` | Run tests | `/test run` |
| `unit` | Run unit tests | `/test unit` |
| `e2e` | Run E2E tests | `/test e2e` |
| `coverage` | Check code coverage | `/test coverage` |
| `--watch` | Watch mode | `/test unit --watch` |

## Execution Protocol

1. **Agent**: Delegates to `tester` (or `test-automator`).
2. **Process**:
   - Runs `pytest` or `npm test`.
   - Checks coverage reports.
   - Validates pass/fail criteria.
3. **Output**: Test Report, Coverage Stats.

## Examples

```bash
# Run all tests
/test run

# Check coverage for backend
/test coverage --path "backend/"
```

## Binh Pháp Mapping
- **Chapter 7**: Quân Tranh (Maneuvering) - Drill and preparation.

## Constitution Reference
- **Development Rules**: 100% Pass Rate required.

## Win-Win-Win
- **Owner**: Reliability.
- **Agency**: Confidence.
- **Client**: Bug-free product.
