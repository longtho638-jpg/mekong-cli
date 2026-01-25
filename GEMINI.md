<!-- CLEO:START -->

@.cleo/templates/AGENT-INJECTION.md

<!-- CLEO:END -->

# GEMINI.md - Antigravity Agent Configuration

> **Mirror of CLAUDE.md for Gemini-based agents**

## 📝 PERSISTENT TASK MEMORY (DEEP INJECTION v2.5)

> **"知彼知己，百戰不殆"** - Tasks persisted, never forgotten

**On EVERY session start, Agent MUST:**

1. **Read `.claude/memory/tasks.md`** - Contains:
    - Active delegated tasks
    - Task assignments and status
    - Progress tracking

2. **Continue in-progress tasks** before accepting new work
3. **Update task status** as work progresses

**Task Delegation Protocol:**

```bash
# Delegate tasks via /delegate command
/delegate "Fix webhook tests"
/delegate "Add dark mode to dashboard"
```

**Memory Location:** `.claude/memory/tasks.md`

**This memory persists:**

- ✅ Across session resets
- ✅ Across different agent instances (Claude Code, Gemini, Antigravity)
- ✅ Across terminal sessions
- ✅ Until explicitly marked complete

**CRITICAL:** Never forget delegated tasks. Check memory on every session start.

## Cross-Agent Sync

Both CLAUDE.md and GEMINI.md share:

- `.claude/memory/tasks.md` - Task registry
- `.claude/agents/` - Agent definitions
- `.claude/commands/` - Command specifications

**WIN-WIN-WIN applies to all agents.**
