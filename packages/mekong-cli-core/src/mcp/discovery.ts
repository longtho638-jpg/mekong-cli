/**
 * MCP Server Discovery — find MCP servers from config and environment.
 * Sources: mekong.yaml mcp.servers[], ~/.mekong/mcp-servers.json, well-known locations.
 */
import type { McpServerConfig } from './types.js';
import type { Result } from '../types/common.js';

/** Discover MCP server configs from all sources */
export async function discoverMcpServers(_configDir: string): Promise<Result<McpServerConfig[]>> {
  throw new Error('Not implemented');
}

/** Read server config from mekong.yaml mcp.servers[] */
export function readConfigServers(_mcpConfig: unknown): McpServerConfig[] {
  throw new Error('Not implemented');
}
