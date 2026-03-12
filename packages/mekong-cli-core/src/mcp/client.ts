/**
 * MCP Client — connects to MCP servers via stdio or SSE transport.
 * Protocol: JSON-RPC 2.0 over stdin/stdout or Server-Sent Events.
 * ROI: Engineering ROI — extends mekong-cli with any MCP-compatible tool server.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import type { McpServerConfig, McpTool, McpResource, McpPrompt, McpCallResult } from './types.js';
import { ok, err } from '../types/common.js';
import type { Result } from '../types/common.js';

export class McpClient {
  private process: ChildProcess | null = null;
  private requestId = 0;
  private readonly pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private connected = false;
  private buffer = '';

  constructor(private readonly config: McpServerConfig) {}

  /** Check if connected */
  isConnected(): boolean { return this.connected; }

  /** Connect to MCP server */
  async connect(): Promise<Result<void>> {
    if (this.config.transport === 'stdio') return this.connectStdio();
    return this.connectSse();
  }

  /** Disconnect from server */
  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.connected = false;
    this.pending.clear();
  }

  /** List available tools */
  async listTools(): Promise<Result<McpTool[]>> {
    const res = await this.sendRequest('tools/list', {});
    if (!res.ok) return res as Result<McpTool[]>;
    const data = res.value as { tools?: McpTool[] };
    return ok(data.tools ?? []);
  }

  /** Call a tool */
  async callTool(name: string, args: Record<string, unknown>): Promise<Result<McpCallResult>> {
    return this.sendRequest('tools/call', { name, arguments: args }) as Promise<Result<McpCallResult>>;
  }

  /** List resources */
  async listResources(): Promise<Result<McpResource[]>> {
    const res = await this.sendRequest('resources/list', {});
    if (!res.ok) return res as Result<McpResource[]>;
    const data = res.value as { resources?: McpResource[] };
    return ok(data.resources ?? []);
  }

  /** Read a resource */
  async readResource(uri: string): Promise<Result<McpCallResult>> {
    return this.sendRequest('resources/read', { uri }) as Promise<Result<McpCallResult>>;
  }

  /** List prompts */
  async listPrompts(): Promise<Result<McpPrompt[]>> {
    const res = await this.sendRequest('prompts/list', {});
    if (!res.ok) return res as Result<McpPrompt[]>;
    const data = res.value as { prompts?: McpPrompt[] };
    return ok(data.prompts ?? []);
  }

  /** Get a prompt */
  async getPrompt(name: string, args?: Record<string, string>): Promise<Result<McpCallResult>> {
    return this.sendRequest('prompts/get', { name, arguments: args }) as Promise<Result<McpCallResult>>;
  }

  /** Connect via stdio — spawn process, JSON-RPC over stdin/stdout */
  private async connectStdio(): Promise<Result<void>> {
    if (!this.config.command) {
      return err(new Error('stdio transport requires "command" in config'));
    }

    try {
      const proc = spawn(this.config.command, this.config.args ?? [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...this.config.env },
      });

      this.process = proc;

      proc.stdout!.on('data', (chunk: Buffer) => {
        this.buffer += chunk.toString();
        this.processBuffer();
      });

      proc.on('error', (e) => {
        this.connected = false;
        this.rejectAll(e);
      });

      proc.on('exit', () => {
        this.connected = false;
      });

      // Send initialize handshake
      const initResult = await this.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'mekong-cli', version: '0.3.0' },
      });

      if (!initResult.ok) return err(initResult.error);
      this.connected = true;

      // Send initialized notification (no response expected)
      this.sendNotification('notifications/initialized', {});
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /** Connect via SSE — not yet supported, placeholder */
  private async connectSse(): Promise<Result<void>> {
    return err(new Error('SSE transport not yet implemented. Use stdio.'));
  }

  /** Send JSON-RPC request and wait for response */
  private sendRequest(method: string, params: unknown): Promise<Result<unknown>> {
    return new Promise((resolve) => {
      if (!this.process?.stdin?.writable && method !== 'initialize') {
        resolve(err(new Error('Not connected to MCP server')));
        return;
      }

      const id = ++this.requestId;
      const message = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';

      const timeout = setTimeout(() => {
        this.pending.delete(id);
        resolve(err(new Error(`Request ${method} timed out after 30s`)));
      }, 30000);

      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          this.pending.delete(id);
          resolve(ok(value));
        },
        reject: (error) => {
          clearTimeout(timeout);
          this.pending.delete(id);
          resolve(err(error));
        },
      });

      this.process?.stdin?.write(message);
    });
  }

  /** Send JSON-RPC notification (no response expected) */
  private sendNotification(method: string, params: unknown): void {
    const message = JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n';
    this.process?.stdin?.write(message);
  }

  /** Process incoming buffer for complete JSON-RPC messages */
  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line) as { id?: number; result?: unknown; error?: { message: string } };
        if (msg.id !== undefined) {
          const pending = this.pending.get(msg.id);
          if (pending) {
            if (msg.error) {
              pending.reject(new Error(msg.error.message));
            } else {
              pending.resolve(msg.result);
            }
          }
        }
      } catch {
        // skip malformed JSON lines
      }
    }
  }

  /** Reject all pending requests */
  private rejectAll(error: Error): void {
    for (const [, p] of this.pending) {
      p.reject(error);
    }
    this.pending.clear();
  }
}
