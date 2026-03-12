export interface AgentResult {
  data: unknown;
  error?: string;
}

export abstract class BaseAgent {
  id: string;
  name: string;
  strategy?: string;

  constructor(config: { id: string; name: string; strategy?: string }) {
    this.id = config.id;
    this.name = config.name;
    this.strategy = config.strategy;
  }

  abstract execute(): Promise<AgentResult>;
}

export interface Agent {
  id: string;
  name: string;
  type: 'planner' | 'executor' | 'verifier';
}

export function createAgent(name: string, type: Agent['type']): Agent {
  return {
    id: crypto.randomUUID(),
    name,
    type,
  };
}

export class ROIScannerAgent extends BaseAgent {
  constructor() {
    super({ id: 'roi-scanner', name: 'ROI Scanner', strategy: 'standard' });
  }

  async execute(): Promise<AgentResult> {
    return { data: { roi: 5.5, token: 'ETH' } };
  }
}

import { MarketAnalyzerAgent } from './market-analyzer';
export { MarketAnalyzerAgent };

export function createDefaultRegistry() {
  const registry = new Map<string, BaseAgent>();

  const roiScanner = new ROIScannerAgent();
  registry.set(roiScanner.id, roiScanner);

  const marketAnalyzer = new MarketAnalyzerAgent();
  registry.set(marketAnalyzer.id, marketAnalyzer);

  return registry;
}
