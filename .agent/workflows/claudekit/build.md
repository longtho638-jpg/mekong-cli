---
description: description: Build feature - code generation, tests, CI, and deploy in one comma
---

# Claudekit Command: /build

> Imported from claudekit-engineer

# /build - Full-Stack Feature Builder

## 🤖 Quick Execute

```bash
# Build a complete feature end-to-end
/build <feature-description>
```

## ⚡ Execution Steps

// turbo-all

### Step 1: Understand Requirements (2 min)

```bash
# Parse the feature request
# Identify affected files and components
# Create a mini implementation plan
```

### Step 2: Generate Code (5-10 min)

```bash
# Create/modify source files
# Follow project conventions:
# - TypeScript strict mode
# - Vietnamese UI text
# - @agencyos/ui components
# - 200-line file limit
```

### Step 3: Run Type Check (1 min)

```bash
pnpm turbo typecheck
```

### Step 4: Run Tests (2 min)

```bash
pnpm turbo test
# or
pytest tests/ -v
```

### Step 5: Build Verification (2 min)

```bash
pnpm turbo build
```

### Step 6: Report Completion

```bash
# Summarize what was created/modified
# List any warnings or follow-up tasks
```

## 📋 Examples

```bash
# Build a new dashboard page
/build Add analytics dashboard with charts at /dashboard/analytics

# Build an API endpoint
/build Create REST endpoint for user preferences at /api/preferences

# Build a component
/build Create reusable DateRangePicker component with Vietnamese locale
```

## ✅ Success Criteria

- [ ] Code generated with no TypeScript errors
- [ ] Tests pass (if applicable)
- [ ] Build succeeds
- [ ] Feature matches description

## 🔗 Related Commands

- `/test` - Run test suite
- `/ship` - Commit and push
- `/cook` - Development mode with hot reload
