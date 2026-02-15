# Phase 4: Auto-CTO Evolution (Dynamic Syllabus)

## Context
`auto-cto-pilot.js` currently rotates through a hardcoded list of tasks (`BINH_PHAP_TASKS`). It doesn't adapt to the specific needs or state of a project (e.g., a project with 0% coverage needs tests more than i18n sync).

## Goals
- Create `lib/project-profiler.js`.
- Connect Auto-CTO to a "Knowledge Graph" (Project State).
- dynamic Task Generation.

## Architecture
- **Profiler:** Analyzes project state (Tests, Coverage, Lint Errors, Age).
- **Planner:** Generates a prioritized "Syllabus" of tasks for that specific project.
- **Executor:** Auto-CTO picks from Syllabus instead of static list.

## Implementation Steps

1.  **Create `lib/project-profiler.js`**:
    -   Function `analyzeProject(dir)`.
    -   Metrics: `last_commit_date`, `ts_error_count`, `test_coverage`, `dependency_freshness`.
    -   Output: `ProjectProfile` object.

2.  **Update `auto-cto-pilot.js`**:
    -   Replace static `BINH_PHAP_TASKS` loop with dynamic selection.
    -   Call `analyzeProject`.
    -   Use LLM (or heuristics) to select best Binh Phap task:
        -   If `ts_errors > 100` -> `type_safety`.
        -   If `coverage < 20%` -> `test_suite`.
        -   If `deps_old` -> `security_audit`.

3.  **Persistence**:
    -   Store Project Profiles in `.tom_hum_state.json` or separate DB.
    -   Track "Health Score" over time.

4.  **Testing**:
    -   Run Auto-CTO on a project with known issues (e.g., missing tests).
    -   Verify it generates a `test_suite` mission first.

## Todo List
- [ ] Create `lib/project-profiler.js` (metrics gathering).
- [ ] Modify `auto-cto-pilot.js` to use profiles.
- [ ] Implement dynamic task selection logic.
- [ ] Test prioritization on real projects.
