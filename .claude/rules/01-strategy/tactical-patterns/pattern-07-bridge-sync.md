# Tactical Pattern 07: Bridge Synchronization

> **Consistency is Power**

## Context
Managing the dual-brain system (Claude + Gemini).

## Pattern
1. **Check**: Run `scripts/verify_all_mcp.py` to check server status.
2. **Compare**: Check agent counts in `bridge-sync.md`.
3. **Sync**: If Gemini has new capabilities, update `.claude/mcp-catalog.json`.
4. **Deploy**: Ensure both sides have access to the same tools (via MCP).

## Goal
Unified intelligence, no capability gaps.
