/**
 * Deal Pipeline — manage deal flow from sourcing to close.
 *
 * Pipeline stages: sourced → screening → first_meeting → diligence →
 *   term_sheet → negotiation → closing → closed
 *
 * AI-powered:
 * - Source: scan markets for opportunities matching thesis
 * - Screen: score deals against thesis automatically
 * - Diligence: multi-agent parallel research
 */

import type { Deal, DealStage } from './types.js';
import type { Result } from '../types/common.js';

export class DealPipeline {
  constructor(private studioDir: string, private llm: unknown) {}

  async addDeal(input: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<Deal>> {
    throw new Error('Not implemented');
  }

  async listDeals(filter?: { stage?: DealStage }): Promise<Deal[]> {
    throw new Error('Not implemented');
  }

  async screenDeal(dealId: string): Promise<Result<{ score: number; reasoning: string }>> {
    throw new Error('Not implemented');
  }

  async advanceDeal(dealId: string, toStage: DealStage, note?: string): Promise<Result<Deal>> {
    throw new Error('Not implemented');
  }

  async passDeal(dealId: string, reason: string): Promise<Result<void>> {
    throw new Error('Not implemented');
  }

  async sourceDeal(sector: string, count: number): Promise<Result<Deal[]>> {
    throw new Error('Not implemented');
  }
}
