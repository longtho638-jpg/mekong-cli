---
description: 📦 GIT - Advanced Git operations and workflow management (Binh Pháp: Hành Quân)
argument-hint: [git task]
---

# /git - Git Manager

> **"Lệnh dân như lệnh lửa"** - Orders should be as strict as fire (Version Control Discipline).

## Usage

```bash
/git [action] [options]
```

## Actions/Options

| Action/Option | Description | Example |
|--------------|-------------|---------|
| `status` | Enhanced status check | `/git status` |
| `sync` | Sync with remote (smart pull/rebase) | `/git sync` |
| `clean` | Clean up branches/stale artifacts | `/git clean` |
| `feature` | Start a new feature branch | `/git feature "new-login"` |

## Execution Protocol

1. **Agent**: Delegates to `git-manager`.
2. **Process**:
   - Validates git state.
   - Performs operations safely (backup if needed).
   - Updates `docs/project-changelog.md` if applicable.
3. **Output**: Git command execution results.

## Examples

```bash
# Start a new feature
/git feature "payment-integration-v2"

# Smart sync
/git sync
```

## Binh Pháp Mapping
- **Chapter 9**: Hành Quân (Maneuvering) - Movement of code.

## Constitution Reference
- **Development Rules**: Conventional Commits.

## Win-Win-Win
- **Owner**: Code history integrity.
- **Agency**: Collaboration efficiency.
- **Client**: Transparency.
