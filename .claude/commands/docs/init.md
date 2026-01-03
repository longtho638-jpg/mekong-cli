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
2. Use `docs.maxLoc` from session context (default: 800)
3. For files exceeding limit:
   - Report which files exceed and by how much
   - docs-manager should have already split proactively per Section 6 guidelines
   - If still oversized, ask user: split now or accept as-is?

**IMPORTANT**: **Do not** start implementing.