/**
 * Momentum Scorer — 勢 (Shì/Thế)
 *
 * Measures accumulated positional energy in a market or company.
 *
 * Market signals: funding volume trend, media attention, regulatory
 * tailwinds/headwinds, technology enabler maturity, talent migration.
 *
 * Company signals: MRR growth rate, user acquisition, team growth,
 * product velocity, customer satisfaction trend.
 */

import type { Result } from '../types/common.js';
import type { MomentumResult, CompanyMomentumResult } from './types.js';

export class MomentumScorer {
  constructor(private llm: unknown) {}

  async scoreMarket(market: string): Promise<Result<MomentumResult>> {
    throw new Error('Not implemented');
  }

  async scoreCompany(companySlug: string, metrics: Record<string, number>): Promise<Result<CompanyMomentumResult>> {
    throw new Error('Not implemented');
  }
}
