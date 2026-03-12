import type { Id, Timestamp } from '../types/common.js';
import type { ToolDefinition } from '../types/tool.js';
import type { AgentDefinition } from '../types/agent.js';

/** Plugin manifest — entry point for a plugin */
export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  mekongVersion: string;
  provides: {
    tools?: string[];
    agents?: string[];
    sops?: string[];
    commands?: string[];
    hooks?: string[];
    integrations?: string[];
  };
  requires: {
    integrations?: string[];
    tools?: string[];
    config?: string[];
  };
  main: string;
  permissions: PluginPermission[];
}

export type PluginPermission =
  | 'filesystem:read'
  | 'filesystem:write'
  | 'network:outbound'
  | 'shell:execute'
  | 'llm:call'
  | 'integrations:access'
  | 'memory:read'
  | 'memory:write';

/** Plugin lifecycle hooks */
export interface PluginHooks {
  onLoad?(): Promise<void>;
  beforeSopRun?(sopName: string, inputs: Record<string, unknown>): Promise<void>;
  afterSopRun?(sopName: string, result: unknown): Promise<void>;
  beforeAgentTask?(agentName: string, task: string): Promise<void>;
  afterAgentTask?(agentName: string, task: string, result: unknown): Promise<void>;
  beforeToolCall?(toolName: string, params: Record<string, unknown>): Promise<Record<string, unknown>>;
  onHeartbeat?(): Promise<void>;
  onUnload?(): Promise<void>;
}

/** Plugin API — what plugins can access */
export interface PluginApi {
  registerTool(tool: ToolDefinition): void;
  registerAgent(agent: AgentDefinition): void;
  getConfig(): Record<string, unknown>;
  readMemory(key: string): Promise<unknown>;
  writeMemory(key: string, value: unknown): Promise<void>;
  emit(event: string, data?: unknown): void;
  on(event: string, handler: (data?: unknown) => void): void;
  callLlm(prompt: string, options?: { model?: string; maxTokens?: number }): Promise<string>;
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void;
}

/** Runtime plugin instance */
export interface PluginInstance {
  manifest: PluginManifest;
  hooks: PluginHooks;
  enabled: boolean;
  loadedAt: Timestamp;
  errors: string[];
}
