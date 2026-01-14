---
description: 🔀 PR Merge Command - Auto Check & Merge Jules PRs
argument-hint: [:check|:merge|:auto]
---

## Mission

Automatically check GitHub for PRs from Jules and merge if all checks pass.

## Subcommands

| Command | Description | Action |
|---------|-------------|--------|
| `/pr` | Check PR status | Read-only |
| `/pr:check` | Check all open PRs | Read-only |
| `/pr:merge` | Merge eligible PRs (dry run) | Safe |
| `/pr:auto` | Auto-merge ALL eligible PRs | ⚠️ Writes |

## Trusted Authors (Auto-Merge)

- `jules[bot]` ✅
- `dependabot[bot]` ✅
- `github-actions[bot]` ✅
- `renovate[bot]` ✅

## Requirements for Auto-Merge

1. ✅ Author in trusted list
2. ✅ No merge conflicts
3. ✅ All CI checks passed

## Quick Examples

```bash
/pr                    # Check all PRs
/pr:check              # Same as above
/pr:merge              # Dry run - show what would merge
/pr:auto               # Actually merge eligible PRs
```

## Python Integration

```python
# turbo
from antigravity.core.pr_manager import PRManager

manager = PRManager()

# Check status
manager.print_status()

# Dry run
manager.check_and_merge_all(dry_run=True)

# Actually merge
manager.check_and_merge_all(dry_run=False)
```

## CLI Usage

```bash
# Check PRs
python -m antigravity.core.pr_manager

# Auto-merge
python -m antigravity.core.pr_manager --merge
```

## Flow

```
┌─────────────────────────────────────────┐
│  /pr:auto                               │
│                                         │
│  1. Fetch open PRs from GitHub          │
│  2. Check each PR:                      │
│     - Is author trusted? (jules[bot])   │
│     - Are CI checks green?              │
│     - Any merge conflicts?              │
│  3. Merge eligible PRs (squash)         │
│  4. Report results                      │
└─────────────────────────────────────────┘
```

## Safety

- Only merges from trusted bot authors
- Human PRs always require manual review
- Dry run by default for `:merge`
- Only `:auto` actually merges

---

🔀 **Jules creates PRs → /pr:auto merges them!**
