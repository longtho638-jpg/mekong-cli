/**
 * 🟣 Saturn - VIBE Agents Orchestrator
 */
import { AgentPhase, AgentDefinition, BaseAgent, AgentInput, AgentResult } from './types';
import { AGENT_REGISTRY } from './registry';

export class AgentOrchestrator {
    private agents: Map<string, BaseAgent> = new Map();

    register(agent: BaseAgent): void {
        this.agents.set(agent.id, agent);
    }

    getAgent(id: string): BaseAgent | undefined {
        return this.agents.get(id);
    }

    getAgentsByPhase(phase: AgentPhase): BaseAgent[] {
        return Array.from(this.agents.values()).filter(a => a.definition.phase === phase);
    }

    async executeWorkflow(phase: AgentPhase, input: AgentInput): Promise<AgentResult[]> {
        const agents = this.getAgentsByPhase(phase);
        const results: AgentResult[] = [];
        for (const agent of agents) {
            const result = await agent.execute(input);
            results.push(result);
            if (!result.success) break;
        }
        return results;
    }

    getRegistry(): AgentDefinition[] { return AGENT_REGISTRY; }
}

export const orchestrator = new AgentOrchestrator();
