---
description: Analyze and fix a GitHub issue with structured approach
---

// turbo

# /fix-issue - GitHub Issue Fixer

Analyze a GitHub issue and implement the fix.

## Usage

```
/fix-issue [issue-number]
```

## Claude Prompt Template

```
Fix GitHub issue workflow:

1. Fetch issue details: gh issue view {number} --json title,body,labels
2. Analyze the issue:
   - Identify root cause
   - Determine affected files
   - Plan implementation
3. Create fix branch: git checkout -b fix/issue-{number}
4. Implement the fix
5. Write tests for the fix
6. Run test suite to verify
7. Create commit: git commit -m "🐛 fix: #{number} {title}"

Report:
- Issue summary
- Changes made
- Files modified
- Test results
```

## Example Output

```
📋 Issue #42: Login button not responsive

🔍 Root cause: Missing onClick handler

📝 Changes:
   - src/components/Login.tsx: Added handler
   - tests/Login.test.tsx: Added test

✅ Tests: 15/15 passed
✅ Committed: fix/issue-42
```
