---
description: How to debug and fix bugs using AgencyOS agentic workflow
---

# Fixing Bugs

Debug and fix bugs with agentic assistance in 5 steps.

## Quick Commands
```bash
# Quick fix (simple bugs)
/fix:fast "users getting 401 error on login"

# Complex fix (investigation needed)
/fix:hard "memory leak in WebSocket connections"

# Type errors
/fix:types
```

## Step-by-Step Workflow

### Step 1: Reproduce the Bug
Document the issue first:
- What happens (actual behavior)
- What should happen (expected behavior)
- Steps to reproduce
- Error messages or logs

// turbo
```bash
# Test manually
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Expected: 200 OK with token
# Actual: 401 Unauthorized
```

### Step 2: Choose Debugging Approach

#### Option A: Quick Fix (/fix:fast)
For simple, isolated bugs:
// turbo
```bash
/fix:fast "users getting 401 error on login with valid credentials"
```

What happens:
1. Analyzes issue
2. Implements fix
3. Runs tests
4. Verifies fix

#### Option B: Complex Fix (/fix:hard)
For bugs requiring investigation:
// turbo
```bash
/fix:hard "memory leak in WebSocket connections causing server crashes"
```

What happens:
1. Investigation phase (root cause)
2. Creates fix plan
3. Implements fixes
4. Runs tests
5. Performance validation
6. Documentation updated

### Step 3: Verify the Fix
// turbo
```bash
npm test
npm run lint
```

### Step 4: Document the Fix
// turbo
```bash
/docs:update "fixed login authentication bug"
```

### Step 5: Commit the Fix
// turbo
```bash
/git:cm
```

## Common Variations

### Type Error Fix
// turbo
```bash
/fix:types
# Automatically fixes TypeScript errors
# Updates type definitions
# Runs type checker
```

### Performance Bug
// turbo
```bash
/fix:hard "API endpoint taking 8+ seconds to respond"
# Analyzes performance
# Identifies bottlenecks
# Implements optimization
```

### Security Bug
// turbo
```bash
/fix:fast "SQL injection vulnerability in search endpoint"
# Implements parameterized queries
# Adds input validation
# Runs security tests
```

### Integration Bug
// turbo
```bash
/fix:logs "Stripe webhook failing with 400 errors"
# Analyzes webhook logs
# Fixes verification logic
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't reproduce bug | Add more logging, check environment |
| Fix breaks other features | Run full test suite first |
| Root cause unclear | Use `/debug` for deeper analysis |
| Intermittent bug | Add monitoring and logging |

## Best Practices
1. **Always reproduce first** - Confirm the bug exists
2. **Add tests for bugs** - Prevent regressions
3. **Check for related issues** - Sometimes bugs are connected
4. **Document in changelog** - Track what was fixed
5. **Monitor after deployment** - Ensure fix works in production
6. **Root cause analysis** - Understand WHY it happened

## Time Comparison
| Approach | Time |
|----------|------|
| Traditional debugging | 2-4 hours |
| With AgencyOS | 15-30 min |

## 🏯 Binh Pháp Alignment
"虛實篇" (Weak Points and Strong) - Find the root cause, not just symptoms.
