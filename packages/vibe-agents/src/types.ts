/**
 * 🟣 Saturn - VIBE Agents Types
 */
export abstract class BaseAgent {
    public logs: any[] = [];
    constructor(public id: string, public definition: AgentDefinition) {}
    abstract execute(input: AgentInput): Promise<AgentResult>;

    log(action: string, inputs: any, outputs: any) {
        this.logs.push({
            action,
            inputs: typeof inputs === 'object' ? inputs : { value: inputs },
            outputs: typeof outputs === 'object' ? outputs : { value: outputs },
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
