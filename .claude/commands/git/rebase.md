---
description: Interactive rebase helper with commit squashing
---

// turbo

# /rebase - Interactive Rebase

Guided interactive rebase with smart commit squashing.

## Usage

```
/rebase [target-branch]
/rebase --squash
/rebase --onto main
```

## Claude Prompt Template

```
Interactive rebase workflow:

1. Count commits since target: git rev-list --count HEAD ^{target}
2. Show commit list: git log --oneline {target}..HEAD
3. Analyze commits for squash opportunities:
   - Multiple "fix" commits → squash
   - WIP commits → squash
   - Related commits → combine
4. Create rebase plan:
   pick a1b2c3d feat: main feature
   squash d4e5f6a fix: typo
   squash g7h8i9j fix: linting
5. Execute: git rebase -i {target}
6. Handle conflicts if any
7. Force push if needed: git push --force-with-lease

Report final commit structure.
```

## Example Output

```
♻️ Rebase onto main

Before: 5 commits
After:  2 commits (squashed 3 fix commits)

New structure:
- a1b2c3d feat: add authentication
- b2c3d4e docs: update README

✅ Rebased successfully
⚠️ Run: git push --force-with-lease
```
