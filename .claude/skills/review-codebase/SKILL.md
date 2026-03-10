---
name: review-codebase
description: Parallel codebase review - lint, security, quality, tests
---

# Review Codebase Skill

Perform a comprehensive parallel codebase review:

## Step 1: Lint & TypeScript
- Run linters and type checker
- Fix all errors and warnings

## Step 2: Security Audit
- Check for exposed secrets, unsafe patterns
- Verify XSS/CSRF protection
- Check dependency vulnerabilities

## Step 3: Code Quality
- Identify dead code, unused imports
- Find duplicated logic
- Review error handling patterns

## Step 4: Test Coverage
- Check test coverage gaps
- Suggest missing tests
- Fix broken tests

## Step 5: Output
Provide prioritized findings with severity (CRITICAL/HIGH/MEDIUM/LOW).
Fix all CRITICAL and HIGH issues immediately.
