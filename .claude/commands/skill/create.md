---
description: Create a new agent skill
argument-hint: [prompt]
---

Think harder.
Read this skill documentation carefully before starting: https://docs.claude.com/en/docs/claude-code/skills.md
Create a new **Agent Skill** for Claude Code based on the given prompt:
<prompt>$ARGUMENTS</prompt>

**Skills location:** `./.claude/skills`

## References (MUST READ):
- [Agent Skills Overview](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview.md)
- [Best Practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices.md)

## Important Notes:
- If you receive a lot of URLs, use multiple `Explorer` subagents to explore them in parallel, then report back to main agent.
- If you receive a lot of files, use multiple `Explorer` subagents to explore them in parallel, then report back to main agent.