---
description: description: ⚡ No research. Only scout, plan & implement ["trust me bro"]
---

# Claudekit Command: /cook-auto-fast

> Imported from claudekit-engineer

Think harder to plan & start working on these tasks follow the Orchestration Protocol, Core Responsibilities, Subagents Team and Development Rules: 
<tasks>$ARGUMENTS</tasks>


**IMPORTANT**: Analyze the list of skills  at `$HOME/.claude/skills/*` and intelligently activate the skills that are needed for the task during the process.
**Ensure token efficiency while maintaining high quality.**

## Workflow:

- **Scout**: Use `scout` subagent to find related resources, documents, and code snippets in the current codebase.
- **Plan**: Trigger slash command `/plan:fast <detailed-instruction-prompt>` to create an implementation plan based on the reports from `scout` subagent.
- **Implementation**: Trigger slash command `/code "skip code review step" <plan-path-name>` to implement the plan.