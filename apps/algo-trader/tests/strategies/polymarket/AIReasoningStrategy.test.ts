/**
 * AI Reasoning Strategy Tests
 */

import { AIReasoningStrategy, LLMResponse } from '../../../src/strategies/polymarket/AIReasoningStrategy';
import { IMarketTick } from '../../../src/interfaces/IPolymarket';

describe('AIReasoningStrategy', () => {
  let strategy: AIReasoningStrategy;

  beforeEach(() => {
    strategy = new AIReasoningStrategy();
  });

  describe('initialization', () => {
    it('should initialize with default config', async () => {
      await strategy.init([]);
      const config = strategy.getConfig();

      expect(config.minEdgeThreshold).toBe(0.08);
      expect(config.maxPositionSize).toBe(30);
      expect(config.provider).toBe('ensemble');
      expect(config.confidenceThreshold).toBe(0.6);
      expect(config.contextWindow).toBe(4000);
    });

    it('should accept custom config', async () => {
      await strategy.init([], {
        minEdgeThreshold: 0.10,
        maxPositionSize: 50,
        provider: 'claude',
        confidenceThreshold: 0.7,
      });

      const config = strategy.getConfig();
      expect(config.minEdgeThreshold).toBe(0.10);
      expect(config.provider).toBe('claude');
      expect(config.confidenceThreshold).toBe(0.7);
    });
  });

  describe('config schema', () => {
    it('should return valid schema', () => {
      const schema = strategy.getConfigSchema();

      expect(schema.minEdgeThreshold).toBeDefined();
      expect(schema.maxPositionSize).toBeDefined();
      expect(schema.provider).toBeDefined();
      expect(schema.confidenceThreshold).toBeDefined();
      expect(schema.contextWindow).toBeDefined();
    });
  });

  describe('LLM response management', () => {
    it('should store LLM responses by token', () => {
      const response: LLMResponse = {
        provider: 'claude',
        probability: 0.65,
        confidence: 0.8,
        reasoning: 'Based on current trends...',
        timestamp: Date.now(),
      };

      strategy.addLLMResponse('token-1', response);

      const responses = (strategy as any).llmResponses.get('token-1');
      expect(responses).toHaveLength(1);
      expect(responses[0].probability).toBe(0.65);
    });

    it('should keep only last 5 responses', () => {
      for (let i = 1; i <= 7; i++) {
        strategy.addLLMResponse('token-1', {
          provider: 'claude',
          probability: i * 0.1,
          confidence: 0.8,
          reasoning: `Response ${i}`,
          timestamp: Date.now(),
        });
      }

      const responses = (strategy as any).llmResponses.get('token-1');
      expect(responses).toHaveLength(5);
      expect(responses[0].probability).toBe(0.3); // Started from response 3
    });

    it('should clear cached responses', () => {
      strategy.addLLMResponse('token-1', {
        provider: 'claude',
        probability: 0.6,
        confidence: 0.8,
        reasoning: 'Test',
        timestamp: Date.now(),
      });

      strategy.clearResponses('token-1');

      const responses = (strategy as any).llmResponses.get('token-1');
      expect(responses).toBeUndefined();
    });
  });

  describe('fair value calculation', () => {
    it('should calculate weighted average by confidence', async () => {
      strategy.addLLMResponse('token-1', {
        provider: 'claude',
        probability: 0.7,
        confidence: 0.9,
        reasoning: 'High confidence',
        timestamp: Date.now(),
      });

      strategy.addLLMResponse('token-1', {
        provider: 'ollama',
        probability: 0.5,
        confidence: 0.5,
        reasoning: 'Low confidence',
        timestamp: Date.now(),
      });

      const fairValue = await strategy.calculateFairValue('token-1');

      // Weighted: (0.7*0.9 + 0.5*0.5) / (0.9 + 0.5) = (0.63 + 0.25) / 1.4 = 0.629
      expect(fairValue).toBeCloseTo(0.63, 2);
    });

    it('should return 0.5 when total weight is 0', async () => {
      strategy.addLLMResponse('token-1', {
        provider: 'claude',
        probability: 0.6,
        confidence: 0,
        reasoning: 'Zero confidence',
        timestamp: Date.now(),
      });

      const fairValue = await strategy.calculateFairValue('token-1');

      expect(fairValue).toBe(0.5);
    });

    it('should return null when no responses', async () => {
      const fairValue = await strategy.calculateFairValue('token-1');

      expect(fairValue).toBeNull();
    });
  });

  describe('signal generation', () => {
    const createTick = (tokenId: string, yesPrice: number, noPrice: number): IMarketTick => ({
      tokenId,
      marketId: 'market-1',
      yesBid: yesPrice - 0.005,
      yesAsk: yesPrice + 0.005,
      yesPrice,
      noPrice,
      spread: 0.01,
      volume: 1000,
      liquidity: 5000,
      timestamp: Date.now(),
    });

    it('should return null when no LLM responses', async () => {
      const tick = createTick('token-1', 0.50, 0.50);
      const signal = await strategy.generateSignal('token-1', 'market-1', tick);

      expect(signal).toBeNull();
    });

    it('should return null when avg confidence below threshold', async () => {
      strategy.addLLMResponse('token-1', {
        provider: 'claude',
        probability: 0.7,
        confidence: 0.4, // Below 0.6 threshold
        reasoning: 'Low confidence',
        timestamp: Date.now(),
      });

      const tick = createTick('token-1', 0.40, 0.60);
      const signal = await strategy.generateSignal('token-1', 'market-1', tick);

      expect(signal).toBeNull();
    });

    it('should generate BUY_YES when fair value > market', async () => {
      strategy.addLLMResponse('token-1', {
        provider: 'claude',
        probability: 0.75,
        confidence: 0.8,
        reasoning: 'Strong bullish signal',
        timestamp: Date.now(),
      });

      const tick = createTick('token-1', 0.50, 0.50); // Market undervalues
      const signal = await strategy.generateSignal('token-1', 'market-1', tick);

      expect(signal).toBeTruthy();
      expect(signal?.side).toBe('YES');
      expect(signal?.action).toBe('BUY');
      expect(signal?.confidence).toBe(0.8);
    });

    it('should generate BUY_NO when fair value < market', async () => {
      strategy.addLLMResponse('token-1', {
        provider: 'claude',
        probability: 0.30,
        confidence: 0.7,
        reasoning: 'Bearish outlook',
        timestamp: Date.now(),
      });

      const tick = createTick('token-1', 0.55, 0.45); // Market overvalues
      const signal = await strategy.generateSignal('token-1', 'market-1', tick);

      expect(signal).toBeTruthy();
      expect(signal?.side).toBe('NO');
      expect(signal?.action).toBe('BUY');
    });

    it('should return null when edge below threshold', async () => {
      strategy.addLLMResponse('token-1', {
        provider: 'claude',
        probability: 0.52,
        confidence: 0.8,
        reasoning: 'Slight edge',
        timestamp: Date.now(),
      });

      const tick = createTick('token-1', 0.50, 0.50);
      const signal = await strategy.generateSignal('token-1', 'market-1', tick);

      expect(signal).toBeNull();
    });

    it('should include reasoning in metadata', async () => {
      const reasoning = 'This is a detailed analysis of the market conditions based on multiple factors...';
      strategy.addLLMResponse('token-1', {
        provider: 'claude',
        probability: 0.75,
        confidence: 0.8,
        reasoning: reasoning,
        timestamp: Date.now(),
      });

      const tick = createTick('token-1', 0.50, 0.50);
      const signal = await strategy.generateSignal('token-1', 'market-1', tick);

      expect(signal?.metadata?.reasoning).toBeDefined();
      expect(signal?.metadata?.reasoning?.length).toBeLessThanOrEqual(200);
    });
  });

  describe('processTick', () => {
    const createTick = (tokenId: string, yesPrice: number, noPrice: number): IMarketTick => ({
      tokenId,
      marketId: 'market-1',
      yesBid: yesPrice - 0.005,
      yesAsk: yesPrice + 0.005,
      yesPrice,
      noPrice,
      spread: 0.01,
      volume: 1000,
      liquidity: 5000,
      timestamp: Date.now(),
    });

    it('should process tick and potentially return signal', async () => {
      strategy.addLLMResponse('token-1', {
        provider: 'claude',
        probability: 0.75,
        confidence: 0.8,
        reasoning: 'Test',
        timestamp: Date.now(),
      });

      const tick = createTick('token-1', 0.50, 0.50);
      const signal = strategy.processTick(tick);

      expect(signal).toBeTruthy();
    });
  });
});
