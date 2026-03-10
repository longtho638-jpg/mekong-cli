/**
 * Tests for Auth scopes — scope validation and checking.
 */

import { SCOPES, ALL_SCOPES, hasScope, hasAllScopes, validateScopes } from '../../src/auth/scopes';

describe('Auth Scopes', () => {
  describe('SCOPES constant', () => {
    it('defines correct scopes', () => {
      expect(SCOPES.BACKTEST).toBe('backtest');
      expect(SCOPES.LIVE_TRADE).toBe('live:trade');
      expect(SCOPES.LIVE_MONITOR).toBe('live:monitor');
      expect(SCOPES.ADMIN).toBe('admin');
    });
  });

  describe('ALL_SCOPES', () => {
    it('includes all scopes', () => {
      expect(ALL_SCOPES).toContain(SCOPES.BACKTEST);
      expect(ALL_SCOPES).toContain(SCOPES.LIVE_TRADE);
      expect(ALL_SCOPES).toContain(SCOPES.LIVE_MONITOR);
      expect(ALL_SCOPES).toContain(SCOPES.ADMIN);
      expect(ALL_SCOPES.length).toBe(4);
    });
  });

  describe('hasScope()', () => {
    it('returns true when scope is present', () => {
      expect(hasScope(SCOPES.BACKTEST, [SCOPES.BACKTEST, SCOPES.LIVE_TRADE])).toBe(true);
    });

    it('returns false when scope is not present', () => {
      expect(hasScope(SCOPES.LIVE_TRADE, [SCOPES.BACKTEST])).toBe(false);
    });

    it('returns true for any scope when admin is present', () => {
      expect(hasScope(SCOPES.BACKTEST, [SCOPES.ADMIN])).toBe(true);
      expect(hasScope(SCOPES.LIVE_TRADE, [SCOPES.ADMIN])).toBe(true);
      expect(hasScope('invalid-scope', [SCOPES.ADMIN])).toBe(true);
    });

    it('handles empty actual scopes', () => {
      expect(hasScope(SCOPES.BACKTEST, [])).toBe(false);
    });
  });

  describe('hasAllScopes()', () => {
    it('returns true when all required scopes are present', () => {
      expect(hasAllScopes(
        [SCOPES.BACKTEST, SCOPES.LIVE_TRADE],
        [SCOPES.BACKTEST, SCOPES.LIVE_TRADE, SCOPES.LIVE_MONITOR]
      )).toBe(true);
    });

    it('returns false when any required scope is missing', () => {
      expect(hasAllScopes(
        [SCOPES.BACKTEST, SCOPES.LIVE_TRADE],
        [SCOPES.BACKTEST]
      )).toBe(false);
    });

    it('returns true for any scopes when admin is present', () => {
      expect(hasAllScopes([SCOPES.BACKTEST, SCOPES.LIVE_TRADE], [SCOPES.ADMIN])).toBe(true);
      expect(hasAllScopes(['invalid1', 'invalid2'], [SCOPES.ADMIN])).toBe(true);
    });

    it('handles empty required scopes', () => {
      expect(hasAllScopes([], [SCOPES.BACKTEST])).toBe(true);
    });
  });

  describe('validateScopes()', () => {
    it('returns true for valid scopes', () => {
      expect(validateScopes([SCOPES.BACKTEST, SCOPES.LIVE_TRADE])).toBe(true);
      expect(validateScopes([SCOPES.ADMIN])).toBe(true);
    });

    it('returns false for invalid scopes', () => {
      expect(validateScopes(['invalid-scope'])).toBe(false);
      expect(validateScopes([SCOPES.BACKTEST, 'fake-scope'])).toBe(false);
    });

    it('returns true for empty array', () => {
      expect(validateScopes([])).toBe(true);
    });
  });
});
