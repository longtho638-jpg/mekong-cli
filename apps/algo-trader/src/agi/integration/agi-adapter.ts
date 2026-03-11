import { OllamaClient } from '../clients/ollama-client';
import { SOPEngine } from '../engine/sop-engine';
import { SignalContext } from '../engine/sop.types';
import { AGIIntegrationConfig, AGIEnhancedSignal, AGIMetrics } from './agi.types';

const DEFAULT_CONFIG: AGIIntegrationConfig = {
  enabled: true,
  ollamaBaseUrl: 'http://localhost:11434',
  model: 'llama3.1:8b',
  timeoutMs: 5000,
  fallbackToRules: true,
  minConfidence: 0.6,
};

/**
 * AGI Adapter - Wraps AGI components for BotEngine integration
 */
export class AGIAdapter {
  private config: AGIIntegrationConfig;
  private ollamaClient: OllamaClient;
  private sopEngine: SOPEngine;
  private metrics: AGIMetrics = {
    totalSignals: 0,
    agiEnhancedSignals: 0,
    fallbackSignals: 0,
    avgConfidence: 0,
    avgLatencyMs: 0,
  };
  private latencySum = 0;

  constructor(config: Partial<AGIIntegrationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.ollamaClient = new OllamaClient({
      baseURL: this.config.ollamaBaseUrl,
      model: this.config.model,
      timeout: this.config.timeoutMs,
    });
    this.sopEngine = new SOPEngine(this.ollamaClient);
  }

  /**
   * Enhance a trading signal with AGI analysis
   */
  async enhanceSignal(signal: {
    type: 'BUY' | 'SELL' | 'HOLD';
    symbol: string;
    timestamp: number;
    indicators?: Record<string, number>;
    price?: number;
  }): Promise<AGIEnhancedSignal> {
    this.metrics.totalSignals++;

    // If AGI disabled, pass through
    if (!this.config.enabled) {
      return {
        originalSignal: signal,
        agiEnhanced: false,
        usedFallback: false,
        confidence: 0.5,
        combinedAction: signal.type,
      };
    }

    const startTime = Date.now();

    try {
      // Convert to signal context for SOP evaluation
      const context: SignalContext = {
        symbol: signal.symbol,
        timestamp: signal.timestamp,
        price: signal.price || 0,
        indicators: signal.indicators || {},
      };

      // Evaluate against SOPs
      const decisions = await this.sopEngine.evaluate(context);

      if (decisions.length === 0) {
        // No SOP triggered - use fallback
        this.metrics.fallbackSignals++;
        return {
          originalSignal: signal,
          agiEnhanced: false,
          usedFallback: this.config.fallbackToRules,
          confidence: 0.5,
          combinedAction: signal.type,
        };
      }

      // Use highest confidence decision
      const bestDecision = decisions.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );

      const latency = Date.now() - startTime;
      this.updateMetrics(latency, bestDecision.confidence, true);

      // Check confidence threshold
      if (bestDecision.confidence < this.config.minConfidence) {
        // Below threshold - fallback to rules
        this.metrics.fallbackSignals++;
        return {
          originalSignal: signal,
          agiEnhanced: false,
          usedFallback: true,
          confidence: bestDecision.confidence,
          combinedAction: signal.type,
        };
      }

      // AGI decision approved
      return {
        originalSignal: signal,
        agiDecision: bestDecision,
        agiEnhanced: true,
        usedFallback: false,
        confidence: bestDecision.confidence,
        combinedAction: bestDecision.action,
      };
    } catch (error) {
      console.error('[AGIAdapter] Error enhancing signal:', error);
      this.metrics.fallbackSignals++;

      // Fallback to original signal
      return {
        originalSignal: signal,
        agiEnhanced: false,
        usedFallback: this.config.fallbackToRules,
        confidence: 0.5,
        combinedAction: signal.type,
      };
    }
  }

  /**
   * Update metrics
   */
  private updateMetrics(latency: number, confidence: number, enhanced: boolean) {
    if (enhanced) {
      this.metrics.agiEnhancedSignals++;
    }
    this.latencySum += latency;
    this.metrics.avgLatencyMs = this.latencySum / this.metrics.totalSignals;
    this.metrics.avgConfidence =
      (this.metrics.avgConfidence * (this.metrics.agiEnhancedSignals - 1) + confidence) /
      this.metrics.agiEnhancedSignals;
  }

  /**
   * Get current metrics
   */
  getMetrics(): AGIMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalSignals: 0,
      agiEnhancedSignals: 0,
      fallbackSignals: 0,
      avgConfidence: 0,
      avgLatencyMs: 0,
    };
    this.latencySum = 0;
  }

  /**
   * Get SOP engine stats
   */
  getSOPStats(): {
    totalSOPs: number;
    enabledSOPs: number;
    decisionCount: number;
  } {
    return this.sopEngine.getStats();
  }

  /**
   * Enable/disable AGI
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    console.log(`[AGIAdapter] AGI ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if AGI is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}
