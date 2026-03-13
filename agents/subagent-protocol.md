---
name: subagent-protocol
description: "Status protocol for all subagents — Jidoka-integrated. Reference before dispatching any subagent via Task tool."
---

# Subagent Status Protocol

Adapted from Superpowers (github.com/obra/superpowers) subagent-driven-development pattern.
Integrated with mekong-cli Jidoka (自働化) quality system.

## Mandatory Status Codes

Every subagent MUST end its response with exactly one status block:

```
<status>DONE</status>
```

### Status Definitions

| Status | Meaning | Controller Action |
|--------|---------|-------------------|
| `DONE` | Task complete, all tests pass, no concerns | Mark task complete, proceed to next |
| `DONE_WITH_CONCERNS` | Complete but found issues worth noting | Log concerns, continue but flag for human review (Andon yellow) |
| `BLOCKED` | Cannot continue — missing info, permission, or dependency | Re-dispatch with more context OR break task smaller OR escalate to human |
| `NEEDS_CONTEXT` | Task too broad or ambiguous to execute safely | Ask human to clarify before re-dispatching |

### Jidoka Integration

- `DONE` = Green light (進め)
- `DONE_WITH_CONCERNS` = Yellow light (注意) — log to `.mekong/concerns.log`
- `BLOCKED` = Red light (止まれ) — stop line, attempt auto-fix
- 3 consecutive `BLOCKED` from same agent = disable agent, notify human (Andon cord pulled)
- `NEEDS_CONTEXT` = pause line, human intervention required

### Subagent Dispatch Template

When dispatching a subagent via Task tool, include this at the end of the prompt:

```
IMPORTANT: When you finish, report your status using exactly one of:
<status>DONE</status>
<status>DONE_WITH_CONCERNS</status> followed by your concerns
<status>BLOCKED</status> followed by what you need
<status>NEEDS_CONTEXT</status> followed by your questions

Do NOT proceed past your assigned task. Do NOT modify files outside your task scope.
```

### Model Selection by Task Type

Use the least powerful model that can handle the task:

| Task Type | Model Tier | Examples |
|-----------|-----------|----------|
| Mechanical | Cheap (qwen-turbo, gpt-4o-mini) | Isolated functions, clear specs, 1-2 files, formatting |
| Integration | Standard (claude-sonnet, qwen3-coder-plus) | Multi-file coordination, pattern matching, debugging |
| Architecture | Capable (claude-opus, qwen3-coder-plus) | Design decisions, code review, complex reasoning |
