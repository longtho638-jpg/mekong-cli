/**
 * n8n-inspired Workflow Pipeline Engine for trading.
 * Node-based execution: Trigger → Signal → RiskCheck → Order → Report.
 * Supports sequential/parallel branches, retry logic, conditional routing.
 */

import { logger } from '../utils/logger';

// --- Node Types ---

export type NodeStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface NodeResult {
  nodeId: string;
  status: NodeStatus;
  data: Record<string, unknown>;
  error?: string;
  duration: number; // ms
  retries: number;
}

export interface PipelineNode {
  id: string;
  name: string;
  type: 'trigger' | 'action' | 'condition' | 'report';
  /** Execute this node. Receives upstream data, returns output data. */
  execute: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
  /** Condition function for 'condition' type nodes. Returns branch name. */
  condition?: (input: Record<string, unknown>) => string;
  /** Max retries on failure (default: 0) */
  maxRetries?: number;
  /** Retry delay in ms (default: 1000) */
  retryDelay?: number;
  /** Next node IDs (sequential). For condition nodes, map branch→nodeId. */
  next?: string[];
  /** Branching map for condition nodes: { 'true': 'nodeA', 'false': 'nodeB' } */
  branches?: Record<string, string>;
}

export interface PipelineConfig {
  id: string;
  name: string;
  nodes: PipelineNode[];
  /** Entry node ID */
  entryNodeId: string;
  /** Error handler node ID (optional, like n8n error workflow) */
  errorHandlerNodeId?: string;
}

// --- Pipeline Engine ---

export class WorkflowPipelineEngine {
  private nodeMap = new Map<string, PipelineNode>();
  private results: NodeResult[] = [];
  private config: PipelineConfig;

  constructor(config: PipelineConfig) {
    this.config = config;
    for (const node of config.nodes) {
      this.nodeMap.set(node.id, node);
    }
  }

  /** Execute the full pipeline from entry node */
  async execute(triggerData: Record<string, unknown> = {}): Promise<NodeResult[]> {
    this.results = [];
    logger.info(`[Pipeline] Starting: ${this.config.name}`);

    try {
      await this.executeNode(this.config.entryNodeId, triggerData);
    } catch (err) {
      logger.error(`[Pipeline] Fatal: ${err instanceof Error ? err.message : String(err)}`);
      if (this.config.errorHandlerNodeId) {
        await this.executeNode(this.config.errorHandlerNodeId, {
          error: err instanceof Error ? err.message : String(err),
          pipeline: this.config.name,
          results: this.results,
        });
      }
    }

    logger.info(`[Pipeline] Completed: ${this.config.name} (${this.results.length} nodes)`);
    return this.results;
  }

  private async executeNode(nodeId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const node = this.nodeMap.get(nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);

    const startTime = Date.now();
    let retries = 0;
    const maxRetries = node.maxRetries ?? 0;
    const retryDelay = node.retryDelay ?? 1000;

    while (true) {
      try {
        logger.info(`[Pipeline] Executing: ${node.name} (${node.type})`);
        const output = await node.execute(input);
        const result: NodeResult = {
          nodeId: node.id,
          status: 'success',
          data: output,
          duration: Date.now() - startTime,
          retries,
        };
        this.results.push(result);

        // Route to next nodes
        if (node.type === 'condition' && node.condition && node.branches) {
          const branch = node.condition(output);
          const nextId = node.branches[branch];
          if (nextId) {
            return this.executeNode(nextId, output);
          }
        } else if (node.next && node.next.length > 0) {
          let lastOutput = output;
          for (const nextId of node.next) {
            lastOutput = await this.executeNode(nextId, lastOutput);
          }
          return lastOutput;
        }

        return output;
      } catch (err) {
        retries++;
        if (retries > maxRetries) {
          const result: NodeResult = {
            nodeId: node.id,
            status: 'failed',
            data: {},
            error: err instanceof Error ? err.message : String(err),
            duration: Date.now() - startTime,
            retries: retries - 1,
          };
          this.results.push(result);
          throw err;
        }
        logger.warn(`[Pipeline] Retry ${retries}/${maxRetries} for ${node.name}: ${err instanceof Error ? err.message : String(err)}`);
        await this.delay(retryDelay * retries);
      }
    }
  }

  /** Get execution results */
  getResults(): NodeResult[] {
    return [...this.results];
  }

  /** Check if pipeline succeeded (all nodes success) */
  isSuccess(): boolean {
    return this.results.length > 0 && this.results.every(r => r.status === 'success');
  }

  /** Get failed nodes */
  getFailedNodes(): NodeResult[] {
    return this.results.filter(r => r.status === 'failed');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// --- Pre-built Trading Pipeline Factory ---

export function createTradingPipeline(handlers: {
  onTrigger: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
  onSignalDetect: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
  onRiskCheck: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
  onOrderExecute: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
  onReport: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
  onError?: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
}): WorkflowPipelineEngine {
  const nodes: PipelineNode[] = [
    {
      id: 'trigger',
      name: 'Price Trigger',
      type: 'trigger',
      execute: handlers.onTrigger,
      next: ['signal'],
    },
    {
      id: 'signal',
      name: 'Signal Detection',
      type: 'action',
      execute: handlers.onSignalDetect,
      next: ['risk-check'],
    },
    {
      id: 'risk-check',
      name: 'Risk Check',
      type: 'condition',
      execute: handlers.onRiskCheck,
      condition: (data) => data.approved ? 'approved' : 'rejected',
      branches: { approved: 'order', rejected: 'report' },
    },
    {
      id: 'order',
      name: 'Order Execution',
      type: 'action',
      execute: handlers.onOrderExecute,
      maxRetries: 2,
      retryDelay: 500,
      next: ['report'],
    },
    {
      id: 'report',
      name: 'Report',
      type: 'report',
      execute: handlers.onReport,
    },
  ];

  if (handlers.onError) {
    nodes.push({
      id: 'error-handler',
      name: 'Error Handler',
      type: 'report',
      execute: handlers.onError,
    });
  }

  return new WorkflowPipelineEngine({
    id: 'trading-pipeline',
    name: 'Standard Trading Pipeline',
    nodes,
    entryNodeId: 'trigger',
    errorHandlerNodeId: handlers.onError ? 'error-handler' : undefined,
  });
}
