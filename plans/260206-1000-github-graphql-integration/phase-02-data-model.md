# Phase 2: Data Model & Storage

**Status:** COMPLETE
**Priority:** High
**Context:** Defining the data structures and storage mechanisms for the Project Management integration.

## Context Links
- Master Plan: `plans/260206-1000-github-graphql-integration/plan.md`
- Research: `plans/reports/researcher-260206-0938-cli-pm-integrations.md`

## Overview
This phase defines the core data models (`Epic`, `Task`, `Subtask`) and implements the hybrid storage strategy recommended in the research report:
1.  **JSON**: For mutable state, optimized for Git diffs.
2.  **JSONL**: For immutable audit logs, optimized for append performance.

## Requirements
-   Strict typing for all models.
-   `Epic` maps to GitHub Projects V2 Items (view/label based).
-   `Task` maps to GitHub Issues.
-   `Subtask` maps to Tasklist items within Issues.
-   Storage adapter must support reading/writing JSON files.
-   Logger must support appending to JSONL files.

## Architecture
-   `packages/vibe-dev/src/types/task.types.ts`: Domain models.
-   `packages/vibe-dev/src/lib/storage-adapter.ts`: JSON file handling.
-   `packages/vibe-dev/src/lib/audit-logger.ts`: JSONL handling.

## Implementation Steps
1.  [ ] Define Domain Models in `packages/vibe-dev/src/types/task.types.ts`.
    -   `TaskStatus`: 'pending' | 'active' | 'blocked' | 'done'.
    -   `TaskPriority`: 'low' | 'medium' | 'high' | 'critical'.
    -   `BaseTask`: Common fields (id, title, status, priority, createdAt, updatedAt).
    -   `Epic`, `Task`, `Subtask` interfaces extending `BaseTask`.
2.  [ ] Implement `JsonStorageAdapter` in `packages/vibe-dev/src/lib/storage-adapter.ts`.
    -   `read<T>(path: string): Promise<T>`
    -   `write<T>(path: string, data: T): Promise<void>`
    -   Ensure atomic writes (write to temp + rename) to prevent corruption.
3.  [ ] Implement `AuditLogger` in `packages/vibe-dev/src/lib/audit-logger.ts`.
    -   `log(action: string, payload: any): Promise<void>`
    -   Append line to `todo-log.json`.
4.  [ ] Write tests/scripts to verify storage and logging.

## Verification
-   Run script to write and read a task.
-   Run script to log an action and verify JSONL format.
