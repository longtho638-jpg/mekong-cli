---
name: check-and-commit
description: Run quality checks then commit and push changes
---

# Check and Commit Skill

Run all quality checks and if passing, commit and push:

1. **Lint Check**: Run linter, fix any errors
2. **Type Check**: Run TypeScript compiler (if applicable)
3. **Test Suite**: Run tests, fix failures
4. **Git Status**: Review changed files
5. **Commit**: `git add -A && git commit -m "fix: [describe changes]"`
6. **Push**: `git push`

If any check fails, fix the issue first before committing.
