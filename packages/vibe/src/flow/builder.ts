/**
 * 🎨 VIBE Flow - Workflow Builder Logic
 */
import { Workflow, FlowNode, FlowEdge } from './types';

export class VibeFlow {
  private workflows: Map<string, Workflow> = new Map();

  create(name: string, description?: string): Workflow {
    const workflow: Workflow = {
      id: `wf_${Date.now()}`,
      name, description, nodes: [], edges: [],
      createdAt: new Date(), updatedAt: new Date(),
    };
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  addNode(workflowId: string, node: Omit<FlowNode, "id">): FlowNode | undefined {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return undefined;
    const newNode: FlowNode = { ...node, id: `node_${Date.now()}` };
    workflow.nodes.push(newNode);
    workflow.updatedAt = new Date();
    return newNode;
  }

  connect(workflowId: string, sourceId: string, targetId: string, label?: string): FlowEdge | undefined {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return undefined;
    const edge: FlowEdge = { id: `edge_${Date.now()}`, source: sourceId, target: targetId, label };
    workflow.edges.push(edge);
    workflow.updatedAt = new Date();
    return edge;
  }

  get(id: string): Workflow | undefined { return this.workflows.get(id); }

  toReactFlow(workflowId: string) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return undefined;
    return {
      nodes: workflow.nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
      edges: workflow.edges.map(e => ({ id: e.id, source: e.source, target: e.target, label: e.label })),
    };
  }

  async execute(workflowId: string, input: Record<string, unknown>) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return { success: false, output: null, trace: ["Workflow not found"] };
    const trace: string[] = [];
    let currentData = input;
    for (const node of workflow.nodes) {
      trace.push(`Executing: ${node.data.label} (${node.type})`);
      currentData = { ...currentData, [`${node.id}_output`]: true };
    }
    return { success: true, output: currentData, trace };
  }
}
