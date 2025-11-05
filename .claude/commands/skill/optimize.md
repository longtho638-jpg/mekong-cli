---
description: Optimize an existing agent skill
argument-hint: [skill-name] [prompt]
---

Ultrathink. 
Use `skill-creator` and `claude-code` skills.

## Arguments
SKILL: $1 (default: `*`)
PROMPT: $2 (default: empty)

## Your mission
Propose a plan to optimize an existing skill in `.claude/skills/${SKILL}` directory follow these instructions:
- Skill should be combined into specific topics, for example: `cloudflare`, `cloudflare-r2`, `cloudflare-workers`, `docker`, `gcloud` should be combined into `devops`
- `SKILL.md` should be less than 200 lines and include references of markdown files and scripts.
- Each script or referenced markdown file should be also less than 250 lines, remember that you can always split them into multiple files.
- Descriptions in metadata of `SKILL.md` files should be both concise and still contains enough usecases of the references and scripts, this will help skills can be activated automatically during the implementation process of Claude Code.
- Referenced markdowns:
  - Sacrifice grammar for the sake of concision when writing these files.
  - Can reference other markdown files or scripts as well.
- Referenced scripts: 
  - Prefer nodejs or python scripts, instead of bash script, because bash scripts are not well-supported on Windows.
  - If you're going to write python scripts, make sure you have `requirements.txt`
  - Make sure scripts respect `.env` file follow this order: `process.env` > `.claude/skills/${SKILL}/.env` > `.claude/skills/.env` > `.claude/.env` 
  - Create `.env.example` file to show the required environment variables.
  - Always write tests for these scripts.
- Ask user to review your plan:
  - If the user approve: Write down a plan follow "Output Requirements", then ask user if they want to start implementing.
  - If the user reject: Revise the plan or ask more questions to clarify more about the user's request (ask one question at the time), then repeat the review process.

## Why?
- Better **context engineering**, inspired from **progressive disclosure** technique of Agent Skills, when skills are activated, Claude Code will consider to load only relevant files into the context, instead of reading all long `SKILL.md` as before.

## Additional instructions
<additional-instructions>$PROMPT</additional-instructions>

## Output Requirements
An output implementation plan must also follow the progressive disclosure structure:
- Create a directory `plans/YYYYMMDD-HHmm-plan-name` (example: `plans/20251101-1505-authentication-and-profile-implementation`).
- Save the overview access point at `plan.md`, keep it generic, under 80 lines, and list each phase with status/progress and links.
- For each phase, add `phase-XX-phase-name.md` files containing sections (Context links, Overview with date/priority/statuses, Key Insights, Requirements, Architecture, Related code files, Implementation Steps, Todo list, Success Criteria, Risk Assessment, Security Considerations, Next steps).

## Before Starting:
- Read this skill documentation carefully before starting: https://docs.claude.com/en/docs/claude-code/skills.md
- Read the **Agent Skills Spec** carefully before starting: `.claude/skills/agent_skills_spec.md`
- [Agent Skills Overview](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview.md)
  - Especially focus on the **How Skills work** section (with **progressive disclosure**)
  - That means try to keep `SKILL.md` short and simple (<200 lines), and provide more details in the reference files & scripts.
- [Best Practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices.md)

## Skill Structure:
- **Skills location:** `./.claude/skills`
- Skill file name (uppercase): `SKILL.md`
  `SKILL.md` must be under 200 lines, if you need more, plit it to multiple files in `references` folder.
- Skill folder name (hyphen-case): `${SKILL}`
- Skill full path: `./.claude/skills/${SKILL}/SKILL.md`
- Script files (if any): `./.claude/skills/${SKILL}/scripts/my-script.py` or `./.claude/skills/${SKILL}/scripts/my-script.sh`
- Reference files (if any): `./.claude/skills/${SKILL}/references/ref-0.md` (each file should be less than 250 lines)