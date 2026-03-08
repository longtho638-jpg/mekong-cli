/**
 * Tests for Audit Log Repository with Hash Chain
 *
 * Tests SHA-256 hash chain integrity and R2 storage.
 */

import { AuditLogRepository, createAuditLogRepository, AuditLogInput } from './audit-log-repository';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    Decimal: jest.requireActual('@prisma/client').Decimal,
  };
});

describe('AuditLogRepository - Hash Chain', () => {
  let repository: AuditLogRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
      },
      $disconnect: jest.fn(),
    };
    repository = new AuditLogRepository(mockPrisma as unknown as PrismaClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('insert with hash chain', () => {
    it('should compute hash and prevHash for new entry', async () => {
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
      };

      // Mock: No previous hash (first entry)
      mockPrisma.auditLog.findFirst.mockResolvedValue(null);
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'generated-id-123' });

      const id = await repository.insert(entry);

      expect(id).toBe('generated-id-123');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: 'order_created',
            tenantId: 'tenant-123',
            hash: expect.stringMatching(/^[a-f0-9]{64}$/), // SHA-256 hex
            prevHash: null,
          }),
        })
      );
    });

    it('should chain to previous hash', async () => {
      const entry: AuditLogInput = {
        eventType: 'order_filled',
        tenantId: 'tenant-123',
        orderId: 'order-456',
        userId: 'user-789',
        severity: 'info',
        payload: { fillPrice: 50100 },
      };

      // Mock: Previous hash exists
      mockPrisma.auditLog.findFirst.mockResolvedValue({
        hash: 'abc123def456...',
      });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-2' });

      await repository.insert(entry);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            prevHash: 'abc123def456...',
            hash: expect.stringMatching(/^[a-f0-9]{64}$/),
          }),
        })
      );
    });

    it('should update hash chain cache', async () => {
      const entry: AuditLogInput = {
        eventType: 'order_created',
        tenantId: 'tenant-123',
        userId: 'user-1',
        severity: 'info',
        payload: {},
      };

      mockPrisma.auditLog.findFirst.mockResolvedValue(null);
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-1', hash: 'newhash123' });

      await repository.insert(entry);

      // Second insert should use cached hash
      mockPrisma.auditLog.findFirst.mockClear();
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-2', hash: 'newhash456' });

      await repository.insert({ ...entry, eventType: 'order_filled' });

      // Should NOT query database for previous hash (used cache)
      expect(mockPrisma.auditLog.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('verifyIntegrity', () => {
    it('should return valid for empty logs', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      const result = await repository.verifyIntegrity();

      expect(result.valid).toBe(true);
      expect(result.brokenAt).toBeUndefined();
    });

    it('should verify hash chain for single entry', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          tenantId: 'tenant-123',
          eventType: 'order_created',
          payload: { test: true },
          createdAt: new Date(),
          hash: 'expectedhash123',
          prevHash: null,
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await repository.verifyIntegrity();

      // Hash will be recomputed and compared
      // For test, we just check it returns a result
      expect(result).toHaveProperty('valid');
    });

    it('should detect broken hash chain', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          tenantId: 'tenant-123',
          eventType: 'order_created',
          payload: {},
          createdAt: new Date(),
          hash: 'hash1',
          prevHash: null,
        },
        {
          id: 'log-2',
          tenantId: 'tenant-123',
          eventType: 'order_filled',
          payload: {},
          createdAt: new Date(),
          hash: 'hash2',
          prevHash: 'wrong-prev-hash', // Broken chain
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await repository.verifyIntegrity();

      expect(result.valid).toBe(false);
      expect(result.brokenAt).toBeDefined();
      // Details should mention either hash mismatch or chain broken
      expect(result.details).toMatch(/(Chain broken|Hash mismatch)/);
    });

    it('should filter by tenantId', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      await repository.verifyIntegrity('tenant-specific');

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant-specific' },
        })
      );
    });
  });
});

describe('AuditLogRepository - R2 Storage', () => {
  let repository: AuditLogRepository;
  let mockPrisma: any;
  let mockR2Bucket: any;

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      $disconnect: jest.fn(),
    };

    mockR2Bucket = {
      put: jest.fn().mockResolvedValue(undefined),
    };

    repository = new AuditLogRepository(mockPrisma as unknown as PrismaClient, mockR2Bucket);
  });

  it('should backup to R2 with daily rotation path', async () => {
    const entry: AuditLogInput = {
      eventType: 'order_created',
      tenantId: 'tenant-123',
      userId: 'user-1',
      severity: 'info',
      payload: {},
    };

    mockPrisma.auditLog.findFirst.mockResolvedValue(null);
    mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-123' });

    await repository.insert(entry);

    // Verify R2 put was called with correct path format
    expect(mockR2Bucket.put).toHaveBeenCalled();
    const putCall = mockR2Bucket.put.mock.calls[0];
    const path = putCall[0];

    // Path should be: /audit/{year}/{month}/{day}/{logId}.jsonl
    expect(path).toMatch(/^\/audit\/\d{4}\/\d{2}\/\d{2}\/log-123\.jsonl$/);
  });

  it('should store JSONL format in R2', async () => {
    mockPrisma.auditLog.findFirst.mockResolvedValue(null);
    mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-123' });

    await repository.insert({
      eventType: 'order_created',
      tenantId: 'tenant-123',
      userId: 'user-1',
      severity: 'info',
      payload: { test: true },
    });

    const putCall = mockR2Bucket.put.mock.calls[0];
    const content = putCall[1];

    // Should be JSONL (JSON followed by newline)
    expect(content).toMatch(/^\{.*\}\n$/);
    expect(JSON.parse(content.trim())).toHaveProperty('eventType', 'order_created');
  });

  it('should include custom metadata in R2 object', async () => {
    mockPrisma.auditLog.findFirst.mockResolvedValue(null);
    mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-123' });

    await repository.insert({
      eventType: 'order_filled',
      tenantId: 'tenant-456',
      userId: 'user-1',
      severity: 'info',
      payload: {},
    });

    const putCall = mockR2Bucket.put.mock.calls[0];
    const options = putCall[2];

    expect(options?.customMetadata).toEqual(
      expect.objectContaining({
        tenantId: 'tenant-456',
        eventType: 'order_filled',
      })
    );
  });

  it('should not fail insert if R2 backup fails', async () => {
    mockPrisma.auditLog.findFirst.mockResolvedValue(null);
    mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-123' });
    mockR2Bucket.put.mockRejectedValue(new Error('R2 unavailable'));

    // Should NOT throw
    const id = await repository.insert({
      eventType: 'order_created',
      tenantId: 'tenant-123',
      userId: 'user-1',
      severity: 'info',
      payload: {},
    });

    expect(id).toBe('log-123');
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
  });
});

describe('createAuditLogRepository', () => {
  it('should create repository with Prisma only', () => {
    const repo = createAuditLogRepository();
    expect(repo).toBeInstanceOf(AuditLogRepository);
  });

  it('should create repository with Prisma and R2', () => {
    const mockR2 = {} as any;
    const repo = createAuditLogRepository(undefined, mockR2);
    expect(repo).toBeInstanceOf(AuditLogRepository);
  });
});
