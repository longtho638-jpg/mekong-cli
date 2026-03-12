/**
 * Prompt Refiner — optimize prompts via A/B testing.
 * ROI: Operational ROI — reduces token cost and improves success rate automatically.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { PromptVariant } from './types.js';
import type { LlmRouter } from '../llm/router.js';
import { ok, err } from '../types/common.js';
import type { Result } from '../types/common.js';

const MIN_SAMPLES = 30;

export class PromptRefiner {
  private readonly variantsPath: string;

  constructor(dataDir: string, private readonly llm: LlmRouter) {
    this.variantsPath = `${dataDir}/prompt-variants.json`;
  }

  /** Get the prompt variant to use for a context */
  async getVariant(context: string): Promise<PromptVariant | null> {
    const variants = await this.loadVariants();
    const contextVars = variants.filter(v => v.targetContext === context && v.isActive);
    if (contextVars.length === 0) return null;
    if (contextVars.length === 1) return contextVars[0];
    // A/B: pick random active variant
    return contextVars[Math.floor(Math.random() * contextVars.length)];
  }

  /** Record result for a variant */
  async recordResult(variantId: string, result: {
    success: boolean;
    tokens: number;
    duration: number;
    cost: number;
  }): Promise<void> {
    const variants = await this.loadVariants();
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    const m = variant.metrics;
    const n = m.uses;
    m.successRate = (m.successRate * n + (result.success ? 1 : 0)) / (n + 1);
    m.avgTokens = (m.avgTokens * n + result.tokens) / (n + 1);
    m.avgDuration = (m.avgDuration * n + result.duration) / (n + 1);
    m.avgCost = (m.avgCost * n + result.cost) / (n + 1);
    m.uses = n + 1;

    await this.saveVariants(variants);
  }

  /** Generate a challenger variant via LLM */
  async generateChallenger(
    context: string,
    currentBest: PromptVariant,
    strategy: 'shorten' | 'examples' | 'restructure',
  ): Promise<Result<PromptVariant>> {
    const strategyPrompts: Record<string, string> = {
      shorten: 'Make this prompt shorter while preserving accuracy. Remove redundant words.',
      examples: 'Add 1-2 concrete examples to this prompt to improve accuracy.',
      restructure: 'Restructure this prompt using a different reasoning approach (e.g., chain-of-thought, step-by-step).',
    };

    try {
      const response = await this.llm.chat({
        messages: [{
          role: 'user',
          content: `${strategyPrompts[strategy]}\n\nOriginal prompt:\n${currentBest.promptText}\n\nReturn ONLY the improved prompt text.`,
        }],
        model: 'default',
      });

      const variant: PromptVariant = {
        id: `pv-${Date.now()}`,
        name: `${context}-${strategy}-challenger`,
        targetContext: context,
        promptText: response.content,
        metrics: { uses: 0, successRate: 0, avgTokens: 0, avgDuration: 0, avgCost: 0 },
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const variants = await this.loadVariants();
      variants.push(variant);
      await this.saveVariants(variants);
      return ok(variant);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /** Evaluate if we have a statistical winner (simplified chi-squared) */
  async evaluateTest(context: string): Promise<{
    hasWinner: boolean;
    winnerId?: string;
    confidence?: number;
    sampleSize: number;
  }> {
    const variants = await this.loadVariants();
    const contextVars = variants.filter(v => v.targetContext === context && v.isActive);
    const totalSamples = contextVars.reduce((s, v) => s + v.metrics.uses, 0);

    if (contextVars.length < 2 || contextVars.some(v => v.metrics.uses < MIN_SAMPLES)) {
      return { hasWinner: false, sampleSize: totalSamples };
    }

    // Sort by success rate, pick best
    const sorted = [...contextVars].sort((a, b) => b.metrics.successRate - a.metrics.successRate);
    const best = sorted[0];
    const second = sorted[1];
    const diff = best.metrics.successRate - second.metrics.successRate;

    // Simplified significance: if diff > 10% with 30+ samples each, declare winner
    if (diff > 0.1) {
      return {
        hasWinner: true,
        winnerId: best.id,
        confidence: Math.min(0.95, 0.5 + diff * 2),
        sampleSize: totalSamples,
      };
    }

    return { hasWinner: false, sampleSize: totalSamples };
  }

  private async loadVariants(): Promise<PromptVariant[]> {
    try {
      const content = await readFile(this.variantsPath, 'utf-8');
      return JSON.parse(content) as PromptVariant[];
    } catch {
      return [];
    }
  }

  private async saveVariants(variants: PromptVariant[]): Promise<void> {
    await mkdir(dirname(this.variantsPath), { recursive: true });
    await writeFile(this.variantsPath, JSON.stringify(variants, null, 2));
  }
}
