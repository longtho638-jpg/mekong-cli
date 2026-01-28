---
description: 🔀 PR - Pull Request management and review (Binh Pháp: Hành Quân)
argument-hint: [pr task]
---

# /pr - PR Manager

> **"Tướng có năm điều nguy"** - A general has five dangerous faults (Review catches them).

## Usage

```bash
/pr [action] [options]
```

## Actions/Options

| Action/Option | Description | Example |
|--------------|-------------|---------|
| `create` | Create a new PR | `/pr create "Feature: Auth"` |
| `review` | Review specific PR | `/pr review 123` |
| `list` | List open PRs | `/pr list` |
| `--merge` | Auto-merge when checks pass | `/pr create --merge` |

## Execution Protocol

1. **Agent**: Delegates to `pr-manager`.
2. **Process**:
   - Drafts PR description using template.
   - Runs `gh` CLI commands.
   - Summarizes changes.
3. **Output**: PR URL and Status.

## Examples

```bash
# Create a PR for current branch
/pr create "feat: Implement new dashboard widget"

# Review a PR
/pr review 42
```

## Binh Pháp Mapping
- **Chapter 9**: Hành Quân (Maneuvering) - Joining forces.

## Constitution Reference
- **PR Checks**: Linting, Tests, Review required.

## Win-Win-Win
- **Owner**: Quality control.
- **Agency**: Knowledge sharing.
- **Client**: Stable releases.
