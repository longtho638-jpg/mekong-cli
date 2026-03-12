/**
 * Company Instance — per-company OpenClaw CTO agent instance.
 *
 * Each portfolio company gets its own CTO instance that:
 * - Manages company-specific SOPs and workflows
 * - Tracks company metrics and health
 * - Coordinates expert engagements
 * - Reports to studio-level orchestrator
 */

import type { PortfolioCompany } from './types.js';
import type { Result } from '../types/common.js';

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

  /** Initialize company workspace */
  async init(): Promise<Result<void>> {
    throw new Error('Not implemented');
  }

  /** Get company profile */
  async getProfile(): Promise<PortfolioCompany | null> {
    throw new Error('Not implemented');
  }

  /** Run company health check */
  async healthCheck(): Promise<Result<{ score: number; issues: string[] }>> {
    throw new Error('Not implemented');
  }

  /** Execute company-level SOP */
  async runSop(sopId: string, args?: Record<string, unknown>): Promise<Result<unknown>> {
    throw new Error('Not implemented');
  }
}
