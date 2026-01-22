# 📚 Plan: Refactor Documentation for "Vibe Coding"

> **Goal:** Synchronize documentation content with the new "Vibe Coding" workflow (Architect -> Code -> Kanban) enabled by the latest CLI updates.

## 1. Strategy (Binh Pháp)

*   **Đạo (The Way):** Shift focus from "Manual Configuration" to "AI Orchestration".
*   **Tướng (Leadership):** The User is the "Architect", the CLI is the "Concierge", and AI is the "Builder".
*   **Pháp (Method):** Update `Introduction` and `Quick Start` to reflect the new `scaffold` and `kanban` commands.

## 2. Content Changes

### A. `introduction.md`
*   **Concept:** Redefine AgencyOS as "The OS for Vibe Coding".
*   **Key Features:** Add "Architect Agent" (Scaffold) and "Kanban Manager".
*   **Workflow:** Visual representation of: `Idea` -> `/scaffold` -> `AI Code` -> `/kanban` -> `Ship`.

### B. `quick-start.md`
*   **Prerequisites:** Add `vibe-kanban` setup.
*   **Steps:**
    1.  **Install:** `git clone` & `setup_vibe_kanban.sh`.
    2.  **Architect:** Run `agencyos scaffold "I want a CRM"`.
    3.  **Code:** Paste prompt to AI.
    4.  **Manage:** `agencyos kanban`.
    5.  **Ship:** `agencyos ship`.

### C. `index.md`
*   Update the overview to mention the "Antigravity IDE" experience.

## 3. Execution Plan

1.  **Rewrite `introduction.md`:** Emphasize the new "Vibe Coding" paradigm.
2.  **Rewrite `quick-start.md`:** Replace the old legacy commands with the new `scaffold`/`kanban` flow.
3.  **Update `installation.md`:** Ensure `setup_vibe_kanban.sh` is mentioned.

## 4. Output
*   Updated Markdown files in `apps/docs/src/content/docs/getting-started/`.
