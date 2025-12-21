---
description: Create isolated git worktree for parallel development
argument-hint: [feature-description] OR [project] [feature] (monorepo)
---

Create an isolated git worktree for parallel feature development.

## Workflow

### Step 1: Get Repository Info

```bash
node .claude/scripts/worktree.cjs info --json
```

Returns: `repoType`, `baseBranch`, `projects` (if monorepo), `envFiles`, `dirtyState`

### Step 2: Gather Information via AskUserQuestion

**For MONOREPO (repoType === 'monorepo'):**
1. If multiple projects match user input → Ask which project
2. Ask feature description
3. Ask branch type (feat/fix/refactor/docs/test/chore/perf)
4. Show found `.env*` files → Ask which to copy

**For STANDALONE:**
1. Ask feature description
2. Ask branch type
3. Show found `.env*` files → Ask which to copy

### Step 3: Convert Description to Slug

Convert feature description to kebab-case:
- "add authentication system" → `add-auth`
- "fix payment bug" → `payment-bug`

### Step 4: Create Worktree

```bash
node .claude/scripts/worktree.cjs create "<SLUG>" "<PROJECT>" --prefix <TYPE> --env "<FILES>"
```

Arguments:
- `<SLUG>` - Kebab-case feature name (required)
- `<PROJECT>` - Project name for monorepo (optional for standalone)
- `--prefix` - Branch type: feat|fix|refactor|docs|test|chore|perf
- `--env` - Comma-separated .env files to copy
- `--json` - Output JSON for parsing

### Error Handling

Script returns structured errors with codes:
- `NOT_GIT_REPO` - Not in a git repository
- `GIT_VERSION_ERROR` - Git too old (needs 2.5+)
- `MISSING_FEATURE` - No feature name provided
- `MISSING_PROJECT` - Monorepo requires project name
- `PROJECT_NOT_FOUND` - Project not in .gitmodules
- `MULTIPLE_PROJECTS_MATCH` - Ambiguous project, use AskUserQuestion
- `BRANCH_CHECKED_OUT` - Branch already in use
- `WORKTREE_EXISTS` - Worktree path already exists
- `WORKTREE_CREATE_FAILED` - Git worktree command failed

## Branch Naming

Format: `[prefix]/[feature-slug]`

Examples:
- `feat/add-auth`
- `fix/payment-bug`
- `refactor/database-layer`

## Example Session

```
User: /worktree add user authentication

Claude: [Runs info --json, detects standalone repo]
Claude: [Uses AskUserQuestion for branch type]
User: feat

Claude: [Uses AskUserQuestion for env files: .env, .env.local, .env.example]
User: .env.example

Claude: [Runs create command]
node .claude/scripts/worktree.cjs create "add-user-auth" --prefix feat --env ".env.example"
```
