/**
 * Tracks cumulative LLM usage across all requests.
 * Provides per-model and per-provider breakdowns.
 */

export interface UsageRecord {
  timestamp: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
}

export interface UsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  totalRequests: number;
  avgLatencyMs: number;
  byModel: Record<string, { requests: number; inputTokens: number; outputTokens: number; cost: number }>;
  byProvider: Record<string, { requests: number; inputTokens: number; outputTokens: number; cost: number }>;
}

/** Model pricing per million tokens [input, output] */
const MODEL_PRICING: Record<string, [number, number]> = {
  'claude-sonnet-4-20250514': [3, 15],
  'claude-sonnet-4': [3, 15],
  'claude-haiku-4-5-20251001': [0.80, 4],
  'claude-opus-4-6': [15, 75],
  'gpt-4o': [2.5, 10],
  'gpt-4o-mini': [0.15, 0.6],
  'deepseek-chat': [0.14, 0.28],
  'deepseek-reasoner': [0.55, 2.19],
  'qwen-plus': [0.80, 2.0],
};

export class CostTracker {
  private records: UsageRecord[] = [];

  /** Record a completed LLM request */
  record(provider: string, model: string, inputTokens: number, outputTokens: number, latencyMs: number): UsageRecord {
    const cost = this.calculateCost(model, inputTokens, outputTokens);
    const entry: UsageRecord = {
      timestamp: new Date().toISOString(),
      provider, model, inputTokens, outputTokens, cost, latencyMs,
    };
    this.records.push(entry);
    return entry;
  }

  /** Calculate cost for given usage */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[model] ?? [3, 15]; // default to Sonnet pricing
    return (inputTokens / 1_000_000) * pricing[0] + (outputTokens / 1_000_000) * pricing[1];
  }

  /** Get usage summary */
  getSummary(): UsageSummary {
    const byModel: UsageSummary['byModel'] = {};
    const byProvider: UsageSummary['byProvider'] = {};
    let totalIn = 0, totalOut = 0, totalCost = 0, totalLatency = 0;

    for (const r of this.records) {
      totalIn += r.inputTokens;
      totalOut += r.outputTokens;
      totalCost += r.cost;
      totalLatency += r.latencyMs;

      if (!byModel[r.model]) byModel[r.model] = { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
      byModel[r.model].requests++;
      byModel[r.model].inputTokens += r.inputTokens;
      byModel[r.model].outputTokens += r.outputTokens;
      byModel[r.model].cost += r.cost;

      if (!byProvider[r.provider]) byProvider[r.provider] = { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
      byProvider[r.provider].requests++;
      byProvider[r.provider].inputTokens += r.inputTokens;
      byProvider[r.provider].outputTokens += r.outputTokens;
      byProvider[r.provider].cost += r.cost;
    }

    return {
      totalInputTokens: totalIn,
      totalOutputTokens: totalOut,
      totalCost,
      totalRequests: this.records.length,
      avgLatencyMs: this.records.length ? totalLatency / this.records.length : 0,
      byModel, byProvider,
    };
  }

  /** Get all records */
  getRecords(): UsageRecord[] {
    return [...this.records];
  }

  /** Clear records */
  reset(): void {
    this.records = [];
  }
}
