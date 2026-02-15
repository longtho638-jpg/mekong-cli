# Phase 3: Meta-Learning (Dynamic Skill Synthesis)

## Context
The system executes hundreds of missions but doesn't "learn" from them. Successful patterns are lost in logs. We need a process to extract "Skills" (reusable patterns/prompts) from successful missions and save them to `.claude/skills/`.

## Goals
- Create `lib/knowledge-synthesizer.js`.
- Implement post-mission analysis for "High Value" successes.
- Auto-generate `.claude/skills/` files.

## Architecture
- **Trigger:** Mission completed successfully AND tagged as `COMPLEX` or `HIGH_VALUE`.
- **Synthesizer:** LLM reads the mission prompt + execution log + final diff.
- **Output:** A Markdown Skill file (`SKILL.md`) following the ClaudeKit format.

## Implementation Steps

1.  **Create `lib/knowledge-synthesizer.js`**:
    -   Function `synthesizeSkill(missionId, logContent, diff)`.
    -   Identify if the mission represents a *generalizable pattern* (e.g., "How to upgrade Tailwind").
    -   If yes, generate skill content: Description, Prompt Template, Steps.

2.  **Integrate with `task-queue.js`**:
    -   After successful mission (and Gate pass), async call `synthesizeSkill`.
    -   Do not block main queue.

3.  **Skill Storage**:
    -   Save to `.claude/skills/auto-generated/<skill-name>/SKILL.md`.
    -   (Optional) Notify human to review/promote the skill to main library.

4.  **Testing**:
    -   Run a complex refactor mission.
    -   Verify a new skill is created in `.claude/skills/auto-generated/`.

## Todo List
- [ ] Create `lib/knowledge-synthesizer.js`.
- [ ] Define criteria for "Learnable Mission".
- [ ] Implement skill generation prompt.
- [ ] Hook into `task-queue.js` post-success flow.
- [ ] Verify skill generation.
