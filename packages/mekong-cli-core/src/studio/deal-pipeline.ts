/**
 * Deal Pipeline — manage deal flow from sourcing to close.
 * Storage: .mekong/studio/dealflow/pipeline.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { Deal, DealStage } from './types.js';
import { ok, err, type Result } from '../types/common.js';

type LlmClient = { chat?: (req: { messages: Array<{ role: string; content: string }> }) => Promise<{ content: string }> };

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, 'utf8')) as T; } catch { return fallback; }
}
function writeJson(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
}

export class DealPipeline {
  private get pipelinePath() { return join(this.studioDir, 'dealflow', 'pipeline.json'); }

  constructor(private studioDir: string, private llm: unknown) {}

  private loadDeals(): Deal[] {
    return readJson<Deal[]>(this.pipelinePath, []);
  }
  private saveDeals(deals: Deal[]): void {
    ensureDir(join(this.studioDir, 'dealflow'));
    writeJson(this.pipelinePath, deals);
  }

  async addDeal(input: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<Deal>> {
    const now = new Date().toISOString();
    const deal: Deal = { ...input, id: randomUUID().slice(0, 8), createdAt: now, updatedAt: now };
    const deals = this.loadDeals();
    deals.push(deal);
    this.saveDeals(deals);
    return ok(deal);
  }

  async listDeals(filter?: { stage?: DealStage }): Promise<Deal[]> {
    const deals = this.loadDeals();
    if (!filter?.stage) return deals;
    return deals.filter(d => d.stage === filter.stage);
  }

  async screenDeal(dealId: string): Promise<Result<{ score: number; reasoning: string }>> {
    const deals = this.loadDeals();
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return err(new Error(`Deal ${dealId} not found`));

    const client = this.llm as LlmClient;
    if (!client?.chat) return ok({ score: 50, reasoning: 'LLM unavailable — default score applied' });

    try {
      const resp = await client.chat({
        messages: [{ role: 'user', content: `Score this deal 0-100 based on investment potential. Return JSON: {"score": number, "reasoning": "string"}.\n\nDeal: ${JSON.stringify(deal)}` }],
      });
      const parsed = JSON.parse(resp.content) as { score: number; reasoning: string };
      return ok({ score: parsed.score ?? 50, reasoning: parsed.reasoning ?? 'Scored by AI' });
    } catch {
      return ok({ score: 50, reasoning: 'LLM unavailable — default score applied' });
    }
  }

  async advanceDeal(dealId: string, toStage: DealStage, note?: string): Promise<Result<Deal>> {
    const deals = this.loadDeals();
    const idx = deals.findIndex(d => d.id === dealId);
    if (idx === -1) return err(new Error(`Deal ${dealId} not found`));
    deals[idx].stage = toStage;
    deals[idx].updatedAt = new Date().toISOString();
    if (note) deals[idx].notes = [...(deals[idx].notes ?? []), { date: new Date().toISOString(), content: note, author: 'system' }];
    this.saveDeals(deals);
    return ok(deals[idx]);
  }

  async passDeal(dealId: string, reason: string): Promise<Result<void>> {
    const deals = this.loadDeals();
    const idx = deals.findIndex(d => d.id === dealId);
    if (idx === -1) return err(new Error(`Deal ${dealId} not found`));
    deals[idx].stage = 'passed';
    deals[idx].updatedAt = new Date().toISOString();
    deals[idx].notes = [...(deals[idx].notes ?? []), { date: new Date().toISOString(), content: `PASS: ${reason}`, author: 'system' }];
    this.saveDeals(deals);
    return ok(undefined);
  }

  async sourceDeal(sector: string, count: number): Promise<Result<Deal[]>> {
    const client = this.llm as LlmClient;
    if (!client?.chat) return ok([]);

    try {
      const resp = await client.chat({
        messages: [{ role: 'user', content: `Generate ${count} startup deal candidates in the "${sector}" sector. Return JSON array of objects with fields: name, sector, stage, description. Keep it realistic.` }],
      });
      const candidates = JSON.parse(resp.content) as Array<{ name: string; sector: string; stage: string; description: string }>;
      const now = new Date().toISOString();
      const deals: Deal[] = candidates.slice(0, count).map(c => ({
        id: randomUUID().slice(0, 8),
        name: c.name,
        sector: c.sector ?? sector,
        stage: 'sourced' as DealStage,
        source: 'ai_sourced',
        createdAt: now,
        updatedAt: now,
        notes: [{ date: now, content: c.description, author: 'ai_sourced' }],
      } as unknown as Deal));
      const existing = this.loadDeals();
      this.saveDeals([...existing, ...deals]);
      return ok(deals);
    } catch {
      return ok([]);
    }
  }
}
