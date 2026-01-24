/**
 * 🟣 Saturn - VIBE Agents Types
 */
export interface LogEntry {
    action: string;
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
    timestamp: number;
}

export abstract class BaseAgent {
    public logs: LogEntry[] = [];
    constructor(public id: string, public definition: AgentDefinition) {}
    abstract execute(input: AgentInput): Promise<AgentResult>;

    log(action: string, inputs: unknown, outputs: unknown) {
        this.logs.push({
            action,
            inputs: (inputs && typeof inputs === 'object') ? (inputs as Record<string, unknown>) : { value: inputs },
            outputs: (outputs && typeof outputs === 'object') ? (outputs as Record<string, unknown>) : { value: outputs },
            timestamp: Date.now()
        });
    }

    getLogs() {
        return this.logs;
    }
}

export type AgentPhase = 'plan' | 'code' | 'ship';

export interface AgentDefinition {
    id: string;
    name: string;
    description: string;
    phase: AgentPhase;
    capabilities: string[];
    successKpis: string[];
}

export interface AgentInput {
    command: string;
    context: Record<string, unknown>;
}

export interface AgentResult {
    success: boolean;
    output: string;
    duration: number;
}
