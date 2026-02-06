# Phase 5: Sync Engine

**Status:** COMPLETE
**Priority:** High
**Context:** Implementing the bidirectional synchronization logic between local storage and GitHub.

## Context Links
- Master Plan: `plans/260206-1000-github-graphql-integration/plan.md`
- Storage: `packages/vibe-dev/src/lib/storage-adapter.ts`
- Project Service: `packages/vibe-dev/src/lib/project-service.ts`

## Overview
The `SyncEngine` orchestrates the flow of data. It pulls data from GitHub, compares it with local data, and resolves discrepancies based on the "Last Write Wins" (LWW) strategy using the `updatedAt` timestamp. It creates actions to either update the local store or push changes to GitHub.

## Logic (Last Write Wins)
For each task ID (common to local and remote):
1.  **Match**: If `remote.updatedAt > local.updatedAt` -> **PULL** (Update Local).
2.  **Match**: If `local.updatedAt > remote.updatedAt` -> **PUSH** (Update Remote).
3.  **Local Only**: If new task locally -> **PUSH** (Create on Remote).
4.  **Remote Only**: If new task remotely -> **PULL** (Create Local).

## Architecture
-   `packages/vibe-dev/src/lib/sync-engine.ts`: Main logic class.
-   `packages/vibe-dev/src/types/sync.types.ts`: Definitions for Sync Actions (Push/Pull).

## Implementation Steps
1.  [ ] Define Sync Types in `packages/vibe-dev/src/types/sync.types.ts`.
    -   `SyncAction`: { type: 'push' | 'pull', task: Task, changes?: Partial<Task> }
2.  [ ] Implement `SyncEngine` in `packages/vibe-dev/src/lib/sync-engine.ts`.
    -   `sync(localTasks: Task[], remoteTasks: Task[])`: Returns list of operations.
    -   `calculateDiff(local: Task, remote: Task)`: Determines which fields changed.
3.  [ ] Integrate `ProjectService` and `JsonStorageAdapter` into a `runSync` method.
    -   Fetch Remote.
    -   Read Local.
    -   Calculate Sync Actions.
    -   Execute Actions (Batch where possible).
4.  [ ] Write verification script `packages/vibe-dev/scripts/test-sync-engine.ts`.

## Verification
-   Simulate scenarios:
    -   Remote newer -> Local updated.
    -   Local newer -> Remote updated.
    -   New Local -> Remote created.
    -   New Remote -> Local created.
