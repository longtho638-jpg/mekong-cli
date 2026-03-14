/**
 * Five-Factor Evaluation Engine — 道天地將法
 * Sun Tzu's five factors applied to startup/deal evaluation.
 */

import type { FiveFactorEvaluation } from '../studio/types.js';
import { ok, err, type Result } from '../types/common.js';

export type FactorName = 'dao' | 'thien' | 'dia' | 'tuong' | 'phap';

export interface EvaluationTarget {
  name: string;
  description: string;
  sector: string;
  founderInfo?: string;
  financials?: Record<string, unknown>;
  marketData?: string;
}

type LlmClient = { chat?: (req: { messages: Array<{ role: string; content: string }> }) => Promise<{ content: string }> };

const DEFAULT_WEIGHTS: Record<FactorName, number> = {
  dao: 0.20, thien: 0.25, dia: 0.20, tuong: 0.20, phap: 0.15,
};

const FACTOR_PROMPTS: Record<FactorName, string> = {
  dao: 'Evaluate mission-market fit (道). Is there a clear problem-solution fit? Score 0-100.',
  thien: 'Evaluate timing and macro conditions (天). Is the market timing right? Score 0-100.',
  dia: 'Evaluate competitive landscape (地). How defensible is the position? Score 0-100.',
  tuong: 'Evaluate founder/leadership quality (將). Are they the right team? Score 0-100.',
  phap: 'Evaluate business model and systems (法). Is the model scalable? Score 0-100.',
};

export class FiveFactorEngine {
  private weights: Record<FactorName, number>;

  constructor(private llm: unknown, weights?: Record<string, number>) {
    this.weights = { ...DEFAULT_WEIGHTS, ...(weights as Record<FactorName, number> | undefined) };
  }

  async evaluate(target: EvaluationTarget): Promise<Result<FiveFactorEvaluation>> {
    const factors: FactorName[] = ['dao', 'thien', 'dia', 'tuong', 'phap'];
    const context = `Company: ${target.name}\nSector: ${target.sector}\nDescription: ${target.description}\nFounder: ${target.founderInfo ?? 'N/A'}\nMarket: ${target.marketData ?? 'N/A'}`;

    const results: Record<string, { score: number; reasoning: string }> = {};
    for (const factor of factors) {
      results[factor] = await this.evaluateFactor(factor, context);
    }

    const composite = factors.reduce((sum, f) => sum + results[f].score * this.weights[f], 0);
    const compositeScore = Math.round(composite);
    const recommendation = compositeScore >= 70 ? 'proceed' : compositeScore >= 40 ? 'pause' : 'pass';

    const evaluation: FiveFactorEvaluation = {
      targetName: target.name,
      evaluatedAt: new Date().toISOString(),
      dao: { score: results.dao.score, reasoning: results.dao.reasoning },
      thien: { score: results.thien.score, reasoning: results.thien.reasoning, signals: [] },
      dia: { score: results.dia.score, reasoning: results.dia.reasoning, terrain: 'accessible' },
      tuong: { score: results.tuong.score, reasoning: results.tuong.reasoning, virtues: {} },
      phap: { score: results.phap.score, reasoning: results.phap.reasoning },
      compositeScore,
      recommendation,
      confidence: 0.7,
    };
    return ok(evaluation);
  }

  async evaluateFactor(factor: FactorName, context: string): Promise<{ score: number; reasoning: string }> {
    const client = this.llm as LlmClient;
    if (!client?.chat) return { score: 50, reasoning: 'LLM unavailable — default score' };

    try {
      const resp = await client.chat({
        messages: [{ role: 'user', content: `${FACTOR_PROMPTS[factor]}\n\nContext:\n${context}\n\nReturn JSON: {"score": number, "reasoning": "string"}` }],
      });
      const parsed = JSON.parse(resp.content) as { score: number; reasoning: string };
      return { score: parsed.score ?? 50, reasoning: parsed.reasoning ?? 'AI evaluated' };
    } catch {
      return { score: 50, reasoning: 'LLM unavailable — default score' };
    }
  }
}
