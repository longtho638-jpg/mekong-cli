---
description: How to debug and fix bugs using AgencyOS agentic workflow
---

# Bug Fixing Workflow

Debug and fix bugs with agentic assistance in 5 phases.

## Quick Start
```bash
# Quick fix
/debug "issue description" /fix:hard "solution"
```

## Overview
| Phase | Command | Time |
|-------|---------|------|
| Investigation | `/debug` | 3 min |
| Deep Analysis | `/debug` | 5 min |
| Fix Implementation | `/fix:hard` | 10 min |
| Testing | `/fix:test` | 5 min |
| Deployment | `/fix:ci /git:cm` | 3 min |

## Step-by-Step Guide

### 1. Initial Investigation
// turbo
```bash
/debug "login button not working in production"
```

What happens:
- Debugger Agent investigates the issue
- Collects logs, error messages, stack traces
- Identifies affected components

Output: Investigation report with root cause hypothesis

### 2. Deep Analysis
// turbo
```bash
/debug "analyze authentication flow for session issues"
```

What happens:
- Deep code analysis
- Database consistency check
- Security vulnerability check

Output: Root cause identification with code locations

### 3. Fix Implementation
// turbo
```bash
/fix:hard "session timeout causing login issues"
```

What happens:
- Implements the fix
- Code review for quality
- Security validation

Fix types: Code logic, config updates, database migrations, security patches

### 4. Comprehensive Testing
// turbo
```bash
/fix:test
```

What happens:
- Regression tests for fixed code
- Integration tests for affected flows
- Performance benchmarks

### 5. Validation & Deployment
// turbo
```bash
/fix:ci "validate fix doesn't break production" /git:cm
```

What happens:
- Validates fix in staging
- Ensures CI pipeline passes
- Commits with proper format

## Specialized Commands

### CI/CD Issues
// turbo
```bash
/fix:ci "failing GitHub Actions for test suite"
```

### Type Errors
// turbo
```bash
/fix:types "TypeScript errors in user service"
```

### Performance Issues
// turbo
```bash
/debug "slow API response times" /fix "implement query optimization"
```

### Security Issues
// turbo
```bash
/debug "XSS vulnerability" /fix:hard "sanitize input and implement CSP"
```

## Best Practices

### Before Starting
- [ ] Reproduce the issue
- [ ] Check recent changes
- [ ] Review error logs

### During Investigation
- [ ] Don't assume root cause
- [ ] Check data consistency
- [ ] Verify environment differences

### After Deployment
- [ ] Monitor for regressions
- [ ] Update documentation
- [ ] Share learnings

## 🏯 Binh Pháp Alignment
"虛實篇" (Weak Points and Strong) - Find the root cause, not just symptoms.
