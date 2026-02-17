// ===========================================
// 🦞 OPENCLAW AGENTS — AI AGENT FRAMEWORK
// ===========================================

/**
 * Base Agent interface for all OpenClaw agents.
 * Each agent is autonomous, self-monitoring, and ROI-focused.
 */
export interface AgentConfig {
    id: string;
    name: string;
    description: string;
    strategy: "conservative" | "balanced" | "aggressive";
    enabled: boolean;
}

export interface AgentResult {
    agentId: string;
    success: boolean;
    data: Record<string, unknown>;
    executionTimeMs: number;
    timestamp: string;
}

/**
 * Base class for OpenClaw autonomous agents.
 */
export abstract class BaseAgent {
    protected config: AgentConfig;

    constructor(config: AgentConfig) {
        this.config = config;
    }

    abstract execute(): Promise<AgentResult>;

    getStatus(): { id: string; name: string; enabled: boolean } {
        return {
            id: this.config.id,
            name: this.config.name,
            enabled: this.config.enabled,
        };
    }
}

/**
 * Sample ROI Scanner Agent
 * Demonstrates the agent pattern for future implementations.
 */
export class ROIScannerAgent extends BaseAgent {
    constructor() {
        super({
            id: "openclaw-roi-scanner",
            name: "ROI Scanner",
            description: "Scans markets and calculates potential ROI opportunities",
            strategy: "balanced",
            enabled: true,
        });
    }

    async execute(): Promise<AgentResult> {
        const start = Date.now();

        // Simulated ROI calculation
        const roiScore = Math.random() * 100;
        const recommendation =
            roiScore > 70 ? "STRONG_BUY" : roiScore > 40 ? "HOLD" : "WAIT";

        return {
            agentId: this.config.id,
            success: true,
            data: {
                roiScore: Math.round(roiScore * 100) / 100,
                recommendation,
                analyzedAt: new Date().toISOString(),
                confidence: `${Math.round(85 + Math.random() * 15)}%`,
            },
            executionTimeMs: Date.now() - start,
            timestamp: new Date().toISOString(),
        };
    }
}

import { MarketAnalyzerAgent } from "./market-analyzer";
export { MarketAnalyzerAgent };

/**
 * Agent Registry — manages all deployed agents.
 */
export class AgentRegistry {
    private agents: Map<string, BaseAgent> = new Map();

    register(agent: BaseAgent): void {
        const status = agent.getStatus();
        this.agents.set(status.id, agent);
        console.log(`🦞 Agent registered: ${status.name} (${status.id})`);
    }

    async executeAll(): Promise<AgentResult[]> {
        const results: AgentResult[] = [];
        for (const [, agent] of this.agents) {
            if (agent.getStatus().enabled) {
                const result = await agent.execute();
                results.push(result);
            }
        }
        return results;
    }

    listAgents(): { id: string; name: string; enabled: boolean }[] {
        return Array.from(this.agents.values()).map((a) => a.getStatus());
    }
}

// Default export: ready-to-use registry with sample agents
export function createDefaultRegistry(): AgentRegistry {
    const registry = new AgentRegistry();
    registry.register(new ROIScannerAgent());
    registry.register(new MarketAnalyzerAgent());
    return registry;
}
