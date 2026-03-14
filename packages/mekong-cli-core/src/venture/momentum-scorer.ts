/**
 * Momentum Scorer — 勢 (Shì/Thế)
 * Measures accumulated positional energy in a market or company.
 */

import { ok, type Result } from '../types/common.js';
import type { MomentumResult, CompanyMomentumResult } from './types.js';
import type { MomentumLevel } from '../studio/types.js';

type LlmClient = { chat?: (req: { messages: Array<{ role: string; content: string }> }) => Promise<{ content: string }> };

export class MomentumScorer {
  constructor(private llm: unknown) {}

  async scoreMarket(market: string): Promise<Result<MomentumResult>> {
    const client = this.llm as LlmClient;
    if (!client?.chat) {
      return ok({
        level: 'steady' as MomentumLevel,
        score: 50,
        signals: [],
        reasoning: 'LLM unavailable — default steady momentum',
        forecast: 'Requires LLM for market momentum analysis',
      });
    }

    try {
      const resp = await client.chat({
        messages: [{
          role: 'user',
          content: `Analyze market momentum for: "${market}". Consider funding trends, media attention, regulatory environment, tech maturity, talent migration.\n\nReturn JSON: {"level":"surging|building|steady|fading|stalled", "score":0-100, "signals":[{"signal":"...", "direction":"up|down|flat", "weight":0-1}], "reasoning":"...", "forecast":"..."}`,
        }],
      });
      const parsed = JSON.parse(resp.content) as MomentumResult;
      return ok({
        level: parsed.level ?? 'steady',
        score: parsed.score ?? 50,
        signals: parsed.signals ?? [],
        reasoning: parsed.reasoning ?? '',
        forecast: parsed.forecast ?? '',
      });
    } catch {
      return ok({ level: 'steady' as MomentumLevel, score: 50, signals: [], reasoning: 'LLM error', forecast: '' });
    }
  }

  async scoreCompany(_companySlug: string, metrics: Record<string, number>): Promise<Result<CompanyMomentumResult>> {
    const mrrGrowth = metrics.mrrGrowth ?? 0;
    let level: MomentumLevel;
    let score: number;

    if (mrrGrowth > 20) { level = 'surging'; score = 90; }
    else if (mrrGrowth > 10) { level = 'building'; score = 70; }
    else if (mrrGrowth > 0) { level = 'steady'; score = 50; }
    else if (mrrGrowth > -10) { level = 'fading'; score = 30; }
    else { level = 'stalled'; score = 10; }

    // Adjust for other metrics
    if (metrics.userGrowth && metrics.userGrowth > 15) score = Math.min(100, score + 10);
    if (metrics.churnRate && metrics.churnRate > 5) score = Math.max(0, score - 10);

    return ok({
      level,
      score,
      trendVsLastMonth: mrrGrowth,
      reasoning: `MRR growth: ${mrrGrowth}%, user growth: ${metrics.userGrowth ?? 0}%, churn: ${metrics.churnRate ?? 0}%`,
    });
  }
}
