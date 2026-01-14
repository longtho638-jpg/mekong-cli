---
description: 🤖 Jules Workflow - Auto Tech Debt Cleanup
---

# Jules Auto Tech Debt Cleanup

## Prerequisites

1. **Jules Account**: Sign up at [jules.google.com](https://jules.google.com)
2. **Connect GitHub**: Link your `mekong-cli` repository
3. **Gemini CLI**: Already installed ✅

// turbo
## Quick Start

```bash
# 1. Start Gemini CLI
gemini

# 2. Run Jules tasks
/jules add unit tests for antigravity/core/

# 3. Check status
/jules what is the status of my tasks?
```

## Weekly Tech Debt Cleanup Tasks

### Monday: Unit Tests
```bash
/jules add comprehensive unit tests for all new files added this week in antigravity/core/
```

### Wednesday: Linting & Types
```bash
/jules fix all TypeScript any types in packages/
/jules fix all Python type hints in antigravity/core/
```

### Friday: Documentation
```bash
/jules add docstrings to all Python functions missing documentation
/jules update README files for any changed modules
```

## Monthly Tasks

### Dependencies
```bash
/jules update all npm dependencies to latest stable versions
/jules update all pip dependencies with security patches
```

### Security
```bash
/jules fix all security vulnerabilities from npm audit
/jules scan and fix any hardcoded credentials or secrets
```

## Auto-Schedule (Cron-style)

```bash
# Option 1: Manual reminder (use calendar)
# Set weekly reminders to run Jules tasks

# Option 2: GitHub Actions (recommended)
# Create .github/workflows/jules-cleanup.yml
```

## Monitoring

```bash
# Check all active tasks
/jules list my active tasks

# Check specific task
/jules what is the status of task XYZ?

# Cancel task
/jules cancel task XYZ
```

## Best Practices

1. **Small batches**: Don't ask Jules to fix entire codebase at once
2. **Review PRs**: Always review Jules PRs before merging
3. **Test first**: Run tests after Jules changes
4. **Document**: Keep track of what Jules changed

---

🤖 **Jules = Your async code janitor!**
