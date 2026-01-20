/**
 * 🟣 Saturn - VIBE Agents Types
 */
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
