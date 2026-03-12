/**
 * Budget tracker — enforces cost/token/time limits per task.
 * Emits 'budget:warning' and 'budget:exceeded' events.
 */
import { emit } from '../core/events.js';

export interface BudgetLimits {
  maxCost: number;
  maxTokens: number;
  maxTimeSeconds: number;
  warnAtPercent: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  model: string;
  provider: string;
}

export interface BudgetStatus {
  withinLimits: boolean;
  costUsed: number;
  costLimit: number;
  costPercent: number;
  tokensUsed: number;
  tokensLimit: number;
  timeUsedSeconds: number;
  timeLimit: number;
}

interface ModelBreakdown {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

interface TaskBudget {
  limits: BudgetLimits;
  startTime: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  callCount: number;
  breakdown: Map<string, ModelBreakdown>;
  warningEmitted: boolean;
}

/** Model pricing per million tokens [input, output] in USD */
const MODEL_PRICING: Record<string, [number, number]> = {
  'claude-sonnet-4-20250514': [3, 15],
  'claude-sonnet-4': [3, 15],
  'gpt-4o': [2.5, 10],
  'deepseek-chat': [0.14, 0.28],
  'ollama': [0, 0],
};

const DEFAULT_PRICING: [number, number] = [3, 15];

export class BudgetTracker {
  private taskBudgets: Map<string, TaskBudget> = new Map();

  /** Start tracking a task */
  startTask(taskId: string, limits: BudgetLimits): void {
    this.taskBudgets.set(taskId, {
      limits,
      startTime: Date.now(),
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      callCount: 0,
      breakdown: new Map(),
      warningEmitted: false,
    });
  }

  /** Record token usage for a task */
  recordUsage(taskId: string, usage: TokenUsage): void {
    const budget = this.taskBudgets.get(taskId);
    if (!budget) return;

    const cost = this.calculateCost(usage);
    budget.totalInputTokens += usage.inputTokens;
    budget.totalOutputTokens += usage.outputTokens;
    budget.totalCost += cost;
    budget.callCount++;

    const key = `${usage.provider}/${usage.model}`;
    const existing = budget.breakdown.get(key) ?? { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
    existing.calls++;
    existing.inputTokens += usage.inputTokens;
    existing.outputTokens += usage.outputTokens;
    existing.cost += cost;
    budget.breakdown.set(key, existing);

    const status = this.checkBudget(taskId);
    if (!budget.warningEmitted && status.costPercent >= budget.limits.warnAtPercent) {
      budget.warningEmitted = true;
      emit('budget:warning', { taskId, ...status });
    }
    if (!status.withinLimits) {
      emit('budget:exceeded', { taskId, ...status });
    }
  }

  /** Check current budget status */
  checkBudget(taskId: string): BudgetStatus {
    const budget = this.taskBudgets.get(taskId);
    if (!budget) {
      return {
        withinLimits: true, costUsed: 0, costLimit: 0, costPercent: 0,
        tokensUsed: 0, tokensLimit: 0, timeUsedSeconds: 0, timeLimit: 0,
      };
    }

    const tokensUsed = budget.totalInputTokens + budget.totalOutputTokens;
    const timeUsed = (Date.now() - budget.startTime) / 1000;
    const costPercent = budget.limits.maxCost > 0
      ? (budget.totalCost / budget.limits.maxCost) * 100
      : 0;

    return {
      withinLimits:
        budget.totalCost <= budget.limits.maxCost &&
        tokensUsed <= budget.limits.maxTokens &&
        timeUsed <= budget.limits.maxTimeSeconds,
      costUsed: budget.totalCost,
      costLimit: budget.limits.maxCost,
      costPercent,
      tokensUsed,
      tokensLimit: budget.limits.maxTokens,
      timeUsedSeconds: timeUsed,
      timeLimit: budget.limits.maxTimeSeconds,
    };
  }

  /** Calculate cost from token usage */
  private calculateCost(usage: TokenUsage): number {
    const pricing = MODEL_PRICING[usage.model] ?? DEFAULT_PRICING;
    const inputCost = (usage.inputTokens / 1_000_000) * pricing[0];
    const outputCost = (usage.outputTokens / 1_000_000) * pricing[1];
    return inputCost + outputCost;
  }

  /** Get detailed report with per-model breakdown */
  getReport(taskId: string): BudgetStatus & {
    breakdown: Array<{ model: string; calls: number; inputTokens: number; outputTokens: number; cost: number }>;
  } {
    const status = this.checkBudget(taskId);
    const budget = this.taskBudgets.get(taskId);
    const breakdown = budget
      ? Array.from(budget.breakdown.entries()).map(([model, data]) => ({ model, ...data }))
      : [];
    return { ...status, breakdown };
  }

  /** Stop tracking a task */
  endTask(taskId: string): void {
    this.taskBudgets.delete(taskId);
  }
}
