/**
 * Tests for jwt-token-service: sign, verify, refresh, error cases.
 */
import { signToken, verifyToken, refreshToken } from './jwt-token-service';

const TEST_SECRET = 'test-secret-that-is-at-least-32-chars!!';

beforeEach(() => {
  process.env['JWT_SECRET'] = TEST_SECRET;
});

afterEach(() => {
  delete process.env['JWT_SECRET'];
});

describe('signToken', () => {
  it('returns a 3-part JWT string', () => {
    const token = signToken({ tenantId: 'tenant1', scopes: ['backtest'] });
    const parts = token.split('.');
    expect(parts).toHaveLength(3);
  });

  it('encodes tenantId and scopes in payload', () => {
    const token = signToken({ tenantId: 'acme', scopes: ['live:trade'] });
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1] + '==', 'base64').toString()
    );
    expect(payload.tenantId).toBe('acme');
    expect(payload.scopes).toEqual(['live:trade']);
  });

  it('sets iat and exp fields', () => {
    const before = Math.floor(Date.now() / 1000);
    const token = signToken({ tenantId: 't1', scopes: ['backtest'] });
    const after = Math.floor(Date.now() / 1000);
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1] + '==', 'base64').toString()
    );
    expect(payload.iat).toBeGreaterThanOrEqual(before);
    expect(payload.iat).toBeLessThanOrEqual(after);
    expect(payload.exp).toBe(payload.iat + 3600);
  });

  it('respects custom expirySeconds', () => {
    const token = signToken({ tenantId: 't1', scopes: ['admin'] }, 7200);
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1] + '==', 'base64').toString()
    );
    expect(payload.exp - payload.iat).toBe(7200);
  });

  it('throws if JWT_SECRET is too short', () => {
    process.env['JWT_SECRET'] = 'short';
    expect(() => signToken({ tenantId: 't1', scopes: ['backtest'] })).toThrow(
      'JWT_SECRET must be at least 32 characters'
    );
  });
});

describe('verifyToken', () => {
  it('roundtrips: sign → verify returns same payload', () => {
    const token = signToken({ tenantId: 'tenant42', scopes: ['backtest', 'live:monitor'] });
    const payload = verifyToken(token);
    expect(payload.tenantId).toBe('tenant42');
    expect(payload.scopes).toEqual(['backtest', 'live:monitor']);
  });

  it('throws on tampered signature', () => {
    const token = signToken({ tenantId: 't1', scopes: ['backtest'] });
    const [h, p] = token.split('.');
    const tampered = `${h}.${p}.invalidsignature`;
    expect(() => verifyToken(tampered)).toThrow('Invalid JWT signature');
  });

  it('throws on tampered payload', () => {
    const token = signToken({ tenantId: 't1', scopes: ['backtest'] });
    const parts = token.split('.');
    const fakePayload = Buffer.from(JSON.stringify({ tenantId: 'hacker', scopes: ['admin'] }))
      .toString('base64url');
    const tampered = `${parts[0]}.${fakePayload}.${parts[2]}`;
    expect(() => verifyToken(tampered)).toThrow();
  });

  it('throws on expired token', () => {
    const token = signToken({ tenantId: 't1', scopes: ['backtest'] }, -1);
    expect(() => verifyToken(token)).toThrow('JWT token expired');
  });

  it('throws on malformed token (wrong parts count)', () => {
    expect(() => verifyToken('not.a.valid.jwt.here')).toThrow('Invalid JWT format');
    expect(() => verifyToken('onlyone')).toThrow('Invalid JWT format');
  });

  it('throws if JWT_SECRET differs from signing secret', () => {
    const token = signToken({ tenantId: 't1', scopes: ['backtest'] });
    process.env['JWT_SECRET'] = 'completely-different-secret-32chars!!';
    expect(() => verifyToken(token)).toThrow('Invalid JWT signature');
  });
});

describe('refreshToken', () => {
  it('returns same token when exp is far away', () => {
    const token = signToken({ tenantId: 't1', scopes: ['backtest'] }, 3600);
    const refreshed = refreshToken(token);
    expect(refreshed).toBe(token);
  });

  it('issues new token when exp is within 15 minutes', () => {
    const token = signToken({ tenantId: 't1', scopes: ['backtest'] }, 800);
    const refreshed = refreshToken(token);
    expect(refreshed).not.toBe(token);
    const payload = verifyToken(refreshed);
    expect(payload.tenantId).toBe('t1');
    expect(payload.scopes).toEqual(['backtest']);
  });

  it('preserves keyId through refresh', () => {
    const token = signToken({ tenantId: 't1', scopes: ['backtest'], keyId: 'key123' }, 800);
    const refreshed = refreshToken(token);
    const payload = verifyToken(refreshed);
    expect(payload.keyId).toBe('key123');
  });
});
