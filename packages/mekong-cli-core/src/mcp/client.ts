/**
 * MCP Client — connects to MCP servers via stdio or SSE transport.
 * Protocol: https://modelcontextprotocol.io/specification
 */
import { spawn, type ChildProcess } from 'node:child_process';
import type { McpServerConfig, McpTool, McpResource, McpPrompt, McpCallResult } from './types.js';
import type { Result } from '../types/common.js';

export class McpClient {
  private process: ChildProcess | null = null;
  private requestId = 0;
  private readonly pendingRequests = new Map<number, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>();
  private connected = false;

  constructor(private readonly config: McpServerConfig) {}

  /** Connect to MCP server */
  async connect(): Promise<Result<void>> {
    if (this.config.transport === 'stdio') {
      return this.connectStdio();
    }
    return this.connectSse();
  }

  /** Disconnect from server */
  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.connected = false;
  }

  /** List available tools */
  async listTools(): Promise<Result<McpTool[]>> {
    return this.sendRequest('tools/list', {}) as Promise<Result<McpTool[]>>;
  }

  /** Call a tool */
  async callTool(name: string, arguments_: Record<string, unknown>): Promise<Result<McpCallResult>> {
    return this.sendRequest('tools/call', { name, arguments: arguments_ }) as Promise<Result<McpCallResult>>;
  }

  /** List resources */
  async listResources(): Promise<Result<McpResource[]>> {
    return this.sendRequest('resources/list', {}) as Promise<Result<McpResource[]>>;
  }

  /** Read a resource */
  async readResource(uri: string): Promise<Result<McpCallResult>> {
    return this.sendRequest('resources/read', { uri }) as Promise<Result<McpCallResult>>;
  }

  /** List prompts */
  async listPrompts(): Promise<Result<McpPrompt[]>> {
    return this.sendRequest('prompts/list', {}) as Promise<Result<McpPrompt[]>>;
  }

  /** Get a prompt */
  async getPrompt(name: string, arguments_?: Record<string, string>): Promise<Result<McpCallResult>> {
    return this.sendRequest('prompts/get', { name, arguments: arguments_ }) as Promise<Result<McpCallResult>>;
  }

  private async connectStdio(): Promise<Result<void>> {
    throw new Error('Not implemented');
  }

  private async connectSse(): Promise<Result<void>> {
    throw new Error('Not implemented');
  }

  private async sendRequest(_method: string, _params: unknown): Promise<Result<unknown>> {
    throw new Error('Not implemented');
  }
}
