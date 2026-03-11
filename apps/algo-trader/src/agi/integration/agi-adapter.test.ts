import { AGIAdapter } from './agi-adapter';
import { OllamaClient } from '../clients/ollama-client';
import { SOPEngine } from '../engine/sop-engine';

jest.mock('../clients/ollama-client');
jest.mock('../engine/sop-engine');

describe('AGIAdapter', () => {
  let agiAdapter: AGIAdapter;
  let mockOllamaClient: jest.Mocked<OllamaClient>;
  let mockSOPEngine: jest.Mocked<SOPEngine>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOllamaClient = new OllamaClient() as jest.Mocked<OllamaClient>;
    mockSOPEngine = new SOPEngine(mockOllamaClient) as jest.Mocked<SOPEngine>;

    (SOPEngine as jest.Mock).mockImplementation(() => mockSOPEngine);
    (OllamaClient as jest.Mock).mockImplementation(() => mockOllamaClient);

    agiAdapter = new AGIAdapter({
      enabled: true,
      ollamaBaseUrl: 'http://localhost:11434',
      model: 'llama3.1:8b',
      timeoutMs: 5000,
      minConfidence: 0.6,
      fallbackToRules: true,
    });
  });

  describe('constructor', () => {
    it('should use default config when no config provided', () => {
      const defaultAdapter = new AGIAdapter();
      expect(defaultAdapter).toBeDefined();
      expect(defaultAdapter.isEnabled()).toBe(true);
    });

    it('should merge custom config with defaults', () => {
      const customAdapter = new AGIAdapter({
        enabled: false,
        model: 'custom-model',
      });
      expect(customAdapter.isEnabled()).toBe(false);
    });
  });

  describe('enhanceSignal()', () => {
    const mockSignal = {
      type: 'BUY' as const,
      symbol: 'BTC/USDT',
      timestamp: Date.now(),
      indicators: { rsi: 75, macd: 0.5 },
      price: 50000,
    };

    it('should pass through when AGI disabled', async () => {
      const disabledAdapter = new AGIAdapter({ enabled: false });
      const result = await disabledAdapter.enhanceSignal(mockSignal);

      expect(result.agiEnhanced).toBe(false);
      expect(result.usedFallback).toBe(false);
      expect(result.combinedAction).toBe('BUY');
    });

    it('should enhance signal when AGI enabled and SOP triggered', async () => {
      mockSOPEngine.evaluate.mockResolvedValue([
        {
          sopId: 'sop-rsi-overbought',
          action: 'SELL',
          confidence: 0.75,
          reasoning: 'RSI overbought',
          triggeredAt: Date.now(),
          latency: 100,
        },
      ]);

      const result = await agiAdapter.enhanceSignal(mockSignal);

      expect(result.agiEnhanced).toBe(true);
      expect(result.confidence).toBe(0.75);
      expect(result.combinedAction).toBe('SELL');
    });

    it('should fallback when no SOP triggered', async () => {
      mockSOPEngine.evaluate.mockResolvedValue([]);

      const result = await agiAdapter.enhanceSignal(mockSignal);

      expect(result.agiEnhanced).toBe(false);
      expect(result.usedFallback).toBe(true);
      expect(result.combinedAction).toBe('BUY');
    });

    it('should fallback when confidence below threshold', async () => {
      mockSOPEngine.evaluate.mockResolvedValue([
        {
          sopId: 'sop-test',
          action: 'BUY',
          confidence: 0.4,
          reasoning: 'Low confidence',
          triggeredAt: Date.now(),
          latency: 100,
        },
      ]);

      const result = await agiAdapter.enhanceSignal(mockSignal);

      expect(result.agiEnhanced).toBe(false);
      expect(result.usedFallback).toBe(true);
      expect(result.confidence).toBe(0.4);
    });

    it('should handle AGI errors gracefully', async () => {
      mockSOPEngine.evaluate.mockRejectedValue(new Error('AGI error'));

      const result = await agiAdapter.enhanceSignal(mockSignal);

      expect(result.agiEnhanced).toBe(false);
      expect(result.usedFallback).toBe(true);
      expect(result.combinedAction).toBe('BUY');
    });

    it('should use highest confidence decision when multiple SOPs trigger', async () => {
      mockSOPEngine.evaluate.mockResolvedValue([
        {
          sopId: 'sop-1',
          action: 'BUY',
          confidence: 0.65,
          reasoning: 'First',
          triggeredAt: Date.now(),
          latency: 100,
        },
        {
          sopId: 'sop-2',
          action: 'SELL',
          confidence: 0.85,
          reasoning: 'Second',
          triggeredAt: Date.now(),
          latency: 150,
        },
      ]);

      const result = await agiAdapter.enhanceSignal(mockSignal);

      expect(result.agiEnhanced).toBe(true);
      expect(result.confidence).toBe(0.85);
      expect(result.combinedAction).toBe('SELL');
    });
  });

  describe('getMetrics()', () => {
    it('should return initial metrics', () => {
      const adapter = new AGIAdapter({ enabled: false });
      const metrics = adapter.getMetrics();

      expect(metrics.totalSignals).toBe(0);
      expect(metrics.agiEnhancedSignals).toBe(0);
      expect(metrics.fallbackSignals).toBe(0);
      expect(metrics.avgConfidence).toBe(0);
      expect(metrics.avgLatencyMs).toBe(0);
    });

    it('should track metrics after signal enhancement', async () => {
      mockSOPEngine.evaluate.mockResolvedValue([
        {
          sopId: 'sop-test',
          action: 'BUY',
          confidence: 0.8,
          reasoning: 'Test',
          triggeredAt: Date.now(),
          latency: 100,
        },
      ]);

      await agiAdapter.enhanceSignal({
        type: 'BUY',
        symbol: 'BTC/USDT',
        timestamp: Date.now(),
        price: 50000,
        indicators: { rsi: 75 },
      });
      const metrics = agiAdapter.getMetrics();

      expect(metrics.totalSignals).toBe(1);
      expect(metrics.agiEnhancedSignals).toBe(1);
      expect(metrics.avgConfidence).toBeGreaterThan(0);
    });
  });

  describe('resetMetrics()', () => {
    it('should reset all metrics to zero', async () => {
      mockSOPEngine.evaluate.mockResolvedValue([
        {
          sopId: 'sop-test',
          action: 'BUY',
          confidence: 0.8,
          reasoning: 'Test',
          triggeredAt: Date.now(),
          latency: 100,
        },
      ]);

      await agiAdapter.enhanceSignal({
        type: 'BUY',
        symbol: 'BTC/USDT',
        timestamp: Date.now(),
        price: 50000,
      });
      agiAdapter.resetMetrics();
      const metrics = agiAdapter.getMetrics();

      expect(metrics.totalSignals).toBe(0);
      expect(metrics.agiEnhancedSignals).toBe(0);
      expect(metrics.avgConfidence).toBe(0);
      expect(metrics.avgLatencyMs).toBe(0);
    });
  });

  describe('setEnabled()', () => {
    it('should enable AGI', () => {
      const adapter = new AGIAdapter({ enabled: false });
      adapter.setEnabled(true);
      expect(adapter.isEnabled()).toBe(true);
    });

    it('should disable AGI', () => {
      const adapter = new AGIAdapter({ enabled: true });
      adapter.setEnabled(false);
      expect(adapter.isEnabled()).toBe(false);
    });
  });

  describe('getSOPStats()', () => {
    it('should return SOP statistics', () => {
      mockSOPEngine.getStats.mockReturnValue({
        totalSOPs: 5,
        enabledSOPs: 3,
        decisionCount: 0,
      });

      const stats = agiAdapter.getSOPStats();

      expect(stats.totalSOPs).toBe(5);
      expect(stats.enabledSOPs).toBe(3);
      expect(stats.decisionCount).toBe(0);
    });
  });
});
