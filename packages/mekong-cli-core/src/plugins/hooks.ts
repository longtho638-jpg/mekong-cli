/**
 * Plugin Hooks — lifecycle hook dispatcher.
 * Wraps PluginLoader.dispatchHook with typed convenience methods.
 */
import type { PluginHooks } from './types.js';
import type { PluginLoader } from './loader.js';

export class PluginHookDispatcher {
  constructor(private readonly loader: PluginLoader) {}

  async onLoad(): Promise<void> {
    await this.loader.dispatchHook('onLoad');
  }

  async beforeSopRun(sopName: string, inputs: Record<string, unknown>): Promise<void> {
    await this.loader.dispatchHook('beforeSopRun', sopName, inputs);
  }

  async afterSopRun(sopName: string, result: unknown): Promise<void> {
    await this.loader.dispatchHook('afterSopRun', sopName, result);
  }

  async beforeAgentTask(agentName: string, task: string): Promise<void> {
    await this.loader.dispatchHook('beforeAgentTask', agentName, task);
  }

  async afterAgentTask(agentName: string, task: string, result: unknown): Promise<void> {
    await this.loader.dispatchHook('afterAgentTask', agentName, task, result);
  }

  async onHeartbeat(): Promise<void> {
    await this.loader.dispatchHook('onHeartbeat');
  }

  async onUnload(): Promise<void> {
    await this.loader.dispatchHook('onUnload');
  }
}
