---
description: Refactor file for better readability and performance
---

// turbo

# /refactor - Code Refactorer

Refactor code for better readability and performance.

## Usage

```
/refactor [file]
/refactor --dry-run
```

## Claude Prompt Template

```
Refactoring workflow:

1. Analyze File:
   - Identify code smells
   - Find long functions (>20 lines)
   - Detect duplication
   - Check complexity

2. Plan Refactoring:
   - Extract methods
   - Rename unclear variables
   - Simplify conditionals
   - Remove dead code

3. Apply Changes:
   - Make incremental changes
   - Run tests after each change
   - Maintain git commits

4. Verify:
   - All tests pass
   - No behavior change
   - Improved metrics

Report before/after metrics.
```

## Example Output

```
♻️ Refactor: src/handlers.ts

Before:
- Lines: 450
- Complexity: 28
- Functions: 8

Changes Applied:
1. ✅ Extracted validateInput() (15 lines)
2. ✅ Simplified processData() conditionals
3. ✅ Renamed 'x' to 'userCount'
4. ✅ Removed 12 unused imports

After:
- Lines: 380 (-15%)
- Complexity: 12 (-57%)
- Functions: 12

✅ All tests still pass!
```
