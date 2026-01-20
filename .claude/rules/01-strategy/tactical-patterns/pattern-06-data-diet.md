# Tactical Pattern 06: Data Diet Discipline

> **Security by Exclusion**

## Context
Handling any data, logs, or git commits.

## Pattern
1. **Filter**: Before logging, grep for `key`, `pass`, `secret`.
2. **Ignore**: Add `.env`, `*.pem`, `*.key` to `.gitignore` globally.
3. **Ask**: If a file is blocked by privacy hook, ask explicitly with `AskUserQuestion`.
4. **Never Assume**: Treat all unknown files as potentially sensitive.

## Goal
Zero leaks, zero trust.
