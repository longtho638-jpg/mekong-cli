/**
 * 🎨 VIBE Flow - Visual Workflow Builder
 *
 * Inspired by SimStudio architecture:
 * - Visual canvas workflow design
 * - ReactFlow-based node editor
 * - Agent/Tool/Block connections
 */

// ============================================
// NODE TYPES (SimStudio-inspired)
// ============================================

export type NodeType =
  | "agent" // AI Agent node
  | "tool" // External tool
  | "trigger" // Start trigger
  | "condition" // If/else logic
  | "transform" // Data transform
  | "output" // Final output
  | "loop" // Iteration
  | "human"; // Human-in-loop

export interface FlowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    config: Record<string, unknown>;
    planet?: string; // Link to VIBE planet
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// PLANET → NODE MAPPING
// ============================================

export const PLANET_NODES: Record<string, NodeType[]> = {
  saturn: ["agent"], // AI Agents
  jupiter: ["trigger", "output"], // CRM triggers
  mars: ["tool"], // Ops tools
  earth: ["transform"], // Dev transforms
  mercury: ["trigger"], // Marketing triggers
  neptune: ["output"], // Finance outputs
  venus: ["human"], // UI/Human interaction
  uranus: ["condition"], // Data conditions
};

// ============================================
// WORKFLOW BUILDER
// ============================================

export class VibeFlow {
  private workflows: Map<string, Workflow> = new Map();

  // Create new workflow
  create(name: string, description?: string): Workflow {
    const workflow: Workflow = {
      id: `wf_${Date.now()}`,
      name,
      description,
      nodes: [],
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  // Add node to workflow
  addNode(
    workflowId: string,
    node: Omit<FlowNode, "id">,
  ): FlowNode | undefined {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return undefined;

    const newNode: FlowNode = {
      ...node,
      id: `node_${Date.now()}`,
    };
    workflow.nodes.push(newNode);
    workflow.updatedAt = new Date();
    return newNode;
  }

  // Connect nodes
  connect(
    workflowId: string,
    sourceId: string,
    targetId: string,
    label?: string,
  ): FlowEdge | undefined {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return undefined;

    const edge: FlowEdge = {
      id: `edge_${Date.now()}`,
      source: sourceId,
      target: targetId,
      label,
    };
    workflow.edges.push(edge);
    workflow.updatedAt = new Date();
    return edge;
  }

  // Get workflow
  get(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  // Export for ReactFlow
  toReactFlow(
    workflowId: string,
  ): { nodes: unknown[]; edges: unknown[] } | undefined {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return undefined;

    return {
      nodes: workflow.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })),
      edges: workflow.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
      })),
    };
  }

  // Execute workflow
  async execute(
    workflowId: string,
    input: Record<string, unknown>,
  ): Promise<{
    success: boolean;
    output: unknown;
    trace: string[];
  }> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return { success: false, output: null, trace: ["Workflow not found"] };
    }

    const trace: string[] = [];
    let currentData = input;

    // Simple linear execution (for demo)
    // In production: topological sort + parallel execution
    for (const node of workflow.nodes) {
      trace.push(`Executing: ${node.data.label} (${node.type})`);
      // Simulate node execution
      currentData = { ...currentData, [`${node.id}_output`]: true };
    }

    return {
      success: true,
      output: currentData,
      trace,
    };
  }
}

// ============================================
// COPILOT INTEGRATION
// ============================================

export interface CopilotSuggestion {
  type: "add_node" | "connect" | "fix" | "optimize";
  description: string;
  action: () => void;
}

export class FlowCopilot {
  async suggest(
    workflow: Workflow,
    prompt: string,
  ): Promise<CopilotSuggestion[]> {
    // In production: LLM integration
    return [
      {
        type: "add_node",
        description: `Add agent node for: ${prompt}`,
        action: () => {
          /* Stub: implement node addition */
        },
      },
    ];
  }

  async generateFromPrompt(prompt: string): Promise<Workflow> {
    // In production: LLM workflow generation
    const flow = new VibeFlow();
    const wf = flow.create(`Generated: ${prompt}`);
    return wf;
  }
}

// ============================================
// EXPORTS
// ============================================

export const vibeFlow = new VibeFlow();
export const flowCopilot = new FlowCopilot();

export default {
  VibeFlow,
  FlowCopilot,
  PLANET_NODES,
  vibeFlow,
  flowCopilot,
};
