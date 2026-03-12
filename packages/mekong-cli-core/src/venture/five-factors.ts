/**
 * Five-Factor Evaluation Engine — 道天地將法
 *
 * Sun Tzu's five factors applied to startup/deal evaluation:
 * 道 Dao (20%): Mission-market fit
 * 天 Thien (25%): Timing and macro conditions
 * 地 Dia (20%): Competitive landscape and terrain
 * 將 Tuong (20%): Founder/leadership quality
 * 法 Phap (15%): Business model and systems
 *
 * Uses LLM for qualitative assessment, structured output as JSON.
 * Weights configurable in thesis.yaml.
 */

import type { FiveFactorEvaluation } from '../studio/types.js';
import type { Result } from '../types/common.js';

export type FactorName = 'dao' | 'thien' | 'dia' | 'tuong' | 'phap';

export interface EvaluationTarget {
  name: string;
  description: string;
  sector: string;
  founderInfo?: string;
  financials?: Record<string, unknown>;
  marketData?: string;
}

export class FiveFactorEngine {
  constructor(private llm: unknown, private weights?: Record<string, number>) {}

  /** Full five-factor evaluation */
  async evaluate(target: EvaluationTarget): Promise<Result<FiveFactorEvaluation>> {
    // 1. Evaluate each factor via LLM with structured output
    // 2. Calculate weighted composite score
    // 3. Generate recommendation based on thresholds:
    //    composite >= 70 → proceed
    //    composite 40-69 → pause (needs more investigation)
    //    composite < 40 → pass
    throw new Error('Not implemented');
  }

  /** Evaluate single factor */
  async evaluateFactor(factor: FactorName, context: string): Promise<{ score: number; reasoning: string }> {
    throw new Error('Not implemented');
  }
}
