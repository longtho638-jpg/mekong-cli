# 🎨 Plan: UI/UX Max Level (100% Coverage)

> **Goal:** Apply the "AgencyOS M3 Design System" to the entire ecosystem: Dashboard, Docs, and CLI.
> **Philosophy:** "Unified Experience" - A user should feel they are in the same "Operating System" whether they are in the Terminal, the Docs, or the Dashboard.

## 1. Scope of Work

### A. apps/dashboard (The Core)
*   **Status:** Core pages updated.
*   **Action:**
    *   Audit `layout.tsx` and `globals.css` to ensure *no* legacy styles leak through.
    *   Ensure all `AgencyCard` and `AgencyButton` usages utilize the new M3 Tokens strictly.

### B. apps/docs (The Manual)
*   **Status:** Standard Starlight/Nextra theme.
*   **Action:**
    *   Inject `md3-tokens.css` into the Docs.
    *   Update the "Landing Page" of the docs to match the Dashboard's "Glassmorphism" vibe.
    *   Refactor standard markdown elements (Blockquotes, Tables) to look like M3 components.

### C. mekong-cli (The Terminal)
*   **Status:** Standard Rich output.
*   **Action:**
    *   Define a `Rich` theme that maps to M3 Colors (Primary -> Emerald, Surface -> Grey10).
    *   Update `print_banner` and `print_help` to use this theme.

## 2. Implementation Plan

### Phase 1: Shared Design System (Cốt Lõi)
*   [ ] Move `apps/dashboard/styles/tokens` to a shared location or replicate it in `apps/docs`.
*   [ ] Create `cli/theme.py`: Define the mapping between M3 Tokens and Python Rich.

### Phase 2: Documentation Overhaul (Docs)
*   [ ] Copy `md-sys-*.css` to `apps/docs/src/styles/`.
*   [ ] Update `apps/docs/src/styles/custom.css` (or equivalent) to consume these vars.
*   [ ] "Agentic" Refactor: Update the Docs Layout to resemble the Dashboard Sidebar.

### Phase 3: CLI Polish (Terminal)
*   [ ] Update `cli/main.py` to import theme from `cli/theme.py`.
*   [ ] Re-style all tables and panels in the CLI to be "Rounded" and "Emerald".

### Phase 4: Agentic Map (.claude)
*   [ ] Update `.claude/rules/m3-strict.md` to explicitly mention Docs and CLI consistency.

## 3. Execution

1.  **CLI Theme:** Create `cli/theme.py`.
2.  **CLI Apply:** Update `cli/main.py`.
3.  **Docs Styles:** Inject tokens into `apps/docs`.
4.  **Verify:** Check visual consistency.

## 4. Output Artifacts

*   `cli/theme.py`
*   `apps/docs/src/styles/tokens/`
*   Updated `apps/docs/src/styles/global.css`
