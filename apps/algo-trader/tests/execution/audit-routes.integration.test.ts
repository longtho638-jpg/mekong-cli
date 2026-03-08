/**
 * Integration tests for Audit API Routes
 *
 * Tests admin-only audit log endpoints.
 */

import { registerAuditRoutes, createAuditRoutes } from '../routes/audit-routes';
import { createAuditLogRepository } from '../../execution/audit-log-repository';
import { ComplianceAuditLogger } from '../../execution/compliance-audit-logger';

// Mock dependencies
jest.mock('../../execution/audit-log-repository');
jest.mock('../../execution/compliance-audit-logger');

describe('Audit Routes - Admin Access Control', () => {
  let mockRepository: any;
  let mockLogger: any;

  beforeEach(() => {
    mockRepository = {
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findByOrderId: jest.fn().mockResolvedValue([]),
      verifyIntegrity: jest.fn().mockResolvedValue({ valid: true }),
      destroy: jest.fn().mockResolvedValue(),
    };

    mockLogger = {
      verifyIntegrity: jest.fn().mockResolvedValue({ valid: true }),
    };

    (createAuditLogRepository as jest.Mock).mockReturnValue(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/audit/logs', () => {
    it('should reject request without admin scope', async () => {
      const routes = await createAuditRoutes();

      // Simulate request without admin scope
      const mockRequest = {
        query: {},
        user: { role: 'user' }, // Not admin
      };

      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      try {
        await routes.routes.find((r: any) => r.method === 'GET' && r.url === '/api/v1/audit/logs')
          .handler(mockRequest as any, mockReply as any);
      } catch (e) {
        // Expected to throw
      }

      expect(mockReply.code).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden',
          message: expect.stringContaining('Admin scope'),
        })
      );
    });

    it('should allow request with admin role', async () => {
      const routes = await createAuditRoutes();

      mockRepository.find.mockResolvedValue([
        {
          id: 'log-1',
          eventType: 'order_created',
          tenantId: 'tenant-123',
          userId: 'user-1',
          timestamp: new Date(),
          severity: 'info',
          payload: {},
        },
      ]);
      mockRepository.count.mockResolvedValue(1);

      const mockRequest = {
        query: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-31T23:59:59Z',
          tenantId: 'tenant-123',
          limit: '100',
          offset: '0',
        },
        user: { role: 'admin' },
      };

      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await routes.routes.find((r: any) => r.method === 'GET' && r.url === '/api/v1/audit/logs')
        .handler(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          logs: expect.arrayContaining([
            expect.objectContaining({
              eventType: 'order_created',
            }),
          ]),
          total: 1,
        })
      );
    });

    it('should filter by userId', async () => {
      const routes = await createAuditRoutes();
      mockRepository.count.mockResolvedValue(0);

      const mockRequest = {
        query: {
          userId: 'user-specific',
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-31T23:59:59Z',
        },
        user: { role: 'admin' },
      };

      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await routes.routes.find((r: any) => r.method === 'GET' && r.url === '/api/v1/audit/logs')
        .handler(mockRequest as any, mockReply as any);

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-specific',
        })
      );
    });
  });

  describe('GET /api/v1/audit/logs/:orderId', () => {
    it('should return audit trail for order', async () => {
      const routes = await createAuditRoutes();

      mockRepository.findByOrderId.mockResolvedValue([
        {
          id: 'log-1',
          eventType: 'order_created',
          timestamp: new Date(),
          severity: 'info',
          payload: { orderId: 'order-123' },
          hash: 'hash123',
          prevHash: null,
        },
        {
          id: 'log-2',
          eventType: 'order_filled',
          timestamp: new Date(),
          severity: 'info',
          payload: { fillPrice: 50000 },
          hash: 'hash456',
          prevHash: 'hash123',
        },
      ]);

      const mockRequest = {
        params: { orderId: 'order-123' },
        user: { role: 'admin' },
      };

      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await routes.routes.find((r: any) => r.method === 'GET' && r.url === '/api/v1/audit/logs/:orderId')
        .handler(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-123',
          logs: expect.arrayContaining([
            expect.objectContaining({
              eventType: 'order_created',
              hash: 'hash123',
              prevHash: null,
            }),
          ]),
          total: 2,
        })
      );
    });
  });

  describe('GET /api/v1/audit/verify-integrity', () => {
    it('should return valid integrity status', async () => {
      const routes = await createAuditRoutes();

      mockRepository.verifyIntegrity.mockResolvedValue({
        valid: true,
      });

      const mockRequest = {
        query: {},
        user: { role: 'admin' },
      };

      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await routes.routes.find((r: any) => r.method === 'GET' && r.url === '/api/v1/audit/verify-integrity')
        .handler(mockRequest as any, mockReply as any);

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          valid: true,
          verifiedAt: expect.any(String),
        })
      );
    });

    it('should return broken integrity status', async () => {
      const routes = await createAuditRoutes();

      mockRepository.verifyIntegrity.mockResolvedValue({
        valid: false,
        brokenAt: 'log-123',
        details: 'Hash mismatch',
      });

      const mockRequest = {
        query: {},
        user: { role: 'admin' },
      };

      const mockReply = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await routes.routes.find((r: any) => r.method === 'GET' && r.url === '/api/v1/audit/verify-integrity')
        .handler(mockRequest as any, mockReply as any);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          valid: false,
          brokenAt: 'log-123',
        })
      );
    });

    it('should filter integrity check by tenantId', async () => {
      const routes = await createAuditRoutes();

      mockRepository.verifyIntegrity.mockResolvedValue({ valid: true });

      const mockRequest = {
        query: { tenantId: 'tenant-specific' },
        user: { role: 'admin' },
      };

      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await routes.routes.find((r: any) => r.method === 'GET' && r.url === '/api/v1/audit/verify-integrity')
        .handler(mockRequest as any, mockReply as any);

      expect(mockRepository.verifyIntegrity).toHaveBeenCalledWith('tenant-specific');
    });
  });
});

describe('Audit Routes - Hash Chain Verification', () => {
  it('should include hash chain in response', async () => {
    const routes = await createAuditRoutes();

    const mockRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'log-1',
          eventType: 'order_created',
          tenantId: 'tenant-123',
          userId: 'user-1',
          timestamp: new Date(),
          severity: 'info',
          payload: {},
          hash: 'abc123...',
          prevHash: null,
        },
      ]),
      count: jest.fn().mockResolvedValue(1),
      destroy: jest.fn().mockResolvedValue(),
    };

    (createAuditLogRepository as jest.Mock).mockReturnValue(mockRepository);

    const mockRequest = {
      query: {},
      user: { role: 'admin' },
    };

    const mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await routes.routes.find((r: any) => r.method === 'GET' && r.url === '/api/v1/audit/logs')
      .handler(mockRequest as any, mockReply as any);

    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        logs: expect.arrayContaining([
          expect.objectContaining({
            hash: 'abc123...',
            prevHash: null,
          }),
        ]),
      })
    );
  });
});
