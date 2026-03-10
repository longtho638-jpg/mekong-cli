# Research

## Description
Deep codebase exploration and knowledge retrieval using the Scout engine.

## Implementation
- **Core Logic**: `antigravity/core/scout/engine.py`
- **Knowledge Graph**: `antigravity/core/knowledge_graph.py`

## Capabilities
- **Scout**: Scan files for patterns (TODOs, FIXMEs, security issues)
- **Map**: Generate dependency graphs
- **Query**: Ask semantic questions about the codebase

## Dependencies
- `ripgrep` (via `grep` tool)
- `tree_sitter` (for AST parsing)
