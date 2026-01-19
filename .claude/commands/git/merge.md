---
description: Safe merge with conflict detection and resolution
---

// turbo

# /merge - Safe Merge

Merge branches with automatic conflict detection and resolution helpers.

## Usage

```
/merge [source-branch]
/merge --from main
```

## Claude Prompt Template

```
Safe merge workflow:

1. Fetch latest: git fetch origin
2. Check for conflicts: git merge --no-commit --no-ff {source}
3. If conflicts:
   - List conflicting files
   - For each file, analyze conflict markers
   - Suggest resolution strategy
   - Offer to auto-resolve if possible
4. If no conflicts:
   - Complete merge: git merge {source} -m "🔀 merge: {source} into {current}"
5. Run tests to verify
6. Report status

Abort if tests fail: git merge --abort
```

## Example Output

```
🔀 Merging: main → feature/auth

⚠️ Conflicts detected: 2 files
   1. src/auth.ts - BOTH modified
   2. package.json - version conflict

🔧 Auto-resolved: package.json (took ours)
📝 Manual needed: src/auth.ts

Run /fix-conflicts to continue.
```
