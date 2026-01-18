---
description: Create git worktrees for all open PRs or specific branch
---

// turbo

# /create-worktrees - Git Worktree Manager

Create worktrees for parallel development on multiple branches.

## Usage

```
/create-worktrees [branch]
/create-worktrees --all-prs
```

## Claude Prompt Template

```
Git worktree workflow:

If --all-prs:
1. List all open PRs: gh pr list --json number,headRefName
2. For each PR, create worktree:
   git worktree add ../worktrees/{branch} {branch}
3. Clean up stale worktrees

If specific branch:
1. Create worktree: git worktree add ../worktrees/{branch} {branch}
2. Report location

Handle branches with slashes by replacing with dashes in folder name.
```

## Example Output

```
✅ Created worktrees:
   - ../worktrees/feature-auth (from feature/auth)
   - ../worktrees/fix-login (from fix/login)

📁 Total: 2 worktrees active
```
