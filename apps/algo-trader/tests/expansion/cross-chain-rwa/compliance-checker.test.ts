import { ComplianceChecker } from '../../../src/expansion/cross-chain-rwa/compliance-checker';

describe('ComplianceChecker', () => {
  it('allows GOLD at any hour for US jurisdiction', () => {
    const checker = new ComplianceChecker({ jurisdiction: 'US' });
    const result = checker.check('GOLD', 12);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('OK');
  });

  it('blocks TSLA outside market hours', () => {
    const checker = new ComplianceChecker({ jurisdiction: 'US' });
    // TSLA market hours 13-20 UTC; hour 8 is outside
    const result = checker.check('TSLA', 8);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('market closed');
  });

  it('allows TSLA during market hours', () => {
    const checker = new ComplianceChecker({ jurisdiction: 'US' });
    const result = checker.check('TSLA', 15);
    expect(result.allowed).toBe(true);
  });

  it('blocks asset for restricted jurisdiction', () => {
    const checker = new ComplianceChecker({ jurisdiction: 'CN' });
    const result = checker.check('TSLA', 15);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('CN');
  });

  it('emits allowed event when permitted', () => {
    const checker = new ComplianceChecker({ jurisdiction: 'US' });
    const events: unknown[] = [];
    checker.on('allowed', (r) => events.push(r));
    checker.check('GOLD', 12);
    expect(events).toHaveLength(1);
  });

  it('emits blocked event when denied', () => {
    const checker = new ComplianceChecker({ jurisdiction: 'US' });
    const events: unknown[] = [];
    checker.on('blocked', (r) => events.push(r));
    checker.check('TSLA', 8);
    expect(events).toHaveLength(1);
  });

  it('checkAll returns one result per asset', () => {
    const checker = new ComplianceChecker({ jurisdiction: 'US' });
    const results = checker.checkAll(['GOLD', 'SILVER', 'OIL'], 12);
    expect(results).toHaveLength(3);
  });

  it('defaults to US jurisdiction when none provided', () => {
    const checker = new ComplianceChecker();
    const result = checker.check('GOLD', 12);
    expect(result.allowed).toBe(true);
  });
});
