/**
 * Company Instance — per-company OpenClaw CTO agent instance.
 * Each portfolio company gets its own CTO instance.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { PortfolioCompany } from './types.js';
import { ok, err, type Result } from '../types/common.js';

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, 'utf8')) as T; } catch { return fallback; }
}
function writeJson(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
}

export interface CompanyInstanceConfig {
  companySlug: string;
  studioDir: string;
  sopTemplates?: string[];
}

export class CompanyInstance {
  readonly slug: string;

  constructor(private config: CompanyInstanceConfig) {
    this.slug = config.companySlug;
  }

  private get companyDir() { return join(this.config.studioDir, 'portfolio', this.slug); }

  async init(): Promise<Result<void>> {
    const dir = this.companyDir;
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    // Create openclaw.yaml config
    const configPath = join(dir, 'openclaw.yaml');
    if (!existsSync(configPath)) {
      const yaml = `# OpenClaw CTO Instance — ${this.slug}\ncompany: ${this.slug}\ncreated: ${new Date().toISOString()}\nsops: ${(this.config.sopTemplates ?? []).map(s => `\n  - ${s}`).join('') || ' []'}\n`;
      writeFileSync(configPath, yaml, 'utf8');
    }
    // Ensure subdirectories
    for (const sub of ['sops', 'metrics', 'reports']) {
      const subDir = join(dir, sub);
      if (!existsSync(subDir)) mkdirSync(subDir, { recursive: true });
    }
    return ok(undefined);
  }

  async getProfile(): Promise<PortfolioCompany | null> {
    return readJson<PortfolioCompany | null>(join(this.companyDir, 'profile.json'), null);
  }

  async healthCheck(): Promise<Result<{ score: number; issues: string[] }>> {
    const profile = await this.getProfile();
    const issues: string[] = [];
    let score = 50;

    if (!profile) {
      issues.push('No profile.json found');
      return ok({ score: 0, issues });
    }
    if (!profile.mrr && profile.mrr !== 0) issues.push('MRR not tracked');
    if (!profile.runwayMonths) issues.push('Runway not set');
    if (!profile.teamSize) issues.push('Team size unknown');
    if ((profile.runwayMonths ?? 12) < 3) { issues.push('Runway critical (<3mo)'); score -= 20; }
    if ((profile.mrr ?? 0) > 0) score += 15;
    if ((profile.teamSize ?? 0) >= 3) score += 10;
    if (!existsSync(join(this.companyDir, 'openclaw.yaml'))) issues.push('No openclaw.yaml config');

    score = Math.max(0, Math.min(100, score));
    return ok({ score, issues });
  }

  async runSop(sopId: string, args?: Record<string, unknown>): Promise<Result<unknown>> {
    const sopPath = join(this.companyDir, 'sops', `${sopId}.json`);
    const sop = readJson<Record<string, unknown> | null>(sopPath, null);
    if (!sop) return err(new Error(`SOP ${sopId} not found at ${sopPath}`));
    return ok({
      sopId,
      status: 'executed',
      executedAt: new Date().toISOString(),
      args: args ?? {},
      steps: sop.steps ?? [],
    });
  }
}
