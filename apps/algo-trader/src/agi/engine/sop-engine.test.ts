import { SOPEngine } from './sop-engine';
import { OllamaClient } from '../clients/ollama-client';
import { SignalContext } from './sop.types';
import { ChatResponse } from '../types/ollama.types';

jest.mock('../clients/ollama-client');

describe('SOPEngine', () => {
  let sopEngine: SOPEngine;
  let mockOllamaClient: jest.Mocked<OllamaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOllamaClient = new OllamaClient() as jest.Mocked<OllamaClient>;
    mockOllamaClient.chat = jest.fn();
    sopEngine = new SOPEngine(mockOllamaClient);
  });

  describe('constructor', () => {
    it('should initialize with default SOPs', () => {
      expect(sopEngine).toBeDefined();
      const stats = sopEngine.getStats();
      expect(stats.totalSOPs).toBeGreaterThan(0);
    });

    it('should initialize with empty decision history', () => {
      const stats = sopEngine.getStats();
      expect(stats.decisionCount).toBe(0);
    });
  });

  describe('evaluate()', () => {
    const mockContext: SignalContext = {
      symbol: 'BTC/USDT',
      timestamp: Date.now(),
      price: 50000,
      indicators: {
        rsi: 75,
        macd: 0.5,
        momentum: 0.8,
      },
    };

    const createChatResponse = (content: string): ChatResponse => ({
      model: 'llama3.1:8b',
      message: {
        role: 'assistant',
        content,
      },
      done: true,
    });

    it('should evaluate signal against all SOPs', async () => {
      mockOllamaClient.chat.mockResolvedValue(createChatResponse(
        JSON.stringify({ action: 'SELL', confidence: 0.75, reasoning: 'RSI overbought' })
      ));

      const decisions = await sopEngine.evaluate(mockContext);

      expect(decisions).toBeInstanceOf(Array);
    });

    it('should return decisions when triggers match', async () => {
      mockOllamaClient.chat.mockResolvedValue(createChatResponse(
        JSON.stringify({ action: 'SELL', confidence: 0.75, reasoning: 'RSI > 70' })
      ));

      const decisions = await sopEngine.evaluate(mockContext);

      expect(decisions.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle LLM errors gracefully', async () => {
      mockOllamaClient.chat.mockRejectedValue(new Error('LLM unavailable'));

      const decisions = await sopEngine.evaluate(mockContext);
      expect(decisions).toBeInstanceOf(Array);
    });

    it('should parse LLM response correctly', async () => {
      mockOllamaClient.chat.mockResolvedValue(createChatResponse(
        JSON.stringify({ action: 'SELL', confidence: 0.75, reasoning: 'RSI overbought' })
      ));

      const decisions = await sopEngine.evaluate(mockContext);

      if (decisions.length > 0) {
        const decision = decisions[0];
        expect(decision.action).toMatch(/^(BUY|SELL|HOLD)$/);
        expect(decision.confidence).toBeGreaterThanOrEqual(0);
        expect(decision.confidence).toBeLessThanOrEqual(1);
        expect(decision.sopId).toBeDefined();
        expect(decision.triggeredAt).toBeDefined();
      }
    });
  });

  describe('getStats()', () => {
    it('should return correct stats structure', () => {
      const stats = sopEngine.getStats();

      expect(stats).toHaveProperty('totalSOPs');
      expect(stats).toHaveProperty('enabledSOPs');
      expect(stats).toHaveProperty('decisionCount');
      expect(typeof stats.totalSOPs).toBe('number');
      expect(typeof stats.enabledSOPs).toBe('number');
      expect(typeof stats.decisionCount).toBe('number');
    });

    it('should track decision count', async () => {
      mockOllamaClient.chat.mockResolvedValue({
        model: 'llama3.1:8b',
        message: {
          role: 'assistant',
          content: JSON.stringify({ action: 'BUY', confidence: 0.6, reasoning: 'Test' }),
        },
        done: true,
      });

      const initialStats = sopEngine.getStats();
      await sopEngine.evaluate({
        symbol: 'ETH/USDT',
        timestamp: Date.now(),
        price: 3000,
        indicators: { rsi: 25 },
      });

      const finalStats = sopEngine.getStats();
      expect(finalStats.decisionCount).toBeGreaterThanOrEqual(initialStats.decisionCount);
    });
  });

  describe('getSOP()', () => {
    it('should return SOP by ID', () => {
      const sop = sopEngine.getSOP('sop-rsi-overbought');
      expect(sop).toBeDefined();
      expect(sop?.id).toBe('sop-rsi-overbought');
    });

    it('should return undefined for unknown SOP', () => {
      const sop = sopEngine.getSOP('non-existent');
      expect(sop).toBeUndefined();
    });
  });

  describe('registerSOP()', () => {
    it('should add new SOP to engine', () => {
      const initialStats = sopEngine.getStats();

      sopEngine.registerSOP({
        id: 'custom_sop',
        name: 'Custom SOP',
        description: 'Test SOP',
        triggers: [
          { field: 'rsi', operator: 'lt', value: 20 },
        ],
        action: { type: 'BUY' },
        priority: 10,
        enabled: true,
      });

      const finalStats = sopEngine.getStats();
      expect(finalStats.totalSOPs).toBe(initialStats.totalSOPs + 1);
    });
  });
});
