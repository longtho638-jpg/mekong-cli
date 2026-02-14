
/**
 * Agent Type Definitions
 * Standard protocol for all 24 skill agents
 */

export interface AgentInput {
  // Agent-specific input fields
  [key: string]: any;

  // Context from previous agents
  context?: AgentContext;
}

export interface AgentContext {
  previousOutputs: Map<string, any>;
  businessPlanDraft: Partial<any>;
  executionState: any;
}

export interface AgentOutput {
  skillId: string;
  skillName: string;
  generatedAt: string;
  status: 'success' | 'partial' | 'failed';
  data: any;
  metadata: AgentMetadata;
  errors?: string[];
  warnings?: string[];
}

export interface AgentMetadata {
  markings: {
    fromPlan: string[];
    suggestions: string[];
    assumptions: string[];
  };
  dependenciesUsed: string[];
  executionTime: number;
  dataQuality: 'high' | 'medium' | 'low';
  configSnapshot?: any;
}

export interface AgentTask {
  skillId: string;
  name: string;
  description: string;
  input: any;
  dependencies: string[];
  priority: number;
}

export interface AgentCapability {
  skillId: string;
  name: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
  dependencies: string[];
  estimatedDuration: number;
}
