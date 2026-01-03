---
description: ⚡⚡⚡⚡ Analyze the codebase and create initial documentation
---

## Phase 1: Parallel Codebase Scouting

**You (main agent) must spawn scouts** - subagents cannot spawn subagents.

1. Run `ls -la` to identify actual project directories
2. Spawn 2-4 `scout-external` (preferred, uses Gemini 2M context) or `scout` (fallback) via Task tool
3. Target directories **that actually exist** - adapt to project structure, don't hardcode paths
4. Merge scout results into context summary

## Phase 2: Documentation Creation (docs-manager Agent)

Pass the gathered file list to `docs-manager` agent to create initial documentation:
- `docs/project-overview-pdr.md`: Project overview and PDR (Product Development Requirements)
- `docs/codebase-summary.md`: Codebase summary
- `docs/code-standards.md`: Codebase structure and code standards
- `docs/system-architecture.md`: System architecture
- Update `README.md` with initial documentation (keep it under 300 lines)

Use `docs/` directory as the source of truth for documentation.

## Phase 3: Size Check (Post-Generation)

After docs-manager completes:
1. Run `wc -l docs/*.md 2>/dev/null | sort -rn` to check LOC
2. Use `docs.maxLoc` from session context (injected via Paths section)
3. For files exceeding limit, warn:
   ```
   ⚠️ {file}: {loc} LOC exceeds limit ({maxLoc})
   Consider: node .claude/scripts/split-large-docs.cjs {file}
   ```
4. Continue (non-blocking)

**IMPORTANT**: **Do not** start implementing.