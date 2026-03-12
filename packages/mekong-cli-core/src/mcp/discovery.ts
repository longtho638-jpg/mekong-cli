/**
 * MCP Server Discovery — find MCP servers from config files and environment.
 * ROI: Engineering ROI — auto-discover MCP servers without manual wiring.
 * Sources: {configDir}/mcp-servers.json, {configDir}/mcp.json, well-known paths.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { McpServerConfig } from './types.js';
import { ok, err } from '../types/common.js';
import type { Result } from '../types/common.js';

/** Well-known config file names to check */
const CONFIG_FILES = ['mcp-servers.json', 'mcp.json'];

/** Discover MCP server configs from config directory */
export async function discoverMcpServers(configDir: string): Promise<Result<McpServerConfig[]>> {
  const allConfigs: McpServerConfig[] = [];
  const errors: string[] = [];

  for (const filename of CONFIG_FILES) {
    const filePath = join(configDir, filename);
    try {
      const content = await readFile(filePath, 'utf-8');
      const parsed: unknown = JSON.parse(content);
      const configs = readConfigServers(parsed);
      allConfigs.push(...configs);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
        errors.push(`${filename}: ${(e as Error).message}`);
      }
      // ENOENT is expected — file simply doesn't exist
    }
  }

  if (allConfigs.length === 0 && errors.length > 0) {
    return err(new Error(`Failed to read MCP configs: ${errors.join('; ')}`));
  }

  return ok(allConfigs);
}

/** Parse server configs from a JSON config object.
 * Supports two formats:
 * 1. { "mcpServers": { "name": { command, args, env } } } (Claude Desktop format)
 * 2. { "servers": [ { name, transport, command, args } ] } (array format)
 */
export function readConfigServers(mcpConfig: unknown): McpServerConfig[] {
  if (!mcpConfig || typeof mcpConfig !== 'object') return [];
  const configs: McpServerConfig[] = [];
  const obj = mcpConfig as Record<string, unknown>;

  // Format 1: Claude Desktop style { mcpServers: { name: { command, args } } }
  if (obj.mcpServers && typeof obj.mcpServers === 'object') {
    const servers = obj.mcpServers as Record<string, Record<string, unknown>>;
    for (const [name, server] of Object.entries(servers)) {
      if (!server || typeof server !== 'object') continue;
      configs.push({
        name,
        transport: (server.transport as 'stdio' | 'sse') ?? 'stdio',
        command: server.command as string | undefined,
        args: server.args as string[] | undefined,
        env: server.env as Record<string, string> | undefined,
        url: server.url as string | undefined,
        headers: server.headers as Record<string, string> | undefined,
      });
    }
  }

  // Format 2: Array style { servers: [ { name, transport, ... } ] }
  if (Array.isArray(obj.servers)) {
    for (const server of obj.servers) {
      if (!server || typeof server !== 'object') continue;
      const s = server as Record<string, unknown>;
      if (typeof s.name !== 'string') continue;
      configs.push({
        name: s.name,
        transport: (s.transport as 'stdio' | 'sse') ?? 'stdio',
        command: s.command as string | undefined,
        args: s.args as string[] | undefined,
        env: s.env as Record<string, string> | undefined,
        url: s.url as string | undefined,
        headers: s.headers as Record<string, string> | undefined,
      });
    }
  }

  return configs;
}
