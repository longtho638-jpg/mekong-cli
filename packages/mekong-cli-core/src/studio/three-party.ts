/**
 * Three-Party Orchestration Engine — Kiềng 3 Chân.
 * Manages relationships between: VC ↔ Expert ↔ Founder
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { Expert, Founder } from './types.js';
import { ok, err, type Result } from '../types/common.js';

type LlmClient = { chat?: (req: { messages: Array<{ role: string; content: string }> }) => Promise<{ content: string }> };

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, 'utf8')) as T; } catch { return fallback; }
}
function writeJson(path: string, data: unknown): void {
  const dir = path.substring(0, path.lastIndexOf('/'));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
}

export class ThreePartyOrchestrator {
  constructor(private studioDir: string, private llm: unknown) {}

  async matchExpert(companySlug: string, need: string): Promise<Result<Array<{ expert: Expert; fitScore: number; reasoning: string }>>> {
    const pool = readJson<Expert[]>(join(this.studioDir, 'experts', 'pool.json'), []);
    if (pool.length === 0) return ok([]);

    const client = this.llm as LlmClient;
    if (!client?.chat) {
      // Keyword-based fallback
      const matches = pool
        .filter(e => e.specialties?.some(s => need.toLowerCase().includes(s.toLowerCase())))
        .map(e => ({ expert: e, fitScore: 60, reasoning: 'Keyword match on specialties' }));
      return ok(matches.slice(0, 5));
    }

    try {
      const resp = await client.chat({
        messages: [{ role: 'user', content: `Match experts to this need: "${need}" for company "${companySlug}". Experts: ${JSON.stringify(pool.map(e => ({ id: e.id, name: e.name, specialties: e.specialties })))}. Return JSON array: [{"id":"...", "fitScore": 0-100, "reasoning":"..."}]` }],
      });
      const scored = JSON.parse(resp.content) as Array<{ id: string; fitScore: number; reasoning: string }>;
      const results = scored
        .map(s => { const expert = pool.find(e => e.id === s.id); return expert ? { expert, fitScore: s.fitScore, reasoning: s.reasoning } : null; })
        .filter((r): r is { expert: Expert; fitScore: number; reasoning: string } => r !== null);
      return ok(results);
    } catch {
      return ok(pool.slice(0, 3).map(e => ({ expert: e, fitScore: 50, reasoning: 'LLM unavailable' })));
    }
  }

  async matchFounder(sector: string, requirements: string): Promise<Result<Array<{ founder: Founder; fitScore: number; reasoning: string }>>> {
    const pool = readJson<Founder[]>(join(this.studioDir, 'founders', 'pool.json'), []);
    const matches = pool
      .filter(f => f.status === 'available' && f.sectorsInterested?.some(s => s.toLowerCase().includes(sector.toLowerCase())))
      .map(f => ({ founder: f, fitScore: 65, reasoning: `Sector match: ${sector}` }));
    return ok(matches.slice(0, 5));
  }

  async matchVC(companySlug: string): Promise<Result<Array<{ vcName: string; fitScore: number; reasoning: string; suggestedApproach: string }>>> {
    const client = this.llm as LlmClient;
    if (!client?.chat) return ok([]);

    const profile = readJson<Record<string, unknown>>(join(this.studioDir, 'portfolio', companySlug, 'profile.json'), {});
    try {
      const resp = await client.chat({
        messages: [{ role: 'user', content: `Recommend VCs for this company: ${JSON.stringify(profile)}. Return JSON array: [{"vcName":"...", "fitScore":0-100, "reasoning":"...", "suggestedApproach":"..."}]` }],
      });
      return ok(JSON.parse(resp.content) as Array<{ vcName: string; fitScore: number; reasoning: string; suggestedApproach: string }>);
    } catch {
      return ok([]);
    }
  }

  async dispatchExpert(expertId: string, companySlug: string, scope: string): Promise<Result<void>> {
    const engPath = join(this.studioDir, 'experts', 'engagements.json');
    const engagements = readJson<Array<Record<string, unknown>>>(engPath, []);
    engagements.push({
      id: randomUUID().slice(0, 8),
      expertId, companySlug, scope,
      status: 'dispatched',
      dispatchedAt: new Date().toISOString(),
    });
    writeJson(engPath, engagements);
    return ok(undefined);
  }
}
