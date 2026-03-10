/**
 * LLM Client — Interface + implementations for zero-shot strategy synthesis.
 * MockLLMClient: deterministic, no I/O (tests + dev).
 * HttpLLMClient: OpenAI-compatible HTTP API (PRO license required).
 */

export interface SocialMessage {
  source: 'twitter' | 'telegram';
  text: string;
  timestamp: number;
  sentiment?: number; // -1 to 1
}

export interface StrategyRule {
  name: string;
  condition: string;    // human-readable condition
  action: 'buy' | 'sell' | 'hold';
  confidence: number;   // 0-1
  parameters: Record<string, number>;
}

export interface SentimentContext {
  messages: SocialMessage[];
  currentRegime: string;
  recentPrices: number[];
}

export interface LLMClient {
  generateStrategyRules(context: SentimentContext): Promise<StrategyRule[]>;
}

// ─── Mock LLM Client ─────────────────────────────────────────────────────────

/**
 * Deterministic mock — no network I/O. Safe for tests and dev mode.
 * Returns rules based on average sentiment of provided messages.
 */
export class MockLLMClient implements LLMClient {
  async generateStrategyRules(context: SentimentContext): Promise<StrategyRule[]> {
    const avgSentiment = context.messages.length > 0
      ? context.messages.reduce((sum, m) => sum + (m.sentiment ?? 0), 0) / context.messages.length
      : 0;

    const action: 'buy' | 'sell' | 'hold' =
      avgSentiment > 0.2 ? 'buy' :
      avgSentiment < -0.2 ? 'sell' : 'hold';

    return [
      {
        name: `mock-rule-${action}-${context.currentRegime}`,
        condition: `sentiment=${avgSentiment.toFixed(2)} regime=${context.currentRegime}`,
        action,
        confidence: Math.min(0.9, Math.abs(avgSentiment) + 0.3),
        parameters: {
          entryThreshold: 0.5,
          exitThreshold: 0.3,
          stopLossPercent: 2.0,
          takeProfitPercent: 4.0,
        },
      },
    ];
  }
}

// ─── HTTP LLM Client ─────────────────────────────────────────────────────────

/**
 * Real LLM client — calls OpenAI-compatible /v1/chat/completions.
 * Requires PRO license (caller must gate with LicenseService before instantiating).
 */
export class HttpLLMClient implements LLMClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async generateStrategyRules(context: SentimentContext): Promise<StrategyRule[]> {
    const prompt = this.buildPrompt(context);

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'You are a quantitative trading strategy synthesizer. Return ONLY valid JSON array of strategy rules.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
    const content = data.choices?.[0]?.message?.content ?? '[]';

    try {
      const parsed = JSON.parse(content) as StrategyRule[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private buildPrompt(context: SentimentContext): string {
    const recentMsgs = context.messages.slice(-5).map(m => m.text).join(' | ');
    const priceChange =
      context.recentPrices.length >= 2
        ? ((context.recentPrices[context.recentPrices.length - 1] - context.recentPrices[0]) /
            context.recentPrices[0]) * 100
        : 0;

    return (
      `Market regime: ${context.currentRegime}. ` +
      `Recent social sentiment: "${recentMsgs}". ` +
      `Price change: ${priceChange.toFixed(2)}%. ` +
      `Return JSON array of up to 3 StrategyRule objects with fields: ` +
      `name, condition, action (buy|sell|hold), confidence (0-1), parameters (object of numbers).`
    );
  }
}
