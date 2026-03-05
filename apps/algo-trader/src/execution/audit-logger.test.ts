import {
  AuditLogger,
  createAuditLogger,
  AuditEventType,
  SeverityLevel,
} from './audit-logger';

describe('AuditLogger', () => {
  let logger: AuditLogger;

  beforeEach(() => {
    logger = createAuditLogger('test-tenant', 'binance');
  });

  afterEach(() => {
    logger.clearBuffer();
  });

  describe('logTradeExecution', () => {
    it('logs successful trade execution', () => {
      const order = {
        id: 'order-123',
        symbol: 'BTC/USDT',
        side: 'buy',
        amount: 0.5,
        price: 50000,
      };

      const event = logger.logTradeExecution(order, {
        strategyId: 'strat-1',
        signalId: 'signal-1',
      });

      expect(event.eventType).toBe(AuditEventType.TRADE_EXECUTED);
      expect(event.severity).toBe(SeverityLevel.INFO);
      expect(event.tenantId).toBe('test-tenant');
      expect(event.exchangeId).toBe('binance');
      expect(event.orderId).toBe('order-123');
      expect(event.amount).toBe(0.5);
      expect(event.metadata?.strategyId).toBe('strat-1');
    });

    it('generates unique event IDs', () => {
      const order1 = { id: 'o1', symbol: 'BTC/USDT', side: 'buy', amount: 0.1 };
      const order2 = { id: 'o2', symbol: 'ETH/USDT', side: 'sell', amount: 1.0 };

      const event1 = logger.logTradeExecution(order1);
      const event2 = logger.logTradeExecution(order2);

      expect(event1.id).not.toBe(event2.id);
    });
  });

  describe('logTradeCancellation', () => {
    it('logs trade cancellation', () => {
      const event = logger.logTradeCancellation(
        'order-456',
        'BTC/USDT',
        'User requested'
      );

      expect(event.eventType).toBe(AuditEventType.TRADE_CANCELLED);
      expect(event.orderId).toBe('order-456');
      expect(event.metadata?.reason).toBe('User requested');
    });
  });

  describe('logTradeFailure', () => {
    it('logs trade failure with WARNING severity', () => {
      const event = logger.logTradeFailure(
        'BTC/USDT',
        'buy',
        0.5,
        'Insufficient balance'
      );

      expect(event.eventType).toBe(AuditEventType.TRADE_FAILED);
      expect(event.severity).toBe(SeverityLevel.WARNING);
      expect(event.metadata?.error).toBe('Insufficient balance');
    });
  });

  describe('logApiKeyUsage', () => {
    it('logs API key usage', () => {
      const event = logger.logApiKeyUsage('fetchBalance', '/api/balance');

      expect(event.eventType).toBe(AuditEventType.API_KEY_USED);
      expect(event.metadata?.action).toBe('fetchBalance');
      expect(event.metadata?.endpoint).toBe('/api/balance');
    });
  });

  describe('alertOnUnusualPattern', () => {
    it('alerts on unusual pattern with CRITICAL severity', () => {
      const event = logger.alertOnUnusualPattern({
        patternType: 'VOLUME_SPIKE',
        currentValue: 500000,
        baselineValue: 100000,
        deviationPercent: 400,
        threshold: 300,
      });

      expect(event.eventType).toBe(AuditEventType.UNUSUAL_PATTERN_DETECTED);
      expect(event.severity).toBe(SeverityLevel.CRITICAL);
      expect((event.metadata?.pattern as any).patternType).toBe('VOLUME_SPIKE');
    });

    it('alerts on large order pattern', () => {
      const event = logger.alertOnUnusualPattern({
        patternType: 'LARGE_ORDER',
        currentValue: 100,
        baselineValue: 1,
        deviationPercent: 9900,
        threshold: 500,
      });

      expect((event.metadata?.pattern as any).patternType).toBe('LARGE_ORDER');
    });
  });

  describe('logCircuitBreakerTriggered', () => {
    it('logs circuit breaker trigger', () => {
      const event = logger.logCircuitBreakerTriggered(
        'Excessive failures',
        5,
        60000
      );

      expect(event.eventType).toBe(AuditEventType.CIRCUIT_BREAKER_TRIGGERED);
      expect(event.severity).toBe(SeverityLevel.WARNING);
      expect(event.metadata?.failureCount).toBe(5);
    });
  });

  describe('logMaxOrderSizeExceeded', () => {
    it('logs max order size exceeded', () => {
      const event = logger.logMaxOrderSizeExceeded(
        'BTC/USDT',
        'buy',
        100,
        10
      );

      expect(event.eventType).toBe(AuditEventType.MAX_ORDER_SIZE_EXCEEDED);
      expect(event.metadata?.requestedAmount).toBe(100);
      expect(event.metadata?.maxAllowed).toBe(10);
    });
  });

  describe('logDailyVolumeLimitExceeded', () => {
    it('logs daily volume limit exceeded', () => {
      const event = logger.logDailyVolumeLimitExceeded(
        15000000,
        10000000,
        '24h'
      );

      expect(event.eventType).toBe(AuditEventType.DAILY_VOLUME_LIMIT_EXCEEDED);
      expect(event.severity).toBe(SeverityLevel.CRITICAL);
      expect(event.metadata?.currentVolume).toBe(15000000);
      expect(event.metadata?.limit).toBe(10000000);
    });
  });

  describe('getRecentEvents', () => {
    it('returns recent events from buffer', () => {
      logger.logTradeExecution({ id: 'o1', symbol: 'BTC/USDT', side: 'buy', amount: 0.1 });
      logger.logTradeExecution({ id: 'o2', symbol: 'ETH/USDT', side: 'sell', amount: 1.0 });
      logger.logTradeFailure('BTC/USDT', 'buy', 0.5, 'Error');

      const events = logger.getRecentEvents();
      expect(events.length).toBe(3);
    });

    it('limits results to specified count', () => {
      const eventIds: string[] = [];
      for (let i = 0; i < 50; i++) {
        const event = logger.logTradeExecution({ id: `o${i}`, symbol: 'BTC/USDT', side: 'buy', amount: 0.1 });
        eventIds.push(event.id);
      }

      const events = logger.getRecentEvents(10);
      expect(events.length).toBe(10);
      // Last 10 events (indices 40-49)
      expect(events.map(e => e.id)).toEqual(eventIds.slice(-10));
    });
  });

  describe('buffer rotation', () => {
    it('rotates buffer when exceeds max size', () => {
      // Add 1001 events (max is 1000)
      for (let i = 0; i < 1001; i++) {
        logger.logTradeExecution({ id: `o${i}`, symbol: 'BTC/USDT', side: 'buy', amount: 0.1 });
      }

      const events = logger.getRecentEvents(1001);
      expect(events.length).toBe(1000);
      // Buffer rotated - first event removed, confirm length is capped
      expect(events.length).toBe(1000);
    });
  });

  describe('createAuditLogger factory', () => {
    it('creates logger instance', () => {
      const instance = createAuditLogger('tenant-1', 'okx', 'https://webhook.example.com');

      expect(instance).toBeInstanceOf(AuditLogger);
      expect(instance.getRecentEvents()).toEqual([]);
    });
  });
});
