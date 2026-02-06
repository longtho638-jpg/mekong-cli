# Implementation Plan: GitHub GraphQL Integration Layer

**Status:** COMPLETE
**Priority:** High
**Context:** Implementing the GitHub GraphQL (API v4) integration layer for the CLI project management system, based on the "CLI Project Management Integrations (2026)" research report.

## Context Links
- Research Report: `plans/reports/researcher-260206-0938-cli-pm-integrations.md`
- CLEO Architecture: `.cleo/docs/CLEO-SYSTEM-ARCHITECTURE.md`

## Overview
This plan details the implementation of a robust integration layer with GitHub's GraphQL API (v4). The goal is to enable the CLI to interact with GitHub Projects V2, Issues, and Pull Requests efficiently using a specific "Epic -> Task -> Subtask" hierarchy and a hybrid storage model.

## Key Insights (from Research)
1.  **GraphQL is Mandatory**: REST API cannot handle GitHub Projects V2 "memex" views efficiently.
2.  **Hybrid Storage**: Local JSON for state, JSONL for logs, SQLite for search.
3.  **Performance**: Batch queries for reading (100+ items) and `gh` CLI wrapper or direct mutations for writing.
4.  **Data Model**: Strict hierarchy (Epic -> Task -> Subtask) mapping to Feature -> Issue -> Tasklist.

## Architecture

### Components
1.  **`GitHubClient`**: Wrapper around GraphQL interactions. Handles auth and rate limiting.
2.  **`ProjectService`**: Domain logic for mapping GitHub Projects V2 items to local Task models.
3.  **`SyncEngine`**: Bidirectional sync logic (Last Write Wins) between local JSON and remote GitHub items.
4.  **`StorageAdapter`**: Interface for the hybrid storage strategy (JSON/JSONL/SQLite).

### Data Flow
`CLI Command` -> `ProjectService` -> `GitHubClient` (GraphQL) -> `GitHub API`
                                  -> `StorageAdapter` -> `Local Filesystem`

## Phases

### Phase 1: Foundation & Authentication
-   **Goal**: Establish connection to GitHub GraphQL API.
-   **Tasks**:
    -   Implement `GitHubClient` using `gh api graphql` or a lightweight fetch wrapper.
    -   Validate authentication scopes (`project`, `repo`, `user`).
    -   Create basic "Hello World" query to fetch user/org projects.

### Phase 2: Data Model & Storage
-   **Goal**: Define local schemas and storage mechanism.
-   **Tasks**:
    -   Define TypeScript interfaces for `Epic`, `Task`, `Subtask`.
    -   Implement `JsonStorageAdapter` for reading/writing local task files.
    -   Implement `JsonlLogger` for audit trails (`todo-log.json`).

### Phase 3: Read Operations (Sync Down)
-   **Goal**: Fetch data from GitHub and map to local model.
-   **Tasks**:
    -   Construct GraphQL queries for `user.projectV2` and `organization.projectV2`.
    -   Implement pagination and batching (fetch 100 items/page).
    -   Map Project V2 Fields (Status, Priority, etc.) to local attributes.
    -   Handle "Epic" identification (e.g., specific view or label).

### Phase 4: Write Operations (Sync Up)
-   **Goal**: Push local changes to GitHub.
-   **Tasks**:
    -   Implement `addProjectV2ItemById` mutation.
    -   Implement `updateProjectV2ItemFieldValue` mutation.
    -   Use `gh` CLI wrapper for complex mutations if needed.
    -   Handle creation of Issues (which then become Project Items).

### Phase 5: Sync Engine
-   **Goal**: Synchronize state and handle conflicts.
-   **Tasks**:
    -   Implement "Last Write Wins" logic based on `updatedAt`.
    -   Create `sync` command to trigger the process.
    -   Handle basic conflict resolution (notify user or auto-merge).

### Phase 6: CLI Integration
-   **Goal**: Expose functionality via CLI commands.
-   **Tasks**:
    -   Integrate with `cleo` or main CLI entry point.
    -   Commands: `cli sync`, `cli task add --remote`, `cli status --remote`.

## Requirements
-   `gh` CLI installed and authenticated.
-   Node.js >= 18.0.0.
-   TypeScript.

## Success Criteria
-   Can fetch all items from a designated GitHub Project V2.
-   Can create a new task locally and see it appear on the GitHub Board.
-   Sync operation completes in < 5s for < 1000 items.
-   Local storage reflects the GitHub state accurately.

## Next Steps
1.  Approve this plan.
2.  Begin Phase 1: Foundation & Authentication.
