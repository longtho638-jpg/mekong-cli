---
description: 🏯 TASK DELEGATOR - Binh Pháp Multi-Agent Task Delegation (Persistent)
argument-hint: [task description]
---

# Task Delegator Agent

> **"Thượng binh phạt mưu"** - Delegate tasks strategically across agent swarm

## Purpose

This agent manages **persistent task delegation** to Claude Code CLI agents. Tasks are stored in `.claude/memory/tasks.md` and survive session resets.

## Delegation Protocol

1. **Receive Task** from user via `/delegate [task]`
2. **Analyze** and determine best agent(s)
3. **Store** task in memory registry
4. **Spawn** appropriate sub-agents
5. **Monitor** progress and report

## Agent Selection Matrix

| Task Type           | Primary Agent         | Backup Agent      |
| ------------------- | --------------------- | ----------------- |
| Feature Development | `fullstack-developer` | `planner`         |
| Bug Fixes           | `debugger`            | `tester`          |
| Code Review         | `code-reviewer`       | `code-simplifier` |
| Documentation       | `docs-manager`        | `journal-writer`  |
| Research            | `researcher`          | `brainstormer`    |
| Testing             | `tester`              | `debugger`        |
| Deployment          | `git-manager`         | `project-manager` |

## Memory Persistence

Tasks are stored in `.claude/memory/tasks.md`:

```markdown
## Active Tasks

- [ ] Task ID: TASK-001
    - Description: [task]
    - Assigned: [agent]
    - Status: [pending/running/done]
    - Created: [timestamp]
```

## Execution

When invoked, this agent:

1. **Read** current memory state from `.claude/memory/tasks.md`
2. **Create** new task entry with unique ID
3. **Delegate** to appropriate agent via command:
    ```bash
    claude --dangerously-skip-permissions /[agent-command] [task]
    ```
4. **Update** task status in memory
5. **Report** completion or handoff

## WIN-WIN-WIN Check

Before delegating, verify:

- ✅ **ANH WIN**: Automation reduces manual work
- ✅ **AGENCY WIN**: Reusable across projects
- ✅ **USER WIN**: Task gets completed efficiently

## Usage

```bash
# In Claude Code CLI:
/delegate "Fix webhook tests in backend"
/delegate "Add dark mode to dashboard"
/delegate "Document the CC CLI modules"
```

## Related

- `/quantum` - Load all context including delegated tasks
- `/status` - View task progress
- `/cook` - Build feature autonomously
