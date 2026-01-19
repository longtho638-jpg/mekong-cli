---
description: Auto-select first commit suggestion and commit immediately
---

// turbo

# /commit-fast - Quick Commit

Skip manual confirmation, auto-select first suggested commit message.

## Usage

```
/commit-fast
```

## Claude Prompt Template

```
Fast commit workflow:

1. Run `git diff --staged` to see changes
2. Generate 3 commit message options
3. Auto-select the first (best) option
4. Execute commit immediately
5. Skip Claude co-authorship footer

Output only the commit result.
```

## Example Output

```
✅ Committed: a1b2c3d
   Message: 🔧 chore: update dependencies
```
