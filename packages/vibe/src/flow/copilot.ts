/**
 * 🎨 VIBE Flow - Copilot logic
 */
import { Workflow } from './types';
import { VibeFlow } from './builder';

export interface CopilotSuggestion {
  type: "add_node" | "connect" | "fix" | "optimize";
  description: string;
  action: () => void;
}

export class FlowCopilot {
  async suggest(workflow: Workflow, prompt: string): Promise<CopilotSuggestion[]> {
    return [{ type: "add_node", description: `Add agent node for: ${prompt}`, action: () => {} }];
  }

  async generateFromPrompt(prompt: string): Promise<Workflow> {
    const flow = new VibeFlow();
    return flow.create(`Generated: ${prompt}`);
  }
}
