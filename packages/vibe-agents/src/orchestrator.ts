/**
 * 🟣 Saturn - VIBE Agents Orchestrator
 */
import { AgentPhase, AgentDefinition, BaseAgent } from './types'; // BaseAgent mock
import { AGENT_REGISTRY } from './registry';

export class AgentOrchestrator {
    getRegistry(): AgentDefinition[] { return AGENT_REGISTRY; }
}

export const orchestrator = new AgentOrchestrator();
