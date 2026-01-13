---
title: /test
description: Run tests locally and analyze the summary report
section: docs
category: commands/core
order: 22
published: true
ai_executable: true
---

# /test

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/commands/core/test
```



Run tests locally and analyze the summary report.

## Syntax

```bash
/test
```

## How It Works

Uses `tester` subagent to:
1. Run the test suite
2. Analyze results
3. Report summary

**Important**: Does not implement fixes - only reports test status.

## Agents Orchestrated

| Agent | Purpose |
|-------|---------|
| [tester](/docs/agents/tester) | Execute test suite, analyze coverage, report results |
| [debugger](/docs/agents/debugger) | Automatically invoked if tests fail for diagnosis |

## Example Output

```
Test Results:
✓ 45 tests passed
✗ 3 tests failed
  - auth/login.test.js: Expected 200, got 401
  - api/users.test.js: Timeout error
  - db/migrations.test.js: Connection refused

Coverage: 78%
```

## Related Commands

| Command | Use Case |
|---------|----------|
| `/fix:test` | Fix failing tests |
| `/cook` | Implement with auto-testing |
| `/code` | Implement plan with testing |

---

**Key Takeaway**: Use `/test` to run the test suite and get a summary report without implementing fixes.
