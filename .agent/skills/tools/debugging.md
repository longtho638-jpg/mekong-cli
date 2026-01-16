---
name: debugging
description: Systematic debugging and troubleshooting skill. Use for diagnosing and fixing runtime errors, build failures, and performance issues.
tools: Read, Write, Edit, Bash, Grep
---

# 🐛 Debugging Skill

Systematic approach to finding and fixing bugs.

## When to Use

- Runtime errors and exceptions
- Build failures
- Performance issues
- Mysterious behaviors

## Methodology

1. **Reproduce** - Consistent steps to trigger
2. **Isolate** - Narrow the scope
3. **Diagnose** - Find root cause
4. **Fix** - Minimal targeted change
5. **Verify** - Confirm resolution

## Common Issues

| Category | Approach |
|----------|----------|
| Build Errors | Check deps, tsconfig, imports |
| Runtime | Stack traces, console logs |
| Performance | Profiling, N+1 queries |
| Hydration | SSR/client mismatch |

## Debug Commands

```bash
# TypeScript errors
npx tsc --noEmit

# Lint issues
npx eslint . --quiet

# Build test
npm run build

# Runtime logs
NODE_OPTIONS='--inspect' npm run dev
```

## Example Prompts

```
"Use debugging to fix this TypeScript error"
"Use debugging to diagnose slow API response"
"Use debugging to resolve hydration mismatch"
```
