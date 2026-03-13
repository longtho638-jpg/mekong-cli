/**
 * Risk Events Emitter Tests
 * Tests for typed event emission and handling
 */

import { RiskEventEmitter } from '../core/risk-events';
import { PnLAlertEvent, DrawdownWarningEvent, CircuitTripEvent } from './types';

describe('RiskEventEmitter', () => {
  let emitter: RiskEventEmitter;

  beforeEach(() => {
    // Get fresh instance and reset
    emitter = RiskEventEmitter.getInstance();
    emitter.reset();
  });

  afterEach(() => {
    emitter.reset();
  });

  describe('singleton', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = RiskEventEmitter.getInstance();
      const instance2 = RiskEventEmitter.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('event emission', () => {
    it('should emit pnl:alert event', async () => {
      const mockHandler = jest.fn();
      emitter.on('pnl:alert', mockHandler);

      const event: PnLAlertEvent = {
        type: 'pnl:alert',
        severity: 'warning',
        message: 'Daily PnL below threshold',
        timestamp: Date.now(),
        metadata: {
          currentPnl: -500,
          threshold: -1000,
          period: 'daily',
        },
      };

      await emitter.emit(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith(event);
    });

    it('should emit drawdown:warning event', async () => {
      const mockHandler = jest.fn();
      emitter.on('drawdown:warning', mockHandler);

      const event: DrawdownWarningEvent = {
        type: 'drawdown:warning',
        severity: 'warning',
        message: 'Drawdown approaching limit',
        timestamp: Date.now(),
        metadata: {
          currentDrawdown: -0.12,
          threshold: -0.15,
          peakValue: 100000,
        },
      };

      await emitter.emit(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith(event);
    });

    it('should emit circuit:trip event', async () => {
      const mockHandler = jest.fn();
      emitter.on('circuit:trip', mockHandler);

      const event: CircuitTripEvent = {
        type: 'circuit:trip',
        severity: 'critical',
        message: 'Circuit breaker tripped',
        timestamp: Date.now(),
        metadata: {
          breakerId: 'daily-loss',
          triggerValue: -1200,
          threshold: -1000,
        },
      };

      await emitter.emit(event);

      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith(event);
    });
  });

  describe('event subscription', () => {
    it('should unsubscribe when calling returned function', async () => {
      const mockHandler = jest.fn();
      const unsubscribe = emitter.on('pnl:alert', mockHandler);

      // Should receive event
      await emitter.emit({
        type: 'pnl:alert',
        severity: 'info',
        message: 'Test',
        timestamp: Date.now(),
        metadata: { currentPnl: 100, threshold: 500, period: 'daily' },
      });
      expect(mockHandler).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();

      // Should not receive event after unsubscribe
      await emitter.emit({
        type: 'pnl:alert',
        severity: 'info',
        message: 'Test 2',
        timestamp: Date.now(),
        metadata: { currentPnl: 200, threshold: 500, period: 'daily' },
      });
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should support multiple handlers for same event', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      emitter.on('pnl:alert', handler1);
      emitter.on('pnl:alert', handler2);

      const event: PnLAlertEvent = {
        type: 'pnl:alert',
        severity: 'info',
        message: 'Test event',
        timestamp: Date.now(),
        metadata: { currentPnl: 100, threshold: 500, period: 'daily' },
      };

      await emitter.emit(event);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should support onAny for all events', async () => {
      const anyHandler = jest.fn();
      emitter.onAny(anyHandler);

      await emitter.emit({
        type: 'pnl:alert',
        severity: 'info',
        message: 'PnL alert',
        timestamp: Date.now(),
        metadata: { currentPnl: 100, threshold: 500, period: 'daily' },
      });

      await emitter.emit({
        type: 'circuit:trip',
        severity: 'critical',
        message: 'Circuit tripped',
        timestamp: Date.now(),
        metadata: { breakerId: 'test', triggerValue: 100, threshold: 90 },
      });

      expect(anyHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('event log', () => {
    it('should log emitted events', async () => {
      await emitter.emit({
        type: 'pnl:alert',
        severity: 'info',
        message: 'Test',
        timestamp: Date.now(),
        metadata: { currentPnl: 100, threshold: 500, period: 'daily' },
      });

      const log = emitter.getLog();
      expect(log.length).toBe(1);
      expect(log[0].event.type).toBe('pnl:alert');
    });

    it('should filter log by event type', async () => {
      await emitter.emit({
        type: 'pnl:alert',
        severity: 'info',
        message: 'PnL',
        timestamp: Date.now(),
        metadata: { currentPnl: 100, threshold: 500, period: 'daily' },
      });

      await emitter.emit({
        type: 'circuit:trip',
        severity: 'critical',
        message: 'Circuit',
        timestamp: Date.now(),
        metadata: { breakerId: 'test', triggerValue: 100, threshold: 90 },
      });

      const pnlEvents = emitter.getEventsByType('pnl:alert');
      expect(pnlEvents.length).toBe(1);
      expect(pnlEvents[0].type).toBe('pnl:alert');
    });

    it('should limit log size', async () => {
      // Emit more than maxLogSize events
      for (let i = 0; i < 1100; i++) {
        await emitter.emit({
          type: 'pnl:alert',
          severity: 'info',
          message: `Event ${i}`,
          timestamp: Date.now(),
          metadata: { currentPnl: i, threshold: 500, period: 'daily' },
        });
      }

      const log = emitter.getLog(undefined, 1500); // Pass limit > maxLogSize to see actual size
      expect(log.length).toBe(1000); // maxLogSize
    });
  });

  describe('listener count', () => {
    it('should return correct listener count', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      emitter.on('pnl:alert', handler1);
      emitter.on('pnl:alert', handler2);
      emitter.on('circuit:trip', jest.fn());

      expect(emitter.listenerCount('pnl:alert')).toBe(2);
      expect(emitter.listenerCount('circuit:trip')).toBe(1);
      expect(emitter.listenerCount('drawdown:warning')).toBe(0);
    });
  });

  describe('async handlers', () => {
    it('should await async handlers', async () => {
      let completed = false;
      const asyncHandler = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        completed = true;
      });

      emitter.on('pnl:alert', asyncHandler);

      await emitter.emit({
        type: 'pnl:alert',
        severity: 'info',
        message: 'Test',
        timestamp: Date.now(),
        metadata: { currentPnl: 100, threshold: 500, period: 'daily' },
      });

      expect(completed).toBe(true);
    });

    it('should handle errors in async handlers', async () => {
      const errorHandler = jest.fn().mockImplementation(async () => {
        throw new Error('Test error');
      });

      emitter.on('pnl:alert', errorHandler);

      // Should not throw
      await expect(
        emitter.emit({
          type: 'pnl:alert',
          severity: 'info',
          message: 'Test',
          timestamp: Date.now(),
          metadata: { currentPnl: 100, threshold: 500, period: 'daily' },
        })
      ).resolves.not.toThrow();

      expect(errorHandler).toHaveBeenCalledTimes(1);
    });
  });
});
