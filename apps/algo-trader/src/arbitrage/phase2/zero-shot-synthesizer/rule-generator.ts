/**
 * RuleGenerator — Pipeline: social messages → sentiment → LLM → validated strategy rules.
 * Validation uses 24h rolling backtest; rules must exceed minSharpeRatio to be activated.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import { LLMClient, SocialMessage, StrategyRule, SentimentContext } from './llm-client';

export interface RuleGenConfig {
  minSharpeRatio?: number;       // default 1.5
  backtestWindowHours?: number;  // default 24
  maxRulesPerBatch?: number;     // default 3
}

export interface ValidationResult {
  approved: boolean;
  sharpeRatio: number;
  returns: number;
  maxDrawdown: number;
}

// Bullish/bearish keyword dictionaries for keyword-based sentiment scoring
const BULLISH_KEYWORDS = ['bull', 'moon', 'pump', 'buy', 'long', 'rally', 'surge', 'up', 'breakout', 'green'];
const BEARISH_KEYWORDS = ['bear', 'dump', 'sell', 'short', 'crash', 'down', 'dip', 'red', 'rekt', 'drop'];

export class RuleGenerator extends EventEmitter {
  private readonly config: Required<RuleGenConfig>;

  constructor(
    private readonly llmClient: LLMClient,
    config: RuleGenConfig = {},
  ) {
    super();
    this.config = {
      minSharpeRatio: config.minSharpeRatio ?? 1.5,
      backtestWindowHours: config.backtestWindowHours ?? 24,
      maxRulesPerBatch: config.maxRulesPerBatch ?? 3,
    };
  }

  /**
   * Assign sentiment scores to messages via keyword matching.
   * Returns new array with sentiment field populated.
   */
  analyzeSentiment(messages: SocialMessage[]): SocialMessage[] {
    return messages.map(msg => {
      const text = msg.text.toLowerCase();
      let score = 0;

      for (const word of BULLISH_KEYWORDS) {
        if (text.includes(word)) score += 0.2;
      }
      for (const word of BEARISH_KEYWORDS) {
        if (text.includes(word)) score -= 0.2;
      }

      // Clamp to [-1, 1]
      const sentiment = Math.max(-1, Math.min(1, score));
      return { ...msg, sentiment };
    });
  }

  /**
   * Call LLM to generate strategy rules given sentiment context.
   */
  async generateRules(
    messages: SocialMessage[],
    regime: string,
    prices: number[],
  ): Promise<StrategyRule[]> {
    const context: SentimentContext = {
      messages,
      currentRegime: regime,
      recentPrices: prices,
    };

    try {
      const rules = await this.llmClient.generateStrategyRules(context);
      return rules.slice(0, this.config.maxRulesPerBatch);
    } catch (err) {
      logger.error(`[RuleGenerator] LLM call failed: ${(err as Error).message}`);
      return [];
    }
  }

  /**
   * Validate rule via simple price-return backtest over the configured window.
   * Simulates: buy-and-hold when action=buy, short when action=sell, flat when hold.
   * Returns ValidationResult — approved iff sharpeRatio >= minSharpeRatio.
   */
  validateRule(rule: StrategyRule, historicalPrices: number[]): ValidationResult {
    if (historicalPrices.length < 2) {
      return { approved: false, sharpeRatio: 0, returns: 0, maxDrawdown: 0 };
    }

    // Compute per-period returns based on rule action
    const periodReturns: number[] = [];
    for (let i = 1; i < historicalPrices.length; i++) {
      const raw = (historicalPrices[i] - historicalPrices[i - 1]) / historicalPrices[i - 1];
      const ret = rule.action === 'buy' ? raw : rule.action === 'sell' ? -raw : 0;
      periodReturns.push(ret);
    }

    const totalReturn = periodReturns.reduce((a, b) => a + b, 0);
    const mean = totalReturn / periodReturns.length;
    const variance =
      periodReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / periodReturns.length;
    const stdDev = Math.sqrt(variance);

    // Sharpe: mean / stdDev (annualised approximation — good enough for validation gate)
    const sharpeRatio = stdDev === 0 ? 0 : mean / stdDev;

    // Max drawdown calculation
    let peak = historicalPrices[0];
    let maxDrawdown = 0;
    for (const price of historicalPrices) {
      if (price > peak) peak = price;
      const drawdown = (peak - price) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    const approved = sharpeRatio >= this.config.minSharpeRatio;

    logger.debug(
      `[RuleGenerator] validate "${rule.name}" sharpe=${sharpeRatio.toFixed(3)} ` +
        `returns=${(totalReturn * 100).toFixed(2)}% maxDD=${(maxDrawdown * 100).toFixed(2)}% ` +
        `approved=${approved}`,
    );

    return { approved, sharpeRatio, returns: totalReturn, maxDrawdown };
  }

  /**
   * Full pipeline: analyze sentiment → generate rules → validate → return approved rules.
   * Emits 'rules:approved' with the approved rule set.
   */
  async pipeline(
    messages: SocialMessage[],
    regime: string,
    prices: number[],
  ): Promise<StrategyRule[]> {
    const scoredMessages = this.analyzeSentiment(messages);
    const rules = await this.generateRules(scoredMessages, regime, prices);

    const approved: StrategyRule[] = [];
    for (const rule of rules) {
      const validation = this.validateRule(rule, prices);
      if (validation.approved) {
        approved.push(rule);
        this.emit('rule:validated', { rule, validation });
      } else {
        logger.debug(`[RuleGenerator] Rule "${rule.name}" rejected — sharpe too low`);
      }
    }

    if (approved.length > 0) {
      this.emit('rules:approved', approved);
    }

    return approved;
  }
}
