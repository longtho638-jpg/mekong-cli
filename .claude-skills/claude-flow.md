# Claude Flow Skill

## Description
Expert orchestration of AI agents using Claude Flow v3.0.0+. Masters hierarchical mesh coordination, swarm intelligence, and memory management.

## Usage
Activate when the user wants to:
- Initialize or manage AI agent swarms
- Coordinate multi-agent tasks
- Manage agent memory or embeddings
- Run system diagnostics for the agentic infrastructure

## Capabilities
- **Swarm Management**: `claude-flow swarm init`, `claude-flow swarm status`
- **Agent Coordination**: `claude-flow agent spawn`, `claude-flow task submit`
- **Memory Operations**: `claude-flow memory search`, `claude-flow embeddings`
- **MCP Integration**: `claude-flow mcp start`, `claude-flow mcp list`
- **Diagnostics**: `claude-flow doctor`, `claude-flow status`

## Examples
- "Initialize a new agent swarm" -> `claude-flow swarm init --v3-mode`
- "Spawn a coder agent" -> `claude-flow agent spawn -t coder`
- "Search memory for auth patterns" -> `claude-flow memory search -q "auth patterns"`
- "Check system health" -> `claude-flow doctor`

## Tooling
This skill primarily uses the `claude-flow` CLI tool.
