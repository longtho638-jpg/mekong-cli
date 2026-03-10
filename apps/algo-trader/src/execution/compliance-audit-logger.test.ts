/**
 * Tests for Compliance Audit Logger
 *
 * Tests SEC/FINRA compliance wrapper for audit logging.
 */

import { ComplianceAuditLogger, ComplianceEventType, createComplianceAuditLogger } from './compliance-audit-logger';
import { AuditLogRepository } from './audit-log-repository';
import { Order } from './order-lifecycle-manager';
import { OrderState } from './order-state-machine';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn().mockResolvedValue({ ETag: 'mock-etag' });
  return {
    S3Client: jest.fn(() => ({
      send: mockSend,
    })),
    PutObjectCommand: jest.fn((params) => ({
      type: 'PutObjectCommand',
      params,
    })),
  };
});

describe('ComplianceAuditLogger', () => {
  let logger: ComplianceAuditLogger;
  let mockRepository: jest.Mocked<AuditLogRepository>;

  beforeEach(() => {
    mockRepository = {
      insert: jest.fn().mockResolvedValue('mock-log-id'),
      findByOrderId: jest.fn().mockResolvedValue([]),
      findByTenant: jest.fn().mockResolvedValue([]),
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findForExport: jest.fn().mockResolvedValue([]),
      destroy: jest.fn().mockResolvedValue(),
    };
    logger = new ComplianceAuditLogger(mockRepository as unknown as AuditLogRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logOrderCreated', () => {
    it('should log order creation with CAT 2.0 reference', async () => {
      const order: Order = {
        id: 'order-123',
        tenantId: 'tenant-456',
        exchangeId: 'binance',
        symbol: 'BTC/USD',
        side: 'buy',
        type: 'limit',
        amount: 0.5,
        price: 50000,
        status: OrderState.PENDING,
        createdAt: Date.now(),
        clientOrderId: 'client-order-789',
        strategyId: 'strategy-001',
      };

      const logId = await logger.logOrderCreated(
        order,
        'user-789',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(logId).toBeDefined();
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ComplianceEventType.ORDER_CREATED,
          tenantId: 'tenant-456',
          orderId: 'order-123',
          userId: 'user-789',
          severity: 'info',
          catEventCategory: '2.0',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        })
      );
    });

    it('should generate CAT Order Reference', async () => {
      const order: Order = {
        id: 'order-123',
        tenantId: 'tenant-456',
        exchangeId: 'binance',
        symbol: 'BTC/USD',
        side: 'buy',
        type: 'limit',
        amount: 0.5,
        price: 50000,
        status: OrderState.PENDING,
        createdAt: Date.now(),
      };

      await logger.logOrderCreated(order, 'user-789');

      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          catOrderRef: expect.stringMatching(/^CAT-tenant-456-order-123-\d+$/),
        })
      );
    });
  });

  describe('logOrderFilled', () => {
    it('should log order fill with CAT 2.2 reference', async () => {
      const order: Order = {
        id: 'order-123',
        tenantId: 'tenant-456',
        exchangeId: 'binance',
        symbol: 'BTC/USD',
        side: 'buy',
        type: 'market',
        amount: 0.5,
        price: 50000,
        status: OrderState.FILLED,
        createdAt: Date.now(),
        submittedAt: Date.now(),
        filledAt: Date.now(),
        avgFillPrice: 50100,
        totalFilled: 0.5,
        remainingAmount: 0,
      };

      const logId = await logger.logOrderFilled(order, 50100, 0.5, 2.5);

      expect(logId).toBeDefined();
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ComplianceEventType.ORDER_FILLED,
          severity: 'info',
          catEventCategory: '2.2',
          payload: expect.objectContaining({
            fillPrice: 50100,
            fillAmount: 0.5,
          }),
        })
      );
    });
  });

  describe('logOrderCancelled', () => {
    it('should log order cancellation with CAT 2.3 reference', async () => {
      const order: Order = {
        id: 'order-123',
        tenantId: 'tenant-456',
        exchangeId: 'binance',
        symbol: 'BTC/USD',
        side: 'buy',
        type: 'limit',
        amount: 0.5,
        price: 50000,
        status: OrderState.CANCELLED,
        createdAt: Date.now(),
        clientOrderId: 'client-789',
      };

      const logId = await logger.logOrderCancelled(
        order,
        'User requested cancellation',
        'user-789',
        '192.168.1.1'
      );

      expect(logId).toBeDefined();
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ComplianceEventType.ORDER_CANCELLED,
          severity: 'info',
          catEventCategory: '2.3',
          payload: expect.objectContaining({
            cancellationReason: 'User requested cancellation',
          }),
        })
      );
    });
  });

  describe('logStateTransition', () => {
    it('should log state transition with CAT 2.1 reference', async () => {
      const logId = await logger.logStateTransition(
        'order-123',
        OrderState.PENDING,
        OrderState.SUBMITTED,
        'submit',
        'tenant-456',
        'binance',
        'user-789',
        'Order submitted to exchange'
      );

      expect(logId).toBeDefined();
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ComplianceEventType.STATE_TRANSITION,
          severity: 'info',
          catEventCategory: '2.1',
          payload: expect.objectContaining({
            fromState: OrderState.PENDING,
            toState: OrderState.SUBMITTED,
            trigger: 'submit',
          }),
        })
      );
    });
  });

  describe('logOrderRejected', () => {
    it('should log order rejection with CAT 2.4 reference', async () => {
      const order: Order = {
        id: 'order-123',
        tenantId: 'tenant-456',
        exchangeId: 'binance',
        symbol: 'BTC/USD',
        side: 'buy',
        type: 'limit',
        amount: 0.5,
        price: 50000,
        status: OrderState.REJECTED,
        createdAt: Date.now(),
        strategyId: 'strategy-001',
      };

      const logId = await logger.logOrderRejected(
        order,
        'Insufficient balance',
        'user-789',
        'BALANCE_ERROR'
      );

      expect(logId).toBeDefined();
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ComplianceEventType.ORDER_REJECTED,
          severity: 'warning',
          catEventCategory: '2.4',
          payload: expect.objectContaining({
            rejectionReason: 'Insufficient balance',
            errorCode: 'BALANCE_ERROR',
          }),
        })
      );
    });
  });

  describe('logComplianceViolation', () => {
    it('should log compliance violation with CAT 9.0 reference', async () => {
      const logId = await logger.logComplianceViolation(
        ComplianceEventType.MAX_ORDER_SIZE_EXCEEDED,
        'tenant-456',
        'user-789',
        {
          requestedAmount: 1000,
          maxAllowed: 500,
          symbol: 'BTC/USD',
        },
        'order-123'
      );

      expect(logId).toBeDefined();
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ComplianceEventType.MAX_ORDER_SIZE_EXCEEDED,
          severity: 'warning',
          catEventCategory: '9.0',
          tenantId: 'tenant-456',
          userId: 'user-789',
        })
      );
    });

    it('should log circuit breaker trigger as critical', async () => {
      const logId = await logger.logComplianceViolation(
        ComplianceEventType.CIRCUIT_BREAKER_TRIGGERED,
        'tenant-456',
        'system',
        {
          failureCount: 5,
          timeoutMs: 60000,
        }
      );

      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: ComplianceEventType.CIRCUIT_BREAKER_TRIGGERED,
          severity: 'warning',
        })
      );
    });
  });

  describe('getOrderAuditTrail', () => {
    it('should retrieve audit trail for an order', async () => {
      const mockLogs = [
        {
          eventType: 'order_created',
          tenantId: 'tenant-123',
          orderId: 'order-456',
          userId: 'user-789',
          severity: 'info',
          payload: { event: 'created' },
        },
      ];

      mockRepository.findByOrderId.mockResolvedValue(mockLogs as any);

      const trail = await logger.getOrderAuditTrail('order-456');

      expect(trail).toHaveLength(1);
      expect(mockRepository.findByOrderId).toHaveBeenCalledWith('order-456');
    });
  });

  describe('getTenantAuditLogs', () => {
    it('should retrieve audit logs for tenant within date range', async () => {
      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-01-31');

      await logger.getTenantAuditLogs('tenant-123', fromDate, toDate);

      expect(mockRepository.findByTenant).toHaveBeenCalledWith(
        'tenant-123',
        fromDate,
        toDate
      );
    });
  });

  describe('exportToS3', () => {
    it('should export audit logs to S3', async () => {
      mockRepository.findForExport.mockResolvedValue([
        {
          eventType: 'order_created',
          tenantId: 'tenant-123',
          orderId: 'order-456',
          userId: 'user-789',
          severity: 'info',
          payload: { test: true },
        },
      ]);

      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-01-31');

      const key = await logger.exportToS3(fromDate, toDate, 'my-audit-bucket', 'tenant-123');

      expect(key).toContain('audit-logs/');
      expect(key).toContain('tenant-123');
      expect(key).toContain('.jsonl');
    });
  });
});

describe('ComplianceEventType', () => {
  it('should have all required event types', () => {
    expect(ComplianceEventType.ORDER_CREATED).toBe('order_created');
    expect(ComplianceEventType.ORDER_FILLED).toBe('order_filled');
    expect(ComplianceEventType.ORDER_CANCELLED).toBe('order_cancelled');
    expect(ComplianceEventType.ORDER_REJECTED).toBe('order_rejected');
    expect(ComplianceEventType.STATE_TRANSITION).toBe('state_transition');
  });
});

describe('createComplianceAuditLogger', () => {
  it('should create logger instance', () => {
    const logger = createComplianceAuditLogger();
    expect(logger).toBeInstanceOf(ComplianceAuditLogger);
  });

  it('should accept custom repository', () => {
    const mockRepo = {} as AuditLogRepository;
    const logger = createComplianceAuditLogger(mockRepo);
    expect(logger).toBeInstanceOf(ComplianceAuditLogger);
  });
});
