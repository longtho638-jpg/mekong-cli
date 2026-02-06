# Phase 6: CLI Integration

**Status:** COMPLETE
**Priority:** High
**Context:** Exposing the GitHub integration logic via CLI commands to enable user interaction.

## Context Links
- Master Plan: `plans/260206-1000-github-graphql-integration/plan.md`
- Sync Engine: `packages/vibe-dev/src/lib/sync-engine.ts`

## Overview
This phase integrates the backend logic (`GitHubClient`, `ProjectService`, `SyncEngine`) into the `vibe-dev` package exports and potentially provides a CLI entry point or commands that can be consumed by the main CLI application.

## Requirements
- Export core classes from `packages/vibe-dev/index.ts`.
- Create a `SyncCommand` class or function that wraps `SyncEngine.runSync`.
- Handle configuration (getting Auth Token, identifying current project).
- Provide a clean CLI output for the sync process.

## Architecture
- `packages/vibe-dev/src/index.ts`: Main barrel file.
- `packages/vibe-dev/src/commands/sync.command.ts`: Command handler.

## Implementation Steps
1. [ ] Create `packages/vibe-dev/src/commands/sync.command.ts`.
    - Input: `owner`, `repo` (or project ID), `localFile`.
    - Logic: Instantiate Client -> Service -> Storage -> Engine -> Run.
2. [ ] Export symbols in `packages/vibe-dev/src/index.ts`.
3. [ ] Update `packages/vibe-dev/package.json` to include a bin entry (optional, or just library export).
4. [ ] Verify with a script that imports from `index.ts`.

## Verification
- Run a script that imports `SyncCommand` from the built package and executes a sync.
