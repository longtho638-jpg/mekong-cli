import { OllamaClient } from '../clients/ollama-client';
import { SOPDefinition, SOPDecision, SignalContext } from './sop.types';
import { TriggerEvaluator } from './trigger-evaluator';
import { DecisionCaller } from './decision-caller';

// Default SOP definitions
const DEFAULT_SOPS: SOPDefinition[] = [
  {
    id: 'sop-rsi-overbought',
    name: 'RSI Overbought Signal',
    description: 'Sell when RSI indicates overbought conditions',
    triggers: [
      { field: 'indicators.rsi', operator: 'gt', value: 70 },
    ],
    action: { type: 'SELL' },
    priority: 1,
    enabled: true,
  },
  {
    id: 'sop-rsi-oversold',
    name: 'RSI Oversold Signal',
    description: 'Buy when RSI indicates oversold conditions',
    triggers: [
      { field: 'indicators.rsi', operator: 'lt', value: 30 },
    ],
    action: { type: 'BUY' },
    priority: 1,
    enabled: true,
  },
  {
    id: 'sop-momentum-buy',
    name: 'Momentum Buy Signal',
    description: 'Buy when momentum indicators are strong',
    triggers: [
      { field: 'indicators.macd', operator: 'gt', value: 0 },
      { field: 'indicators.rsi', operator: 'gte', value: 50 },
    ],
    action: { type: 'BUY' },
    priority: 2,
    enabled: true,
  },
];

export class SOPEngine {
  private sops: Map<string, SOPDefinition>;
  private triggerEvaluator: TriggerEvaluator;
  private decisionCaller: DecisionCaller;
  private decisionLog: SOPDecision[] = [];

  constructor(ollamaClient: OllamaClient) {
    this.sops = new Map();
    this.triggerEvaluator = new TriggerEvaluator();
    this.decisionCaller = new DecisionCaller(ollamaClient);

    // Load default SOPs
    DEFAULT_SOPS.forEach(sop => this.registerSOP(sop));
  }

  /**
   * Register a new SOP definition
   */
  registerSOP(sop: SOPDefinition): void {
    this.sops.set(sop.id, sop);
  }

  /**
   * Get SOP by ID
   */
  getSOP(id: string): SOPDefinition | undefined {
    return this.sops.get(id);
  }

  /**
   * Evaluate signal against all SOPs and return decisions
   */
  async evaluate(signal: SignalContext): Promise<SOPDecision[]> {
    const decisions: SOPDecision[] = [];
    const enabledSOPs = Array.from(this.sops.values()).filter(sop => sop.enabled);

    // Sort by priority (lower number = higher priority)
    enabledSOPs.sort((a, b) => a.priority - b.priority);

    for (const sop of enabledSOPs) {
      const triggered = this.triggerEvaluator.evaluateAll(sop.triggers, signal);

      if (triggered) {
        const decision = await this.decisionCaller.call(sop, signal);
        decisions.push(decision);
        this.logDecision(decision);
      }
    }

    return decisions;
  }

  /**
   * Evaluate single SOP against signal
   */
  async evaluateSingle(sopId: string, signal: SignalContext): Promise<SOPDecision | null> {
    const sop = this.sops.get(sopId);
    if (!sop || !sop.enabled) return null;

    const triggered = this.triggerEvaluator.evaluateAll(sop.triggers, signal);
    if (!triggered) return null;

    const decision = await this.decisionCaller.call(sop, signal);
    this.logDecision(decision);
    return decision;
  }

  /**
   * Get decision history
   */
  getDecisionHistory(limit = 100): SOPDecision[] {
    return this.decisionLog.slice(-limit);
  }

  /**
   * Clear decision history
   */
  clearHistory(): void {
    this.decisionLog = [];
  }

  /**
   * Log decision for audit trail
   */
  private logDecision(decision: SOPDecision): void {
    this.decisionLog.push(decision);

    // Keep only last 1000 decisions in memory
    if (this.decisionLog.length > 1000) {
      this.decisionLog = this.decisionLog.slice(-1000);
    }
  }

  /**
   * Get engine stats
   */
  getStats(): {
    totalSOPs: number;
    enabledSOPs: number;
    decisionCount: number;
  } {
    const sops = Array.from(this.sops.values());
    return {
      totalSOPs: sops.length,
      enabledSOPs: sops.filter(s => s.enabled).length,
      decisionCount: this.decisionLog.length,
    };
  }
}
