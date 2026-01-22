# Researcher Report: MCP & Registry Architecture Analysis

**Date**: 2026-01-20
**Researcher**: Antigravity researcher

## 1. Current State Assessment

### 1.1 MCP Implementation
- **Core Server**: `antigravity/mcp_server/server.py` implements a native MCP server that exposes internal modules (RevenueEngine, ClientMagnet, etc.) as tools.
- **Lifecycle Management**: `antigravity/core/mcp_manager.py` handles installation from Git URLs, npm packages, and specialized setups (e.g., Supabase). It uses `.claude/mcp.json` for configuration.
- **Client Side**: `.claude/skills/mcp-management/scripts/mcp-client.ts` provides a robust TypeScript manager for connecting to multiple servers, listing tools/prompts/resources, and handling tool calls.
- **CLI Commands**: `cli/commands/mcp.py` provides user-facing commands for setup and installation.

### 1.2 Registry Architecture
- **Command Registry**: `antigravity/core/registry/` uses a modularized approach (`store.py`, `api.py`, `discovery.py`, `metadata.py`).
    - **Structure**: Static dictionary mapping "suites" (e.g., `revenue`, `dev`) to subcommands and their backing Python modules/agents.
    - **Resolution**: Supports `suite:sub` format and shortcuts (aliases).
- **Agent Registry**: `antigravity/core/agent_swarm/registry.py` manages `SwarmAgent` instances, tracking their roles, handlers, and specialties.
- **Control Orchestration**: `antigravity/core/control/orchestration/orchestrator.py` manages feature flags and circuit breakers, ensuring system stability.

## 2. Gaps for "1500+ MCP Servers" Capability
- **Static Configuration**: The `COMMAND_REGISTRY` is hardcoded. Scaling to 1500+ items requires a dynamic indexing/catalog system.
- **Sequential Connection**: The current `MCPClientManager` connects to all configured servers sequentially at startup, which will not scale to hundreds or thousands of servers.
- **Discovery Mechanism**: Lack of a "Registry Discovery" service that can search across a large index of available MCP tools based on semantic meaning or keywords.
- **Resource Management**: No lazy-loading or auto-termination for idle MCP server processes.

## 3. Proposed Strategy: "The MCP Layer"

### Phase 1: Dynamic Tool Discovery (The Catalog)
- **Implement `MCPToolCatalog`**: A local cache/index of all available MCP tools across all installed servers.
- **Semantic Indexing**: Use a small embedding model or keyword search index to map user intent to specific MCP tools.

### Phase 2: Lazy-Load Orchestration
- **On-Demand Activation**: Only start an MCP server process when a tool from that server is actually requested by an agent.
- **TTL (Time-To-Live)**: Automatically shut down MCP server processes after a period of inactivity to save system resources.

### Phase 3: Unified Registry Integration
- **Bridge Pattern**: Update `antigravity.core.registry.api` to resolve both native Python commands and dynamic MCP tools seamlessly.
- **Agent Tool Injection**: Allow agents to "subscribe" to capabilities. Instead of hardcoding tools, agents query the Registry for tools matching their "specialty".

### Phase 4: Scaling to 1500+
- **External Catalog Integration**: Support fetching tool definitions from a remote "Antigravity Hub" without installing the full package until needed.
- **NPA (Node Package Advisor)**: A mechanism to suggest and auto-install MCP servers from npm/git when a required capability is missing.
