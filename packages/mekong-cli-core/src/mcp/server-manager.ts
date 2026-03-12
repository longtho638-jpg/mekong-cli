/**
 * MCP Server Manager — manage multiple MCP server connections.
 * ROI: Engineering ROI — unified interface to connect/manage all MCP servers.
 */
import type { McpServerConfig, McpServerState, McpTool } from './types.js';
import { McpClient } from './client.js';
import type { ToolDefinition } from '../types/tool.js';
import { ok, err } from '../types/common.js';
import type { Result } from '../types/common.js';
import { adaptAllMcpTools } from './tool-adapter.js';

export class McpServerManager {
  private readonly clients = new Map<string, McpClient>();
  private readonly states = new Map<string, McpServerState>();

  /** Connect to all configured servers (best-effort, continues on individual failures) */
  async connectAll(configs: McpServerConfig[]): Promise<void> {
    const results = await Promise.allSettled(
      configs.map(config => this.connect(config))
    );
    // Log failures but don't throw — partial connectivity is acceptable
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'rejected') {
        const name = configs[i].name;
        this.states.set(name, {
          config: configs[i],
          connected: false,
          tools: [],
          resources: [],
          prompts: [],
          error: String(r.reason),
        });
      }
    }
  }

  /** Connect to a specific server */
  async connect(config: McpServerConfig): Promise<Result<McpServerState>> {
    // Disconnect existing connection if any
    if (this.clients.has(config.name)) {
      await this.disconnect(config.name);
    }

    const client = new McpClient(config);
    const connectResult = await client.connect();

    if (!connectResult.ok) {
      const state: McpServerState = {
        config,
        connected: false,
        tools: [],
        resources: [],
        prompts: [],
        error: connectResult.error.message,
      };
      this.states.set(config.name, state);
      return err(connectResult.error);
    }

    // Discover capabilities
    const [toolsRes, resourcesRes, promptsRes] = await Promise.all([
      client.listTools(),
      client.listResources(),
      client.listPrompts(),
    ]);

    const state: McpServerState = {
      config,
      connected: true,
      tools: toolsRes.ok ? toolsRes.value : [],
      resources: resourcesRes.ok ? resourcesRes.value : [],
      prompts: promptsRes.ok ? promptsRes.value : [],
      lastPing: new Date().toISOString(),
    };

    this.clients.set(config.name, client);
    this.states.set(config.name, state);
    return ok(state);
  }

  /** Disconnect from a server */
  async disconnect(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      await client.disconnect();
      this.clients.delete(name);
    }
    this.states.delete(name);
  }

  /** Disconnect all servers */
  async disconnectAll(): Promise<void> {
    const names = Array.from(this.clients.keys());
    await Promise.all(names.map(name => this.disconnect(name)));
  }

  /** Get all available tools across all connected servers */
  getAllTools(): McpTool[] {
    const tools: McpTool[] = [];
    for (const state of this.states.values()) {
      if (state.connected) {
        tools.push(...state.tools);
      }
    }
    return tools;
  }

  /** Convert MCP tools to mekong ToolDefinitions (prefixed: mcp.{server}.{tool}) */
  toToolDefinitions(): ToolDefinition[] {
    const defs: ToolDefinition[] = [];
    for (const [name, state] of this.states.entries()) {
      if (!state.connected) continue;
      const client = this.clients.get(name);
      if (!client) continue;
      defs.push(...adaptAllMcpTools(name, state.tools, client));
    }
    return defs;
  }

  /** Get all server states */
  getStates(): McpServerState[] {
    return Array.from(this.states.values());
  }

  /** Get a specific client by server name */
  getClient(name: string): McpClient | undefined {
    return this.clients.get(name);
  }

  /** Health check all servers by attempting listTools on each */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const [name, client] of this.clients.entries()) {
      if (!client.isConnected()) {
        results[name] = false;
        continue;
      }
      const res = await client.listTools();
      results[name] = res.ok;
      // Update state
      const state = this.states.get(name);
      if (state) {
        state.lastPing = new Date().toISOString();
        if (!res.ok) {
          state.connected = false;
          state.error = 'Health check failed';
        }
      }
    }
    return results;
  }
}
