# beads Overview

## What is beads?

beads (`bd`) is a **lightweight memory system for AI coding agents** implemented as a distributed, git-backed issue tracker. It provides persistent, queryable memory that travels with the codebase.

## Core Concept

Traditional issue trackers require humans to manage issues. beads inverts this: **AI agents are the primary users**, automatically filing, linking, and managing issues as they work.

## Three-Layer Architecture

```
CLI Layer (bd commands)
    ↕
SQLite Database (.beads/beads.db, gitignored)
    ↕ auto-sync (5s debounce)
JSONL (.beads/issues.jsonl, git-tracked)
    ↕ git push/pull
Remote Repository (shared across machines)
```

**Why this design:**
- SQLite: Fast local queries (<100ms)
- JSONL: Git-friendly, merge-safe
- Git: No server needed, offline works

## Hash-Based IDs

IDs like `bd-a1b2` instead of `bd-1`:
- Collision-free multi-agent operation
- No coordination between clones
- Progressive scaling (4→5→6 chars)

## Key Features

### 1. Dependency Tracking
Four relationship types:
- `blocks` - Hard blocker (affects ready work)
- `parent-child` - Hierarchical (epic → subtasks)
- `related` - Soft link
- `discovered-from` - Found during work

### 2. Ready Work Detection
`bd ready` shows only actionable issues:
- No open blockers
- Open or in_progress status
- Sorted by priority

### 3. Zero-Setup Sync
- Auto-export SQLite → JSONL (5s debounce)
- Auto-import JSONL → SQLite on pull
- Git hooks for instant sync

### 4. Agent-First API
- All commands support `--json`
- No interactive prompts
- Machine-readable output

### 5. Memory Decay
Compaction for old closed issues:
- Agent-driven summarization
- Reduces database size
- Preserves essential context

## Files Created by bd init

**Git-tracked:**
- `.beads/issues.jsonl` - Issue data
- `.beads/deletions.jsonl` - Deletion manifest
- `.beads/config.yaml` - Configuration
- `.gitattributes` - Merge driver

**Gitignored (local-only):**
- `.beads/beads.db` - SQLite cache
- `.beads/bd.sock` - Daemon socket

## Project Structure After Init

```
your-project/
├── .beads/
│   ├── beads.db          # Local SQLite (gitignored)
│   ├── issues.jsonl      # Git-tracked source of truth
│   ├── config.yaml       # Configuration
│   └── bd.sock           # Daemon socket
├── .gitattributes        # Merge driver config
└── ... your code
```

## When to Use

✅ **Use beads for:**
- Multi-session features
- Complex task dependencies
- Cross-agent coordination
- Audit trail requirements
- Discovered work tracking

❌ **Don't use for:**
- Simple single-session tasks
- Quick one-off changes
- Research without implementation

## Resources

- [GitHub Repository](https://github.com/steveyegge/beads)
- [Official Documentation](https://github.com/steveyegge/beads/tree/main/docs)
- [FAQ](https://github.com/steveyegge/beads/blob/main/docs/FAQ.md)
