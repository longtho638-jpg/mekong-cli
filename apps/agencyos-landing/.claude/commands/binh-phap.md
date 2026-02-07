---
description: ⚔️ Binh Pháp - Strategic execution framework (plan → implement → verify → ship)
argument-hint: [action] [task-description] — actions: plan|implement|verify|ship
---

**Ultrathink** and execute Binh Pháp strategic framework based on the action provided:

<user-input>$ARGUMENTS</user-input>

---

## Actions

### `plan` — 第一篇 始計 (Strategic Planning)

1. Use `planner` subagent with `researcher` subagents **in parallel** to:
   - Analyze the task deeply (codebase scan, dependency check, risk assessment)
   - Create implementation plan in `./plans/` directory
   - Follow progressive disclosure: `plan.md` overview → `phase-XX-*.md` details
2. Present plan with pros/cons to user for approval
3. **Do NOT implement** until user approves

### `implement` — 第七篇 軍爭 (Parallel Execution)

1. Read the latest approved plan from `./plans/` directory
2. Spawn Agent Team for parallel execution:
   - `fullstack-developer` → Core implementation
   - `ui-ux-designer` → Frontend/UI (if applicable)
   - `tester` → Write + run tests alongside
3. Run type-check + build after each phase
4. Follow Plan-Execute-Verify cycle from CLAUDE.md

### `verify` — 第十一篇 九地 (Verification)

**KHÔNG TIN BÁO CÁO - PHẢI XÁC THỰC!**

1. Use `tester` subagent to run full test suite
2. Use `debugger` subagent if tests fail
3. Check production site via browser if deployed
4. Report verification results with evidence (screenshots/logs)

### `ship` — 第十二篇 火攻 (Deploy)

1. Use `code-reviewer` subagent for final review
2. Use `docs-manager` subagent to update docs
3. Use `git-manager` subagent to commit with convention:
   ```
   feat: [module] - Description
   fix: [module] - Description
   ```
4. Deploy if applicable, then verify production

---

## Rules

- Always read `CLAUDE.md` first for project context
- Activate relevant skills from `.claude/skills/` catalog
- Two-Call Mandate: send command text first, then Enter separately
- Reports must be concise — sacrifice grammar for brevity
