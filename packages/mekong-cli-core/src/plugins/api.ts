/**
 * Plugin API — restricted surface area available to plugins.
 * Permissions gate every capability: filesystem, network, shell, llm, memory.
 */
import type { PluginApi, PluginPermission } from './types.js';
import type { ToolDefinition } from '../types/tool.js';
import type { AgentDefinition } from '../types/agent.js';

export function createPluginApi(
  pluginName: string,
  permissions: PluginPermission[],
  deps: {
    toolRegistry: { register: (t: ToolDefinition) => void };
    agentPool: { registerDefinition: (a: AgentDefinition) => void };
    config: Record<string, unknown>;
    memory: { get: (k: string) => Promise<unknown>; set: (k: string, v: unknown) => Promise<void> };
    eventBus: { emit: (e: string, d?: unknown) => void; on: (e: string, h: (d?: unknown) => void) => void };
    llmRouter: { chat: (req: Record<string, unknown>) => Promise<{ content: string }> };
    logger: Record<string, (msg: string) => void>;
  }
): PluginApi {
  const hasPermission = (p: PluginPermission) => permissions.includes(p);

  return {
    registerTool(tool: ToolDefinition): void {
      deps.toolRegistry.register({ ...tool, name: `plugin.${pluginName}.${tool.name}` });
    },
    registerAgent(agent: AgentDefinition): void {
      deps.agentPool.registerDefinition({ ...agent, name: `plugin.${pluginName}.${agent.name}` });
    },
    getConfig(): Record<string, unknown> {
      if (!hasPermission('filesystem:read')) throw new Error('Permission denied: filesystem:read');
      return deps.config;
    },
    async readMemory(key: string): Promise<unknown> {
      if (!hasPermission('memory:read')) throw new Error('Permission denied: memory:read');
      return deps.memory.get(key);
    },
    async writeMemory(key: string, value: unknown): Promise<void> {
      if (!hasPermission('memory:write')) throw new Error('Permission denied: memory:write');
      return deps.memory.set(key, value);
    },
    emit(event: string, data?: unknown): void {
      deps.eventBus.emit(`plugin.${pluginName}.${event}`, data);
    },
    on(event: string, handler: (data?: unknown) => void): void {
      deps.eventBus.on(event, handler);
    },
    async callLlm(prompt: string, options?: { model?: string; maxTokens?: number }): Promise<string> {
      if (!hasPermission('llm:call')) throw new Error('Permission denied: llm:call');
      const response = await deps.llmRouter.chat({ messages: [{ role: 'user', content: prompt }], ...options });
      return response.content;
    },
    log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
      deps.logger[level]?.(`[plugin:${pluginName}] ${message}`);
    },
  };
}
