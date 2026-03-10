/**
 * Tests for Audit Log Repository
 *
 * Tests the append-only audit log storage for SEC/FINRA compliance.
 */

import { AuditLogRepository, createAuditLogRepository, AuditLogInput } from './audit-log-repository';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    Decimal: jest.requireActual('@prisma/client').Decimal,
  };
});

describe('AuditLogRepository', () => {
  let repository: AuditLogRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $disconnect: jest.fn(),
    };
    repository = new AuditLogRepository(mockPrisma as unknown as PrismaClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('insert', () => {
    it('should insert a new audit log entry', async () => {
      const entry: AuditLogInput = {
        eventType: 'order_created',
        tenantId: 'tenant-123',
        orderId: 'order-456',
        userId: 'user-789',
        severity: 'info',
        payload: {
          symbol: 'BTC/USD',
          side: 'buy',
          amount: 0.5,
          price: 50000,
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        catOrderRef: 'CAT-tenant-123-order-456-1234567890',
        catEventCategory: '2.0',
      };

      mockPrisma.auditLog.create.mockResolvedValue({ id: 'generated-id-123' });

      const id = await repository.insert(entry);

      expect(id).toBe('generated-id-123');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'order_created',
            tenantId: 'tenant-123',
            orderId: 'order-456',
            userId: 'user-789',
            severity: 'info',
          }),
        })
      );
    });

    it('should insert audit log with SEC/FINRA CAT fields', async () => {
      const entry: AuditLogInput = {
        eventType: 'order_filled',
        tenantId: 'tenant-123',
        orderId: 'order-456',
        userId: 'user-789',
        severity: 'info',
        payload: { fillPrice: 50100, fillAmount: 0.5 },
        catOrderRef: 'CAT-tenant-123-order-456-1234567890',
        catEventCategory: '2.2',
        symbol: 'BTC/USD',
        side: 'buy',
        amount: 0.5,
        price: 50000,
      };

      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-id' });

      const id = await repository.insert(entry);
      expect(id).toBeDefined();
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should insert audit log without optional fields', async () => {
      const entry: AuditLogInput = {
        eventType: 'state_transition',
        tenantId: 'tenant-123',
        orderId: 'order-456',
        userId: 'system',
        severity: 'info',
        payload: { from: 'pending', to: 'submitted' },
      };

      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-id' });

      const id = await repository.insert(entry);
      expect(id).toBeDefined();
    });

    it('should throw error on insert failure', async () => {
      mockPrisma.auditLog.create.mockRejectedValue(new Error('Database error'));

      const entry: AuditLogInput = {
        eventType: 'order_created',
        tenantId: 'tenant-123',
        userId: 'user-1',
        severity: 'info',
        payload: {},
      };

      await expect(repository.insert(entry)).rejects.toThrow('Failed to insert audit log');
    });
  });

  describe('findByOrderId', () => {
    it('should return audit trail for an order', async () => {
      const orderId = `order-${Date.now()}`;
      const tenantId = 'tenant-test';

      const mockLogs = [
        {
          id: 'log-1',
          eventType: 'order_created',
          tenantId,
          orderId,
          userId: 'user-1',
          severity: 'info',
          payload: { event: 'created' },
          createdAt: new Date(),
        },
        {
          id: 'log-2',
          eventType: 'order_filled',
          tenantId,
          orderId,
          userId: 'user-1',
          severity: 'info',
          payload: { event: 'filled' },
          createdAt: new Date(),
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const logs = await repository.findByOrderId(orderId);

      expect(logs).toHaveLength(2);
      expect(logs[0].eventType).toBe('order_created');
      expect(logs[1].eventType).toBe('order_filled');
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderId },
          orderBy: { createdAt: 'asc' },
        })
      );
    });

    it('should return empty array for non-existent order', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      const logs = await repository.findByOrderId('non-existent-order');
      expect(logs).toHaveLength(0);
    });
  });

  describe('findByTenant', () => {
    it('should return audit logs for tenant within date range', async () => {
      const tenantId = `tenant-${Date.now()}`;
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      const tomorrow = new Date(now.getTime() + 86400000);

      const mockLogs = [
        {
          id: 'log-1',
          eventType: 'order_created',
          tenantId,
          userId: 'user-1',
          severity: 'info',
          payload: { event: 'test' },
          createdAt: now,
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const logs = await repository.findByTenant(tenantId, yesterday, tomorrow);

      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].tenantId).toBe(tenantId);
    });

    it('should return empty array for date range with no logs', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      const tenantId = `tenant-${Date.now()}`;
      const oldDate = new Date('2020-01-01');
      const olderDate = new Date('2020-01-02');

      const logs = await repository.findByTenant(tenantId, olderDate, oldDate);
      expect(logs).toHaveLength(0);
    });
  });

  describe('find', () => {
    it('should find logs by query criteria', async () => {
      const tenantId = `tenant-${Date.now()}`;
      const orderId = `order-${Date.now()}`;

      const mockLogs = [
        {
          id: 'log-1',
          eventType: 'order_created',
          tenantId,
          orderId,
          userId: 'user-1',
          severity: 'info',
          payload: { test: true },
          createdAt: new Date(),
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const logs = await repository.find({
        tenantId,
        orderId,
        eventType: 'order_created',
      });

      expect(logs.length).toBeGreaterThanOrEqual(1);
    });

    it('should respect limit parameter', async () => {
      const mockLogs = Array(5).fill(null).map((_, i) => ({
        id: `log-${i}`,
        eventType: 'order_created',
        tenantId: 'tenant-123',
        orderId: `order-${i}`,
        userId: 'user-1',
        severity: 'info',
        payload: { index: i },
        createdAt: new Date(),
      }));

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs.slice(0, 3));

      const logs = await repository.find({
        tenantId: 'tenant-123',
        limit: 3,
      });

      expect(logs.length).toBe(3);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 3,
        })
      );
    });
  });

  describe('count', () => {
    it('should count logs matching query', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(5);

      const count = await repository.count({ tenantId: 'tenant-123' });
      expect(count).toBe(5);
    });
  });

  describe('findForExport', () => {
    it('should return audit logs for export', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          eventType: 'order_created',
          tenantId: 'tenant-123',
          userId: 'user-1',
          severity: 'info',
          payload: { test: true },
          createdAt: new Date(),
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const logs = await repository.findForExport(
        'tenant-123',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        10000
      );

      expect(logs.length).toBe(1);
    });
  });

  describe('destroy', () => {
    it('should disconnect prisma client', async () => {
      await repository.destroy();
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });
  });

  describe('immutability', () => {
    it('should only have insert methods (no update/delete)', () => {
      // Verify repository only exposes append-only methods
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(repository));

      // Should have insert/create methods
      expect(methods).toContain('insert');

      // Should NOT have update or delete methods
      expect(methods).not.toContain('update');
      expect(methods).not.toContain('delete');
      expect(methods).not.toContain('remove');
    });
  });
});

describe('createAuditLogRepository', () => {
  it('should create repository instance', () => {
    const repo = createAuditLogRepository();
    expect(repo).toBeInstanceOf(AuditLogRepository);
  });
});
