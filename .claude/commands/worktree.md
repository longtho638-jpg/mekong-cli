---
description: Create isolated git worktree for parallel development
argument-hint: [feature-description] OR [project] [feature] (monorepo)
---

Create an isolated git worktree for parallel feature development.

## Workflow

### Step 1: Gather Repository Context

Run these commands to understand the full repo structure:

```bash
# Get current repo info
echo "=== GIT ROOT ===" && git rev-parse --show-toplevel
echo "=== SUPERPROJECT ===" && git rev-parse --show-superproject-working-tree 2>/dev/null || echo "none"
echo "=== GITMODULES ===" && cat .gitmodules 2>/dev/null | head -30 || echo "none"
echo "=== EXISTING WORKTREES ===" && ls -la "$(git rev-parse --show-toplevel)/../worktrees" 2>/dev/null || echo "none"
```

### Step 2: Determine Worktree Location (YOU DECIDE)

Based on gathered context, **you must decide** the worktree root directory.

**Decision Rules (in priority order):**

1. **Superproject detected?** → Use `<superproject>/worktrees/`
   - If superproject output is NOT "none", that's your target
   - This ensures all submodule worktrees go to the parent monorepo

2. **Has .gitmodules?** → Use `<git-root>/worktrees/`
   - This repo IS a monorepo, keep worktrees inside

3. **Standalone repo** → Use `<git-root>/../worktrees/`
   - Place worktrees as sibling directory

**Your decision should be an absolute path.**

### Step 3: Detect Branch Prefix

From user's description, detect the prefix:
- Keywords "fix", "bug", "error", "issue" → `fix`
- Keywords "refactor", "restructure", "rewrite" → `refactor`
- Keywords "docs", "documentation", "readme" → `docs`
- Keywords "test", "spec", "coverage" → `test`
- Keywords "chore", "cleanup", "deps" → `chore`
- Keywords "perf", "performance", "optimize" → `perf`
- Everything else → `feat`

### Step 4: Convert Description to Slug

- "add authentication system" → `add-auth`
- "fix login bug" → `login-bug`
- Remove filler words, kebab-case, max 50 chars

### Step 5: Handle Monorepo Projects

If `.gitmodules` exists, get project list:
```bash
node .claude/scripts/worktree.cjs info --json
```

**For MONOREPO:** Use AskUserQuestion if project not specified:
```javascript
AskUserQuestion({
  questions: [{
    header: "Project",
    question: "Which project should the worktree be created for?",
    options: projects.map(p => ({ label: p.name, description: p.path })),
    multiSelect: false
  }]
})
```

### Step 6: Execute with Your Decision

Pass your decided worktree root via `--worktree-root`:

**Monorepo:**
```bash
node .claude/scripts/worktree.cjs create "<PROJECT>" "<SLUG>" --prefix <TYPE> --worktree-root "<YOUR_DECIDED_PATH>"
```

**Standalone:**
```bash
node .claude/scripts/worktree.cjs create "<SLUG>" --prefix <TYPE> --worktree-root "<YOUR_DECIDED_PATH>"
```

**Options:**
- `--prefix` - Branch type: feat|fix|refactor|docs|test|chore|perf
- `--worktree-root` - **Your decided worktree directory (absolute path)**
- `--json` - Output JSON for parsing
- `--dry-run` - Preview without executing

### Step 7: Install Dependencies

Based on project context, run install in background:
```bash
# Examples - use your project context to determine
bun install          # bun.lock present
pnpm install         # pnpm-lock.yaml present
yarn install         # yarn.lock present
npm install          # package-lock.json or package.json
poetry install       # poetry.lock or pyproject.toml
pip install -r requirements.txt  # requirements.txt
cargo build          # Cargo.toml
go mod download      # go.mod
bundle install       # Gemfile
composer install     # composer.json
```

## Commands Reference

| Command | Usage | Description |
|---------|-------|-------------|
| `create` | `create [project] <feature> --worktree-root <path>` | Create new worktree |
| `remove` | `remove <name-or-path>` | Remove worktree and branch |
| `info` | `info` | Get repo info (shows default location) |
| `list` | `list` | List existing worktrees |

## Example Session

```
User: /worktree fix the login validation bug

Claude: [Runs context gathering commands]
        git root: /home/user/my-project
        superproject: /home/user/monorepo  <-- DETECTED!

        [DECISION: superproject exists, use /home/user/monorepo/worktrees/]

        [Detects prefix from "fix" keyword: fix]
        [Converts slug: "login-validation-bug"]

        [Runs: node .claude/scripts/worktree.cjs create "login-validation-bug" \
               --prefix fix --worktree-root "/home/user/monorepo/worktrees"]

Output: Worktree created at /home/user/monorepo/worktrees/my-project-login-validation-bug
        Source: --worktree-root flag
```

## Why You Decide

The script has fallback logic, but **you have broader context**:
- You can see the user's directory structure
- You know their habits from conversation history
- You can reason through edge cases the script can't anticipate

Always pass `--worktree-root` with your explicit decision for transparency.
