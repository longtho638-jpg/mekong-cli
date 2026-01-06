---
description: How to refactor code using AgencyOS agentic workflow
---

# Refactoring Code

Refactor code safely with automated code review and testing.

## Quick Commands
```bash
# Automated code review
/review

# Plan refactoring
/plan "refactor user validation logic"

# Execute refactoring
/cook "extract password validation into separate function"
```

## Step-by-Step Workflow

### Step 1: Identify Refactoring Needs
// turbo
```bash
/review
```

Review output includes:
- Duplicate code instances
- Large functions
- Complex conditionals
- Magic numbers
- Missing error handling
- Technical Debt Score
- Maintainability Index

### Step 2: Prioritize Refactoring Tasks
// turbo
```bash
/plan "refactor user validation logic to eliminate duplication"
```

Plan includes:
- Current state analysis
- Proposed solution
- Testing strategy
- Risk assessment
- Success criteria

### Step 3: Add Tests (If Missing)
// turbo
```bash
/plan "add tests for validation logic before refactoring"
/code
```

### Step 4: Implement Refactoring
// turbo
```bash
/cook "implement refactoring from the plan"
```

### Step 5: Verify Functionality
// turbo
```bash
npm test
/fix:test
```

### Step 6: Review and Document
// turbo
```bash
/code-review "refactoring changes"
/docs:update
```

### Step 7: Commit Refactoring
// turbo
```bash
/git:cm
```

## Common Refactoring Patterns

### 1. Extract Method
// turbo
```bash
/cook "extract password validation into separate function"
```

### 2. Extract Class
// turbo
```bash
/cook "extract payment processing into PaymentService class"
```

### 3. Rename
// turbo
```bash
/cook "rename all instances of 'data' variable to descriptive names"
```

### 4. Introduce Parameter Object
// turbo
```bash
/cook "replace multiple parameters with configuration object"
```

### 5. Replace Conditional with Polymorphism
// turbo
```bash
/cook "replace user type conditionals with strategy pattern"
```

### 6. Move Method
// turbo
```bash
/cook "move authentication logic from controller to service layer"
```

## Variations

### Performance Refactoring
```bash
/cook "optimize database queries in user service"
```

### Security Refactoring
```bash
/cook "replace hardcoded secrets with environment variables"
```

### Modernize Code
```bash
/cook "migrate callback functions to async/await"
```

### Simplify Architecture
```bash
/cook "consolidate similar services into unified module"
```

## Best Practices
1. **Test before and after** - Ensure no behavior changes
2. **Small, incremental changes** - Easier to review and revert
3. **Maintain functionality** - Refactoring ≠ new features
4. **Update tests alongside code** - Keep tests in sync
5. **Document architectural changes** - Explain WHY

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests fail after refactoring | `npm test` to find breaking changes |
| Unclear what to refactor | Run `/review` for analysis |
| Breaking API compatibility | Add deprecation warnings first |

## 🏯 Binh Pháp Alignment
"軍形篇" (Military Disposition) - Organize forces before battle.
