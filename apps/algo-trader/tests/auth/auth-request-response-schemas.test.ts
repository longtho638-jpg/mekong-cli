/**
 * Tests for Auth request/response schemas — Zod validation.
 */

import {
  ScopeSchema,
  IssueTokenRequestSchema,
  RefreshTokenRequestSchema,
  CreateApiKeyRequestSchema,
  ApiKeyResponseSchema,
  AuthContextSchema,
  TokenResponseSchema,
} from '../../src/auth/auth-request-response-schemas';

describe('Auth Schemas', () => {
  describe('ScopeSchema', () => {
    it('validates valid scopes', () => {
      expect(ScopeSchema.parse('backtest')).toBe('backtest');
      expect(ScopeSchema.parse('live:trade')).toBe('live:trade');
      expect(ScopeSchema.parse('live:monitor')).toBe('live:monitor');
      expect(ScopeSchema.parse('admin')).toBe('admin');
    });

    it('rejects invalid scopes', () => {
      expect(() => ScopeSchema.parse('invalid-scope')).toThrow();
      expect(() => ScopeSchema.parse('')).toThrow();
    });
  });

  describe('IssueTokenRequestSchema', () => {
    it('validates correct request', () => {
      const valid = {
        tenantId: 'tenant-123',
        scopes: ['backtest', 'live:trade'],
      };
      expect(IssueTokenRequestSchema.parse(valid)).toEqual(valid);
    });

    it('accepts optional expirySeconds', () => {
      const withExpiry = {
        tenantId: 'tenant-123',
        scopes: ['backtest'],
        expirySeconds: 3600,
      };
      expect(IssueTokenRequestSchema.parse(withExpiry)).toEqual(withExpiry);
    });

    it('rejects empty tenantId', () => {
      expect(() => IssueTokenRequestSchema.parse({
        tenantId: '',
        scopes: ['backtest'],
      })).toThrow();
    });

    it('rejects tenantId > 128 chars', () => {
      expect(() => IssueTokenRequestSchema.parse({
        tenantId: 'a'.repeat(129),
        scopes: ['backtest'],
      })).toThrow();
    });

    it('rejects empty scopes', () => {
      expect(() => IssueTokenRequestSchema.parse({
        tenantId: 'tenant-123',
        scopes: [],
      })).toThrow();
    });

    it('rejects invalid scope in array', () => {
      expect(() => IssueTokenRequestSchema.parse({
        tenantId: 'tenant-123',
        scopes: ['backtest', 'invalid-scope'],
      })).toThrow();
    });

    it('rejects expirySeconds > 86400', () => {
      expect(() => IssueTokenRequestSchema.parse({
        tenantId: 'tenant-123',
        scopes: ['backtest'],
        expirySeconds: 86401,
      })).toThrow();
    });

    it('rejects negative expirySeconds', () => {
      expect(() => IssueTokenRequestSchema.parse({
        tenantId: 'tenant-123',
        scopes: ['backtest'],
        expirySeconds: -1,
      })).toThrow();
    });
  });

  describe('RefreshTokenRequestSchema', () => {
    it('validates correct request', () => {
      expect(RefreshTokenRequestSchema.parse({ token: 'jwt-token-here' })).toEqual({
        token: 'jwt-token-here',
      });
    });

    it('rejects empty token', () => {
      expect(() => RefreshTokenRequestSchema.parse({ token: '' })).toThrow();
    });
  });

  describe('CreateApiKeyRequestSchema', () => {
    it('validates correct request', () => {
      const valid = {
        tenantId: 'tenant-123',
        scopes: ['backtest'],
      };
      expect(CreateApiKeyRequestSchema.parse(valid)).toEqual(valid);
    });

    it('accepts optional label', () => {
      const withLabel = {
        tenantId: 'tenant-123',
        scopes: ['backtest'],
        label: 'My API Key',
      };
      expect(CreateApiKeyRequestSchema.parse(withLabel)).toEqual(withLabel);
    });

    it('rejects tenantId > 128 chars', () => {
      expect(() => CreateApiKeyRequestSchema.parse({
        tenantId: 'a'.repeat(129),
        scopes: ['backtest'],
      })).toThrow();
    });

    it('rejects label > 64 chars', () => {
      expect(() => CreateApiKeyRequestSchema.parse({
        tenantId: 'tenant-123',
        scopes: ['backtest'],
        label: 'a'.repeat(65),
      })).toThrow();
    });

    it('rejects empty scopes', () => {
      expect(() => CreateApiKeyRequestSchema.parse({
        tenantId: 'tenant-123',
        scopes: [],
      })).toThrow();
    });
  });

  describe('ApiKeyResponseSchema', () => {
    it('validates correct response', () => {
      const valid = {
        keyId: 'key-123',
        raw: 'sk-raw-key-here',
        tenantId: 'tenant-123',
        scopes: ['backtest', 'live:trade'],
        createdAt: Date.now(),
      };
      expect(ApiKeyResponseSchema.parse(valid)).toEqual(valid);
    });

    it('accepts optional label', () => {
      const withLabel = {
        keyId: 'key-123',
        raw: 'sk-raw-key-here',
        tenantId: 'tenant-123',
        scopes: ['backtest'],
        createdAt: Date.now(),
        label: 'Production Key',
      };
      expect(ApiKeyResponseSchema.parse(withLabel)).toEqual(withLabel);
    });

    it('rejects missing required fields', () => {
      expect(() => ApiKeyResponseSchema.parse({
        keyId: 'key-123',
        // missing raw, tenantId, scopes, createdAt
      })).toThrow();
    });
  });

  describe('AuthContextSchema', () => {
    it('validates correct context', () => {
      const valid = {
        tenantId: 'tenant-123',
        scopes: ['backtest', 'live:trade'],
        keyId: 'key-123',
      };
      expect(AuthContextSchema.parse(valid)).toEqual(valid);
    });

    it('rejects missing fields', () => {
      expect(() => AuthContextSchema.parse({
        tenantId: 'tenant-123',
        // missing scopes, keyId
      })).toThrow();
    });
  });

  describe('TokenResponseSchema', () => {
    it('validates correct response', () => {
      const valid = {
        token: 'jwt-token-here',
        expiresIn: 3600,
      };
      expect(TokenResponseSchema.parse(valid)).toEqual(valid);
    });

    it('rejects missing fields', () => {
      expect(() => TokenResponseSchema.parse({
        token: 'jwt-token',
        // missing expiresIn
      })).toThrow();
    });
  });
});
