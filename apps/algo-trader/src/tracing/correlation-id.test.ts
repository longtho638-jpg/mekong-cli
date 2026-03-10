/**
 * Correlation ID Unit Tests
 */

import {
  generateCorrelationId,
  extractCorrelationId,
  injectCorrelationId,
  isValidUuid,
  getOrCreateCorrelationId,
  createCorrelationMiddleware,
  createTraceLogger,
  CORRELATION_ID_HEADER,
} from './correlation-id';

describe('Correlation ID', () => {
  describe('generateCorrelationId', () => {
    it('should generate a valid UUID v4', () => {
      const id = generateCorrelationId();
      expect(isValidUuid(id)).toBe(true);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateCorrelationId());
      }
      expect(ids.size).toBe(100);
    });

    it('should follow UUID v4 format', () => {
      const id = generateCorrelationId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });
  });

  describe('isValidUuid', () => {
    it('should return true for valid UUID v4', () => {
      expect(isValidUuid('550e8400-e29b-4d44-a442-555555555555')).toBe(true);
      expect(isValidUuid('123e4567-e89b-42d3-a456-426614174000')).toBe(true);
      expect(isValidUuid('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(true);
    });

    it('should return false for invalid UUID', () => {
      expect(isValidUuid('not-a-uuid')).toBe(false);
      expect(isValidUuid('550e8400-e29b-3d44-a442-555555555555')).toBe(false); // Wrong version
      expect(isValidUuid('550e8400-e29b-4d44-c442-555555555555')).toBe(false); // Wrong variant
      expect(isValidUuid('')).toBe(false);
      expect(isValidUuid('invalid')).toBe(false);
    });
  });

  describe('extractCorrelationId', () => {
    it('should extract correlation ID from headers', () => {
      const headers = {
        [CORRELATION_ID_HEADER]: '550e8400-e29b-4d44-a442-555555555555',
      };
      const id = extractCorrelationId(headers);
      expect(id).toBe('550e8400-e29b-4d44-a442-555555555555');
    });

    it('should handle case-insensitive header names', () => {
      const headers = {
        'X-CORRELATION-ID': '550e8400-e29b-4d44-a442-555555555555',
      };
      const id = extractCorrelationId(headers);
      expect(id).toBe('550e8400-e29b-4d44-a442-555555555555');
    });

    it('should return null for missing header', () => {
      const id = extractCorrelationId({});
      expect(id).toBeNull();
    });

    it('should return null for invalid UUID', () => {
      const headers = {
        [CORRELATION_ID_HEADER]: 'invalid-uuid',
      };
      const id = extractCorrelationId(headers);
      expect(id).toBeNull();
    });

    it('should handle array headers', () => {
      const headers = {
        [CORRELATION_ID_HEADER]: ['550e8400-e29b-4d44-a442-555555555555', 'another'],
      };
      const id = extractCorrelationId(headers);
      expect(id).toBe('550e8400-e29b-4d44-a442-555555555555');
    });

    it('should return null for null/undefined headers', () => {
      expect(extractCorrelationId(null as any)).toBeNull();
      expect(extractCorrelationId(undefined as any)).toBeNull();
    });
  });

  describe('injectCorrelationId', () => {
    it('should inject correlation ID into headers', () => {
      const headers: Record<string, string> = {};
      const id = '550e8400-e29b-4d44-a442-555555555555';

      injectCorrelationId(headers, id);

      expect(headers[CORRELATION_ID_HEADER]).toBe(id);
    });

    it('should modify headers in place', () => {
      const headers: Record<string, string> = { existing: 'value' };
      const id = '550e8400-e29b-4d44-a442-555555555555';

      injectCorrelationId(headers, id);

      expect(headers).toHaveProperty(CORRELATION_ID_HEADER, id);
      expect(headers).toHaveProperty('existing', 'value');
    });

    it('should throw for invalid headers', () => {
      expect(() => injectCorrelationId(null as any, 'id')).toThrow('Headers must be an object');
    });

    it('should throw for invalid correlation ID', () => {
      const headers: Record<string, string> = {};
      expect(() => injectCorrelationId(headers, '')).toThrow('Correlation ID must be a non-empty string');
      expect(() => injectCorrelationId(headers, 'invalid')).toThrow('Invalid UUID format');
    });
  });

  describe('getOrCreateCorrelationId', () => {
    it('should return existing correlation ID', () => {
      const headers = {
        [CORRELATION_ID_HEADER]: '550e8400-e29b-4d44-a442-555555555555',
      };
      const id = getOrCreateCorrelationId(headers);
      expect(id).toBe('550e8400-e29b-4d44-a442-555555555555');
    });

    it('should generate new ID if not present', () => {
      const headers = {};
      const id = getOrCreateCorrelationId(headers);
      expect(isValidUuid(id)).toBe(true);
    });
  });

  describe('createCorrelationMiddleware', () => {
    it('should create middleware that adds correlation ID', () => {
      const middleware = createCorrelationMiddleware();
      const req = { headers: {}, id: undefined as string | undefined };
      const res = { setHeader: jest.fn() };
      const next = jest.fn();

      middleware(req as any, res as any, next);

      expect(req.id).toBeDefined();
      expect(isValidUuid(req.id!)).toBe(true);
      expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, expect.any(String));
      expect(next).toHaveBeenCalled();
    });

    it('should use existing correlation ID from headers', () => {
      const middleware = createCorrelationMiddleware();
      const existingId = '550e8400-e29b-4d44-a442-555555555555';
      const req = { headers: { [CORRELATION_ID_HEADER]: existingId }, id: undefined as string | undefined };
      const res = { setHeader: jest.fn() };
      const next = jest.fn();

      middleware(req as any, res as any, next);

      expect(req.id).toBe(existingId);
    });
  });

  describe('createTraceLogger', () => {
    it('should wrap logger with correlation ID context', () => {
      const baseLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      const correlationId = '550e8400-e29b-4d44-a442-555555555555';
      const traceLogger = createTraceLogger(baseLogger, correlationId);

      traceLogger.info('test message', { key: 'value' });

      expect(baseLogger.info).toHaveBeenCalledWith('test message', {
        key: 'value',
        correlationId,
      });
    });

    it('should include correlation ID in all log levels', () => {
      const baseLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      const correlationId = '550e8400-e29b-4d44-a442-555555555555';
      const traceLogger = createTraceLogger(baseLogger, correlationId);

      traceLogger.warn('warning', { data: '123' });
      traceLogger.error('error', { data: '456' });

      expect(baseLogger.warn).toHaveBeenCalledWith('warning', {
        data: '123',
        correlationId,
      });
      expect(baseLogger.error).toHaveBeenCalledWith('error', {
        data: '456',
        correlationId,
      });
    });
  });
});
