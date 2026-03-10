# n8n MCP Skill

## Description
Integration with n8n workflow automation platform via Model Context Protocol (MCP). access documentation, nodes, and templates from n8n.

## Usage
Activate when the user wants to:
- Search n8n documentation
- Find n8n nodes and integrations
- Query n8n workflow templates
- Understand n8n capabilities

## Capabilities
- **Documentation Search**: Search official n8n docs
- **Node Discovery**: Find available nodes and their parameters
- **Template Search**: Find ready-to-use workflow templates
- **Integration Info**: Get details on specific service integrations

## Tooling
This skill uses the `n8n-mcp` MCP server tools:
- `n8n-mcp/search_docs`: Search documentation
- `n8n-mcp/search_nodes`: Search available nodes
- `n8n-mcp/search_templates`: Search templates
- `n8n-mcp/get_node`: Get details for a specific node
- `n8n-mcp/get_template`: Get details for a specific template

## Configuration
Ensure `n8n-mcp` is configured in your MCP settings file.
