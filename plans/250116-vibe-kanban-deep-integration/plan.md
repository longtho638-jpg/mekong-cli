# 📅 Plan: Vibe Kanban Deep Integration (AgencyOS)

> **Ref:** https://github.com/BloopAI/vibe-kanban
> **Goal:** Deep integration of Vibe Kanban as the "Operating System" for AgencyOS agents, mapping strictly to `.claude` architecture.

## 1. Analysis & Architecture (Binh Pháp)

The integration will follow the **"Ngũ Sự" (5 Factors)** principle:
*   **Đạo (The Way):** The Kanban board is the single source of truth. Agents *must* consult the board before acting.
*   **Thiên (Timing):** Sync intervals must be respected (handled by `AgentOrchestrator`).
*   **Địa (Terrain):** The `vibe-kanban` repo (assumed local or hosted).
*   **Tướng (Leadership):** The `planner` agent assigns tasks; `fullstack-dev` executes.
*   **Pháp (Discipline):** Strict typed schema (`TaskModel`) and error handling.

### Gap Analysis (vs. Previous MVP)
| Feature | Previous MVP | Deep Integration |
| :--- | :--- | :--- |
| **Agent Autonomy** | Passive (User triggers CLI) | Active (Agent Skill `manage_kanban`) |
| **Setup** | Manual (User must run server) | Automated (`scripts/setup_vibe_kanban.sh`) |
| **Config** | Env Vars only | `.agencyos/settings.json` + Env |
| **Architecture** | Basic Bridge | `.claude` Workflow + Agent Skill |

## 2. Implementation Plan

### Phase 1: Infrastructure & Setup (Nền Tảng)
- [ ] **Setup Script:** Create `scripts/setup_vibe_kanban.sh` to clone, build, and run the upstream repo.
- [ ] **Config Schema:** Update `.agencyos/settings.json` to include Kanban configuration.

### Phase 2: Agent Skill (Vũ Khí)
- [ ] **Skill Definition:** Create `.agencyos/skills/kanban_skill.py`. This allows LLM agents (Claude/Gemini) to *directly* call the Kanban board during their execution loop, not just via CLI.
- [ ] **Tool Definition:** Create `.agencyos/tools/kanban.json` (MCP-like definition for agent discovery).

### Phase 3: .claude Mapping (Luật)
- [ ] **Workflow:** Create `.claude/workflows/kanban-agent-flow.md` defining how Claude should use the board.
- [ ] **Memory:** Update `.claude/memory/kanban_context.md` (template) for agents to store board state.

### Phase 4: Refinement (Tối Ưu)
- [ ] **Bridge Update:** Add `add_comment` and `move_card` methods to `VibeBoardClient` for richer interaction.

## 3. Execution Order

1.  `scripts/setup_vibe_kanban.sh`
2.  `antigravity/vibe_kanban/bridge_extensions.py` (Enhancements)
3.  `.agencyos/skills/kanban.py`
4.  `.claude/workflows/kanban-flow.md`

## 4. Output Artifacts

*   `scripts/setup_vibe_kanban.sh`
*   `.agencyos/skills/kanban.py`
*   `.claude/workflows/kanban-flow.md`
*   Updated `antigravity/vibe_kanban_bridge.py`
