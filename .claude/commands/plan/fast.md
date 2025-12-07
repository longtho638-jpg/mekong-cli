---
description: ⚡⚡ No research. Only analyze and create an implementation plan
argument-hint: [task]
---

Think.
Activate `planning` skill.

## Your mission
<task>
$ARGUMENTS
</task>

## Pre-Creation Check

Before creating plan folder, check `$CK_ACTIVE_PLAN` env var:

1. **Check for active plan:**
   - If `$CK_ACTIVE_PLAN` is set AND points to valid directory:
     - Ask user: "Active plan found: {path}. Continue with this? [Y/n]"
     - If Y (default): Use existing path, skip folder creation
     - If n: Proceed to create new plan
   - If empty or invalid: Proceed to create new

2. **Create plan folder** (only if creating new):
   - Generate: `plans/YYYYMMDD-HHmm-plan-name`
   - Update session state: `node .claude/scripts/set-active-plan.cjs plans/YYYYMMDD-HHmm-plan-name`

## Workflow
Use `planner` subagent to:
1. If creating new plan: Create directory `plans/YYYYMMDD-HHmm-plan-name` and run `node .claude/scripts/set-active-plan.cjs plans/...`
   If reusing existing: Use the active plan path from `$CK_ACTIVE_PLAN`.
   Make sure you pass the directory path to every subagent during the process.
2. Follow strictly to the "Plan Creation & Organization" rules of `planning` skill.
3. Analyze the codebase by reading `codebase-summary.md`, `code-standards.md`, `system-architecture.md` and `project-overview-pdr.md` file.
4. Gathers all information and create an implementation plan of this task.
5. Ask user to review the plan.

## Output Requirements

**Plan Directory Structure**
```
plans/
└── YYYYMMDD-HHmm-plan-name/
    ├── reports/
    │   ├── XX-report.md
    │   └── ...
    ├── plan.md
    ├── phase-XX-phase-name-here.md
    └── ...
```

**Plan File Specification**
- Save the overview access point at `plans/YYYYMMDD-HHmm-plan-name/plan.md`. Keep it generic, under 80 lines, and list each implementation phase with status and progress plus links to phase files.
- For each phase, create `plans/YYYYMMDD-HHmm-plan-name/phase-XX-phase-name-here.md` containing the following sections in order: Context links (reference parent plan, dependencies, docs), Overview (date, description, priority, implementation status, review status), Key Insights, Requirements, Architecture, Related code files, Implementation Steps, Todo list, Success Criteria, Risk Assessment, Security Considerations, Next steps.

## Important Notes
- **IMPORTANT:** Ensure token consumption efficiency while maintaining high quality.
- **IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
- **IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports.
- **IMPORTANT:** In reports, list any unresolved questions at the end, if any.
- **IMPORTANT**: **Do not** start implementing.
