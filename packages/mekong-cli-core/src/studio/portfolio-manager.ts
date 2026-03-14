/**
 * Portfolio Manager — CRUD + health scoring for portfolio companies.
 * Storage: .mekong/studio/portfolio/{slug}/profile.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { PortfolioCompany, CompanyStage, StudioDashboard } from './types.js';
import { ok, err, type Result } from '../types/common.js';

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

export class PortfolioManager {
  private get portfolioDir() { return join(this.studioDir, 'portfolio'); }

  constructor(private studioDir: string) {}

  async create(input: Omit<PortfolioCompany, 'id' | 'createdAt' | 'updatedAt' | 'healthScore'>): Promise<Result<PortfolioCompany>> {
    const now = new Date().toISOString();
    const company: PortfolioCompany = {
      ...input,
      id: randomUUID().slice(0, 8),
      healthScore: 50,
      createdAt: now,
      updatedAt: now,
    };
    const dir = join(this.portfolioDir, company.slug);
    ensureDir(dir);
    writeJson(join(dir, 'profile.json'), company);
    return ok(company);
  }

  async get(slug: string): Promise<PortfolioCompany | null> {
    const path = join(this.portfolioDir, slug, 'profile.json');
    if (!existsSync(path)) return null;
    return readJson<PortfolioCompany | null>(path, null);
  }

  async list(filter?: { stage?: CompanyStage; minHealth?: number }): Promise<PortfolioCompany[]> {
    ensureDir(this.portfolioDir);
    const entries = readdirSync(this.portfolioDir, { withFileTypes: true });
    const companies: PortfolioCompany[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const profile = readJson<PortfolioCompany | null>(join(this.portfolioDir, entry.name, 'profile.json'), null);
      if (!profile) continue;
      if (filter?.stage && profile.stage !== filter.stage) continue;
      if (filter?.minHealth !== undefined && profile.healthScore < filter.minHealth) continue;
      companies.push(profile);
    }
    return companies;
  }

  async update(slug: string, updates: Partial<PortfolioCompany>): Promise<Result<PortfolioCompany>> {
    const existing = await this.get(slug);
    if (!existing) return err(new Error(`Company ${slug} not found`));
    const updated: PortfolioCompany = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    writeJson(join(this.portfolioDir, slug, 'profile.json'), updated);
    return ok(updated);
  }

  async calculateHealth(slug: string): Promise<number> {
    const company = await this.get(slug);
    if (!company) return 0;
    let score = 0;
    // MRR contribution (25%)
    const mrr = company.mrr ?? 0;
    score += Math.min(25, (mrr / 1000) * 5);
    // Runway (20%)
    const runway = company.runwayMonths ?? 0;
    score += runway > 6 ? 20 : runway > 3 ? 10 : 0;
    // Team (15%)
    const team = company.teamSize ?? 0;
    score += team >= 3 ? 15 : team >= 2 ? 8 : 0;
    // Five-factor (25%)
    const ff = company.fiveFactorScores;
    if (ff) {
      const vals = Object.values(ff).filter((v): v is number => typeof v === 'number');
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      score += (avg / 100) * 25;
    }
    // Ops (15%) — based on stage progression
    const stageOrder = ['idea', 'validation', 'mvp', 'seed', 'series_a', 'growth', 'exit'];
    const stageIdx = stageOrder.indexOf(company.stage);
    score += Math.min(15, (stageIdx / stageOrder.length) * 15);
    const finalScore = Math.min(100, Math.round(score));
    await this.update(slug, { healthScore: finalScore });
    return finalScore;
  }

  async getDashboard(): Promise<StudioDashboard> {
    const companies = await this.list();
    const totalMrr = companies.reduce((sum, c) => sum + (c.mrr ?? 0), 0);
    const avgHealth = companies.length > 0
      ? companies.reduce((sum, c) => sum + c.healthScore, 0) / companies.length : 0;
    const alerts: Array<{ level: string; message: string; company?: string }> = [];
    for (const c of companies) {
      if (c.healthScore < 30) alerts.push({ level: 'critical', message: `Low health: ${c.healthScore}`, company: c.slug });
      if ((c.runwayMonths ?? 12) < 3) alerts.push({ level: 'warning', message: `Low runway: ${c.runwayMonths}mo`, company: c.slug });
    }
    return {
      totalPortfolioCompanies: companies.length,
      activeCompanies: companies.filter(c => c.stage !== 'exit').length,
      totalInvestedUsd: companies.reduce((s, c) => s + (c.investedUsd ?? 0), 0),
      portfolioValueUsd: 0,
      totalMrr,
      avgHealthScore: Math.round(avgHealth),
      dealsInPipeline: 0,
      expertsActive: 0,
      foundersAvailable: 0,
      topMomentum: companies.filter(c => c.momentum).map(c => ({ company: c.slug, level: c.momentum! })),
      alerts,
      crossPortfolioInsights: 0,
    };
  }
}
