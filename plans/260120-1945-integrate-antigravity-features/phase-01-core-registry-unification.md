---
title: "Phase 01: Core Registry Unification"
description: "Bridge Python and MCP registries, consolidate command dispatch, and implement a unified discovery API."
status: pending
priority: P1
effort: 8h
branch: feat/antigravity-integration
tags: [architecture, registry, unified-api]
created: 2026-01-20
---

# 📜 Phase 01: Core Registry Unification

## 🔍 Context Links
- [Researcher Report: MCP & Registry Architecture Analysis](./research/researcher-mcp.md)
- [Antigravity Registry Module](../../antigravity/core/registry/)

## 📋 Overview
- **Priority**: P1
- **Status**: Pending
- **Description**: Currently, Python commands and MCP tools exist in separate silos. This phase creates a "Bridge" that allows the `Orchestrator` to resolve any capability regardless of its source (native Python or MCP).

## 💡 Key Insights
- The current `Registry` in `antigravity/core/registry/` is modular but static.
- `api.py` should act as the primary gateway for all command resolutions.

## 🎯 Requirements
- Unified lookup for `suite:command` and `mcp:tool`.
- Support for capability-based discovery (e.g., "find a tool that can analyze PDFs").
- Backward compatibility with existing YAML chains.

## 🏗️ Architecture
- **Unified Registry Gateway**: A singleton `RegistryGateway` that queries both `PythonCommandStore` and `MCPToolCatalog`.
- **Bridge Pattern**: Decouple command definition from execution.

## 📂 Related Code Files
- `antigravity/core/registry/api.py`: Primary entry point for resolution.
- `antigravity/core/registry/discovery.py`: Search and capability matching logic.
- `antigravity/core/registry/store.py`: Persistence for command mappings.
- `antigravity/core/mcp_manager.py`: Bridge to MCP tool definitions.

## 🚀 Implementation Steps
1. **Refactor `RegistryStore`**: Update `store.py` to support dynamic registration from multiple sources.
2. **Implement Bridge in `api.py`**: Create a resolver that checks internal commands first, then queries the MCP catalog.
3. **Enhance Discovery**: Implement keyword/semantic search in `discovery.py` to find tools by description.
4. **Update CLI Dispatcher**: Ensure `cli/commands/` uses the unified API for all executions.

## ✅ Success Criteria
- [ ] `registry.resolve("dev:fix")` returns a Python handler.
- [ ] `registry.resolve("mcp:fetch-url")` returns an MCP tool handler.
- [ ] Capability search returns both Python and MCP options.
- [ ] 100% pass on registry unit tests.

## ⚠️ Risk Assessment
- **Name Collisions**: Potential for suite name overlap between native and MCP tools.
- **Resolution Latency**: Large registries might slow down command startup (Mitigation: Lazy loading).

## 🔒 Security Considerations
- Ensure MCP tool execution respects the same permission model as native commands.
- Validate inputs for dynamically resolved tools.
