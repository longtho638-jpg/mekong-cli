---
description: description: Ship code to production - test, commit, push, deploy
---

# Claudekit Command: /ship

> Imported from claudekit-engineer

# /ship - Ship Command

> **MCP Integration**: Routes to `coding_server`

## Usage

```bash
/ship "commit message"
```

## Workflow

1.  **Pre-flight**: `coding_server.lint`
2.  **Test**: `coding_server.run_tests`
3.  **Commit**: `coding_server.commit`
4.  **Push**: `coding_server.push`
5.  **Deploy**: `coding_server.deploy`

## MCP Tools

- `coding_server.ship_feature`
- `coding_server.build_project`

## Flags

- `--dry-run`: Test without pushing
- `--force`: Bypass non-critical checks (use with caution)

> 🚀 **"Ship fast, fix fast"**
