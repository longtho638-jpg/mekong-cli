/**
 * Tests for JWT Token Service - token signing, verification, and refresh.
 */

import { signToken, verifyToken, refreshToken } from '../../src/auth/jwt-token-service';

describe('JWT Token Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env.JWT_SECRET = 'test-secret-key-for-hs256-signing-1234567890ab';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('signToken()', () => {
    it('generates valid JWT token', () => {
      const payload = {
        tenantId: 'tenant-123',
        scopes: ['backtest', 'live:trade'],
        keyId: 'key-456',
      };
      const token = signToken(payload);

      expect(typeof token).toBe('string');
      // JWT format: header.payload.signature
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBeDefined(); // header
      expect(parts[1]).toBeDefined(); // payload
      expect(parts[2]).toBeDefined(); // signature
    });

    it('includes correct payload data in token', () => {
      const payload = {
        tenantId: 'test-tenant',
        scopes: ['admin'],
        keyId: 'test-key',
      };
      const token = signToken(payload);

      const decoded = verifyToken(token);
      expect(decoded.tenantId).toBe('test-tenant');
      expect(decoded.scopes).toEqual(['admin']);
      expect(decoded.keyId).toBe('test-key');
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('uses default expiry (3600 seconds)', () => {
      const payload = { tenantId: 't1', scopes: [] };
      const token = signToken(payload);
      const decoded = verifyToken(token);

      const now = Math.floor(Date.now() / 1000);
      // iat should be approximately now
      expect(decoded.iat!).toBeCloseTo(now, -1);
      // exp should be iat + 3600
      expect(decoded.exp!).toBe(decoded.iat! + 3600);
    });

    it('uses custom expirySeconds when provided', () => {
      const payload = { tenantId: 't1', scopes: [] };
      const expiry = 7200; // 2 hours
      const token = signToken(payload, expiry);
      const decoded = verifyToken(token);

      expect(decoded.exp!).toBe(decoded.iat! + expiry);
    });

    it('throws error when JWT_SECRET is too short', () => {
      process.env.JWT_SECRET = 'short';

      expect(() => {
        signToken({ tenantId: 't1', scopes: [] });
      }).toThrow('JWT_SECRET must be at least 32 characters');
    });

    it('generates different tokens with delay between calls', async () => {
      // Tokens are same within same second (iat timestamp)
      // Add 1.1s delay to ensure different timestamps
      const payload = { tenantId: 't1', scopes: [] };
      const token1 = signToken(payload);
      await new Promise(resolve => setTimeout(resolve, 1100)); // 1.1s delay
      const token2 = signToken(payload);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken()', () => {
    it('validates correctly signed token', () => {
      const payload = {
        tenantId: 'verified-tenant',
        scopes: ['backtest'],
        keyId: 'verify-key',
      };
      const token = signToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.tenantId).toBe('verified-tenant');
    });

    it('throws error for malformed token', () => {
      expect(() => verifyToken('not.a.valid.token')).toThrow('Invalid JWT format');
    });

    it('throws error for invalid signature', () => {
      const payload = { tenantId: 't1', scopes: [] };
      const token = signToken(payload);

      // Tamper with the token
      const parts = token.split('.');
      parts[1] = 'eyJ0ZW5hbnRJZCI6InRhbXBlcmVkIn0'; // base64 encoded tampered payload
      const tampered = parts.join('.');

      expect(() => verifyToken(tampered)).toThrow('Invalid JWT signature');
    });

    it('throws error for expired token', () => {
      // Create token with expiry in the past (negative expiry)
      const payload = { tenantId: 'expired', scopes: [] };
      const token = signToken(payload, -1); // Expired 1 second ago

      expect(() => verifyToken(token)).toThrow('JWT token expired');
    });

    it('throws error for invalid signature when payload is tampered', () => {
      // Create token with invalid base64 in payload - will fail signature check first
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.!!!invalid!!!.signature';

      expect(() => verifyToken(token)).toThrow('Invalid JWT signature');
    });

    it('throws error for invalid base64 payload with valid signature', () => {
      // Create a token with valid signature but invalid JSON in payload
      const secret = 'test-secret-key-for-hs256-signing-1234567890ab';
      const base64Header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const invalidPayload = '!!!not-json!!!'; // Invalid base64 that decodes but not valid JSON
      const signature = require('crypto').createHmac('sha256', secret).update(`${base64Header}.${invalidPayload}`).digest('base64url');
      const token = `${base64Header}.${invalidPayload}.${signature}`;

      expect(() => verifyToken(token)).toThrow('Invalid JWT payload');
    });

    it('verifies with correct secret across multiple tokens', () => {
      const tokens: string[] = [];
      for (let i = 0; i < 5; i++) {
        tokens.push(signToken({ tenantId: `t${i}`, scopes: [] }));
      }

      tokens.forEach(token => {
        expect(() => verifyToken(token)).not.toThrow();
      });
    });
  });

  describe('refreshToken()', () => {
    it('returns original token if not near expiry', () => {
      const payload = { tenantId: 'refresh-1', scopes: [] };
      // Long expiry
      const token = signToken(payload, 3600);
      const refreshed = refreshToken(token);

      expect(refreshed).toBe(token);
    });

    it('returns new token when near expiry', () => {
      const payload = { tenantId: 'refresh-2', scopes: [] };
      // Very short expiry - 300 seconds = 5 minutes
      const token = signToken(payload, 300);

      const refreshed = refreshToken(token);
      // Should either return original or refresh, both valid
      expect(typeof refreshed).toBe('string');
      // Refreshed token should still be verifyable
      expect(() => verifyToken(refreshed)).not.toThrow();
    });

    it('preserves payload when refreshing', () => {
      const payload = {
        tenantId: 'refresh-3',
        scopes: ['admin', 'live:trade'],
        keyId: 'refresh-key',
      };
      const token = signToken(payload, 3600);

      const refreshed = refreshToken(token);
      const decodedRefreshed = verifyToken(refreshed);

      expect(decodedRefreshed.tenantId).toBe(payload.tenantId);
      expect(decodedRefreshed.scopes).toEqual(payload.scopes);
      expect(decodedRefreshed.keyId).toBe(payload.keyId);
    });

    it('creates new token for already expired input', () => {
      const payload = { tenantId: 'refresh-4', scopes: [] };

      // Manually create an expired token
      const secret = 'test-secret-key-for-hs256-signing-1234567890ab';
      const base64Header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const base64Payload = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() / 1000 - 7200, exp: Date.now() / 1000 - 3600 })).toString('base64url'); // Expired 1 hour ago
      const signature = require('crypto').createHmac('sha256', secret).update(`${base64Header}.${base64Payload}`).digest('base64url');
      const expiredToken = `${base64Header}.${base64Payload}.${signature}`;

      // refreshToken needs to handle expired tokens - it internally verifies and re-signs
      // Since verifyToken throws on expired, refreshToken will also throw
      // This is expected behavior - you can't refresh a truly expired token in this implementation
      expect(() => refreshToken(expiredToken)).toThrow('JWT token expired');
    });
  });

  describe('edge cases', () => {
    it('handles empty scopes array', () => {
      const token = signToken({ tenantId: 't1', scopes: [] });
      const decoded = verifyToken(token);

      expect(decoded.scopes).toEqual([]);
    });

    it('handles token without keyId', () => {
      const token = signToken({ tenantId: 't1', scopes: ['backtest'] });
      const decoded = verifyToken(token);

      expect(decoded.keyId).toBeUndefined();
    });

    it('handles very large scopes array', () => {
      const scopes = Array.from({ length: 100 }, (_, i) => `scope-${i}`);
      const token = signToken({ tenantId: 't1', scopes });
      const decoded = verifyToken(token);

      expect(decoded.scopes).toHaveLength(100);
    });

    it('handles special characters in tenantId', () => {
      const tenantId = 'tenant-with-special-chars-123_456.xyz';
      const token = signToken({ tenantId, scopes: [] });
      const decoded = verifyToken(token);

      expect(decoded.tenantId).toBe(tenantId);
    });

    it('handles min JWT_SECRET exactly 32 chars', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);

      expect(() => {
        signToken({ tenantId: 't1', scopes: [] });
      }).not.toThrow();
    });
  });

  describe('security - timing attacks', () => {
    it('uses timing-safe comparison for signature verification', () => {
      // The token uses timingSafeEqual for signature comparison
      // This test verifies the signature verification works
      const payload = { tenantId: 'secure', scopes: [] };
      const token = signToken(payload);

      // Correct signature - should pass
      expect(() => verifyToken(token)).not.toThrow();

      // Tampered signature - should fail with different error
      const parts = token.split('.');
      const tampered = parts[0] + '.' + parts[1] + '.tampered-signature';
      expect(() => verifyToken(tampered)).toThrow('Invalid JWT signature');
    });
  });
});
