/**
 * Terrain Analyzer — Sun Tzu 地形篇 applied to market analysis.
 * Classifies markets into 6 terrain types.
 */

import { ok, type Result } from '../types/common.js';
import type { TerrainAnalysis } from './types.js';

type LlmClient = { chat?: (req: { messages: Array<{ role: string; content: string }> }) => Promise<{ content: string }> };

export class TerrainAnalyzer {
  constructor(private llm: unknown) {}

  async analyze(market: string): Promise<Result<TerrainAnalysis>> {
    const client = this.llm as LlmClient;
    if (!client?.chat) {
      return ok({
        terrain: 'accessible',
        reasoning: 'LLM unavailable — defaulting to accessible terrain',
        entryStrategy: 'Speed-based entry recommended',
        risks: ['Market analysis requires LLM'],
        opportunities: [],
        competitors: [],
        recommendation: 'Run analysis with LLM for accurate terrain classification',
      });
    }

    try {
      const resp = await client.chat({
        messages: [{
          role: 'user',
          content: `Analyze this market terrain using Sun Tzu's 6 classifications: accessible, entangling, temporizing, narrow_pass, precipitous, distant.\n\nMarket: "${market}"\n\nReturn JSON:\n{"terrain":"...", "reasoning":"...", "entryStrategy":"...", "risks":["..."], "opportunities":["..."], "competitors":[{"name":"...", "strength":"...", "weakness":"..."}], "recommendation":"..."}`,
        }],
      });
      const parsed = JSON.parse(resp.content) as TerrainAnalysis;
      return ok({
        terrain: parsed.terrain ?? 'accessible',
        reasoning: parsed.reasoning ?? '',
        entryStrategy: parsed.entryStrategy ?? '',
        risks: parsed.risks ?? [],
        opportunities: parsed.opportunities ?? [],
        competitors: parsed.competitors ?? [],
        recommendation: parsed.recommendation ?? '',
      });
    } catch {
      return ok({
        terrain: 'accessible',
        reasoning: 'LLM parse error — defaulting',
        entryStrategy: 'Requires manual analysis',
        risks: [], opportunities: [], competitors: [],
        recommendation: 'Retry with LLM',
      });
    }
  }
}
