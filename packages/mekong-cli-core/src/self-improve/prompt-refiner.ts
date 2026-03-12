/**
 * Prompt Refiner — optimize prompts via A/B testing.
 * Tracks variants per context, determines statistical winner after 30+ samples.
 */
import type { PromptVariant } from './types.js';
import type { LlmRouter } from '../llm/router.js';
import type { Result } from '../types/common.js';

export class PromptRefiner {
  private readonly variantsPath: string;

  constructor(dataDir: string, private readonly llm: LlmRouter) {
    this.variantsPath = `${dataDir}/prompt-variants.json`;
  }

  /** Get the prompt variant to use for a context */
  async getVariant(_context: string): Promise<PromptVariant | null> {
    throw new Error('Not implemented');
  }

  /** Record result for a variant */
  async recordResult(_variantId: string, _result: {
    success: boolean;
    tokens: number;
    duration: number;
    cost: number;
  }): Promise<void> {
    throw new Error('Not implemented');
  }

  /** Generate a challenger variant */
  async generateChallenger(
    _context: string,
    _currentBest: PromptVariant,
    _strategy: 'shorten' | 'examples' | 'restructure',
  ): Promise<Result<PromptVariant>> {
    throw new Error('Not implemented');
  }

  /** Evaluate if we have a statistical winner (min 30 samples, chi-squared test) */
  async evaluateTest(_context: string): Promise<{
    hasWinner: boolean;
    winnerId?: string;
    confidence?: number;
    sampleSize: number;
  }> {
    throw new Error('Not implemented');
  }
}
