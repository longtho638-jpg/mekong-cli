/**
 * MCP Tool Adapter — adapts McpTool definitions to mekong ToolDefinition format.
 * Prefixes tool names: mcp.{serverName}.{toolName}
 */
import type { McpTool } from './types.js';
import type { ToolDefinition } from '../types/tool.js';
import type { McpClient } from './client.js';

/** Adapt a single MCP tool to a mekong ToolDefinition */
export function adaptMcpTool(
  serverName: string,
  tool: McpTool,
  client: McpClient,
): ToolDefinition {
  throw new Error('Not implemented');
}

/** Adapt all tools from a server */
export function adaptAllMcpTools(
  serverName: string,
  tools: McpTool[],
  client: McpClient,
): ToolDefinition[] {
  return tools.map(tool => adaptMcpTool(serverName, tool, client));
}
