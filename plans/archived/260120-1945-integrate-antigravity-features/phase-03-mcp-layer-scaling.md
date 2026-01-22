---
title: "Phase 03: MCP Layer Scaling"
description: "Implement Dynamic Tool Catalog, Lazy-Loading for MCP servers, and semantic discovery for 1500+ servers."
status: pending
priority: P1
effort: 10h
branch: feat/antigravity-integration
tags: [mcp, scalability, performance]
created: 2026-01-20
---

# 📜 Phase 03: MCP Layer Scaling

## 🔍 Context Links
- [Researcher Report: MCP & Registry Architecture Analysis](./research/researcher-mcp.md)
- [MCP Manager](../../antigravity/core/mcp_manager.py)

## 📋 Overview
- **Priority**: P1
- **Status**: Pending
- **Description**: Transition from sequential server connections to a lazy-loaded, indexed architecture capable of handling hundreds or thousands of MCP servers.

## 💡 Key Insights
- Connecting to 1500 servers at boot is impossible (memory/latency).
- Most tools are rarely used; lazy loading is mandatory.

## 🎯 Requirements
- **Local Catalog**: Cache tool definitions from all installed MCP servers.
- **Lazy-Load Engine**: Start MCP server processes only when a tool is called.
- **TTL Manager**: Shut down idle server processes.

## 🏗️ Architecture
- **Catalog Indexer**: Periodically probes configured servers for tool definitions and saves to `mcp-catalog.json`.
- **Process Manager**: Handles the lifecycle of `stdio` or `sse` MCP connections with auto-scaling logic.

## 📂 Related Code Files
- `antigravity/core/mcp_manager.py`: Core logic for server installation and management.
- `.claude/skills/mcp-management/scripts/mcp-client.ts`: TypeScript-side connection handling.
- `antigravity/core/knowledge/search_indexing.py`: For semantic tool discovery.

## 🚀 Implementation Steps
1. **Create `MCPToolCatalog`**: Implement a local SQLite or JSON index for tool metadata.
2. **Implement Lazy Resolver**: Update `MCPClientManager` to only spawn processes on-demand.
3. **Build TTL Manager**: Implement a background thread to reap idle MCP processes (e.g., after 5 mins of inactivity).
4. **Semantic Discovery**: Integrate the catalog with the Unified Registry for NLP-based tool finding.

## ✅ Success Criteria
- [ ] CLI boot time remains constant regardless of the number of installed MCP servers.
- [ ] MCP server process starts automatically on tool call.
- [ ] Process is terminated after the configured idle timeout.
- [ ] Win-Win-Win check is performed before installing new MCP servers from untrusted sources.

## ⚠️ Risk Assessment
- **Startup Latency**: The first tool call to a lazy-loaded server will be slower.
- **Resource Exhaustion**: Too many active MCP processes could crash the system (Mitigation: Max concurrent process limit).

## 🔒 Security Considerations
- Sandbox MCP server execution.
- Validate that lazy-loaded servers haven't been tampered with.
