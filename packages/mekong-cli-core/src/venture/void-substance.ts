/**
 * Void-Substance Mapper — 虚実 (Xū Shí / Hư Thực)
 * Maps market voids (unserved areas) vs substances (occupied positions).
 */

import { ok, type Result } from '../types/common.js';
import type { VoidSubstanceMap } from './types.js';

type LlmClient = { chat?: (req: { messages: Array<{ role: string; content: string }> }) => Promise<{ content: string }> };

const FALLBACK: VoidSubstanceMap = {
  market: '',
  voids: [],
  substances: [],
  gaps: [],
  recommendation: 'LLM required for void-substance analysis',
  analyzedAt: new Date().toISOString(),
};

export class VoidSubstanceMapper {
  constructor(private llm: unknown) {}

  async analyze(market: string): Promise<Result<VoidSubstanceMap>> {
    const client = this.llm as LlmClient;
    if (!client?.chat) return ok({ ...FALLBACK, market });

    try {
      const resp = await client.chat({
        messages: [{
          role: 'user',
          content: `Map the voids (unserved areas) and substances (occupied positions) in this market: "${market}"\n\nReturn JSON:\n{"market":"${market}", "voids":[{"area":"...", "description":"...", "opportunity":"..."}], "substances":[{"area":"...", "player":"...", "strength":"..."}], "gaps":[{"void":"...", "substance":"...", "exploitability":0-100}], "recommendation":"..."}`,
        }],
      });
      const parsed = JSON.parse(resp.content) as Partial<VoidSubstanceMap>;
      return ok({
        market: parsed.market ?? market,
        voids: parsed.voids ?? [],
        substances: parsed.substances ?? [],
        gaps: parsed.gaps ?? [],
        recommendation: parsed.recommendation ?? '',
        analyzedAt: new Date().toISOString(),
      });
    } catch {
      return ok({ ...FALLBACK, market });
    }
  }

  async findGaps(market: string, dealContext: string): Promise<Result<VoidSubstanceMap>> {
    const client = this.llm as LlmClient;
    if (!client?.chat) return ok({ ...FALLBACK, market });

    try {
      const resp = await client.chat({
        messages: [{
          role: 'user',
          content: `Find exploitable gaps in "${market}" for this deal context: "${dealContext}"\n\nReturn JSON:\n{"market":"${market}", "voids":[{"area":"...", "description":"...", "opportunity":"..."}], "substances":[{"area":"...", "player":"...", "strength":"..."}], "gaps":[{"void":"...", "substance":"...", "exploitability":0-100}], "recommendation":"..."}`,
        }],
      });
      const parsed = JSON.parse(resp.content) as Partial<VoidSubstanceMap>;
      return ok({
        market: parsed.market ?? market,
        voids: parsed.voids ?? [],
        substances: parsed.substances ?? [],
        gaps: parsed.gaps ?? [],
        recommendation: parsed.recommendation ?? '',
        analyzedAt: new Date().toISOString(),
      });
    } catch {
      return ok({ ...FALLBACK, market });
    }
  }
}
