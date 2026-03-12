/**
 * MCP Server Manager — manage multiple MCP server connections.
 * Reads config from mekong.yaml mcp.servers[] section.
 */
import type { McpServerConfig, McpServerState, McpTool } from './types.js';
import type { McpClient } from './client.js';
import type { ToolDefinition } from '../types/tool.js';
import type { Result } from '../types/common.js';

export class McpServerManager {
  private readonly clients = new Map<string, McpClient>();
  private readonly states = new Map<string, McpServerState>();

  /** Connect to all configured servers */
  async connectAll(_configs: McpServerConfig[]): Promise<void> {
    throw new Error('Not implemented');
  }

  /** Connect to a specific server */
  async connect(_config: McpServerConfig): Promise<Result<McpServerState>> {
    throw new Error('Not implemented');
  }

  /** Disconnect from a server */
  async disconnect(_name: string): Promise<void> {
    throw new Error('Not implemented');
  }

  /** Get all available tools across all connected servers */
  getAllTools(): McpTool[] {
    throw new Error('Not implemented');
  }

  /** Convert MCP tools to mekong ToolDefinitions (prefixed: mcp.{server}.{tool}) */
  toToolDefinitions(): ToolDefinition[] {
    throw new Error('Not implemented');
  }

  /** Get all server states */
  getStates(): McpServerState[] {
    return Array.from(this.states.values());
  }

  /** Health check all servers */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    throw new Error('Not implemented');
  }
}
