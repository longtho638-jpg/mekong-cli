---
description: description: 🏯 DELEGATE - Assign persistent task to CC CLI agent swarm (Binh Phá
---

# Claudekit Command: /delegate

> Imported from claudekit-engineer

# /delegate - Multi-Agent Task Delegation

> **"Thượng binh phạt mưu"** - Assign tasks that persist across sessions

## Input

<objective>$ARGUMENTS</objective>

## Execution Protocol

### Step 1: Load Memory

Read current task registry from `.claude/memory/tasks.md`

### Step 2: Create Task Entry

Generate unique task ID and add to registry:

```markdown
- [ ] TASK-[UUID-8]
    - Description: $ARGUMENTS
    - Assigned: [auto-selected agent]
    - Status: pending
    - Created: [now]
```

### Step 3: Agent Selection

Based on keywords in task description:
| Keywords | Agent |
|----------|-------|
| fix, bug, error, crash | debugger |
| test, verify, validate | tester |
| feature, add, create, build | fullstack-developer |
| docs, readme, document | docs-manager |
| review, refactor, clean | code-reviewer |
| deploy, ship, release | git-manager |
| plan, design, architect | planner |
| research, analyze, investigate | researcher |

### Step 4: Spawn Agent

```bash
# Background execution
claude --dangerously-skip-permissions /[agent] "$ARGUMENTS" &
```

### Step 5: Update Memory

Set task status to `running` with agent assignment.

### Step 6: Report

```
✅ Task delegated successfully!
📋 Task ID: TASK-XXXXXXXX
🤖 Assigned to: [agent-name]
📁 Memory: .claude/memory/tasks.md

💡 Use /status to check progress
💡 Use /quantum to see all tasks
```

## Usage Examples

```bash
/delegate "Fix webhook signature validation in backend"
/delegate "Add dark mode toggle to dashboard"
/delegate "Document the CC CLI revenue module"
/delegate "Test all 46 CC CLI commands"
```

## 🏯 Binh Pháp Wisdom

> "知彼知己，百戰不殆" - Know your tasks, know your agents, never fail.
