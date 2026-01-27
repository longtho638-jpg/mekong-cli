---
description: description: ⚡⚡ Implement payment integration with Polar.sh
---

# Claudekit Command: /integrate-polar

> Imported from claudekit-engineer

Think harder.
Activate `payment-integration` skill.
Plan & start implementing payment integration with [Polar.sh](https://polar.sh/docs/llms-full.txt) follow the Orchestration Protocol, Core Responsibilities, Subagents Team and Development Rules: 
<tasks>$ARGUMENTS</tasks>


**IMPORTANT**: Analyze the list of skills  at `$HOME/.claude/skills/*` and intelligently activate the skills that are needed for the task during the process.
**Ensure token efficiency while maintaining high quality.**

## Workflow:

- **Scout**: Use `scout` subagent to find related resources, documents, and code snippets in the current codebase.
- **Plan**: Trigger slash command `/plan:fast <detailed-instruction-prompt>` to create an implementation plan based on the reports from `scout` subagent.
- **Implementation**: Trigger slash command `/code <plan>` to implement the plan.
