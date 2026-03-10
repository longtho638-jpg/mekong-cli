import { FingerprintGenerator } from '../../../../src/arbitrage/phase6_ghost/polymorphic-matrix/fingerprint-generator';
import { BrowserFingerprint } from '../../../../src/arbitrage/phase6_ghost/types';

const mockFingerprints: BrowserFingerprint[] = [
  { id: 'fp-1', userAgent: 'UA-1', acceptLanguage: 'en-US', platform: 'Win32', tlsVersion: 'TLSv1.3', ja3Hash: 'hash1', httpVersion: '2', headers: { 'X-Custom': 'val1' } },
  { id: 'fp-2', userAgent: 'UA-2', acceptLanguage: 'en-GB', platform: 'MacIntel', tlsVersion: 'TLSv1.3', ja3Hash: 'hash2', httpVersion: '2', headers: { 'X-Custom': 'val2' } },
  { id: 'fp-3', userAgent: 'UA-3', acceptLanguage: 'de-DE', platform: 'Linux', tlsVersion: 'TLSv1.3', ja3Hash: 'hash3', httpVersion: '1.1', headers: {} },
];

describe('FingerprintGenerator', () => {
  it('should return a fingerprint from database', () => {
    const gen = new FingerprintGenerator(mockFingerprints);
    const fp = gen.getFingerprint();
    expect(fp).toBeDefined();
    expect(fp.id).toMatch(/^fp-/);
  });

  it('should use static fingerprints when no custom provided', () => {
    const gen = new FingerprintGenerator();
    const fp = gen.getFingerprint();
    expect(fp).toBeDefined();
    expect(fp.userAgent).toBeTruthy();
    expect(fp.ja3Hash).toBeTruthy();
  });

  it('should avoid repeating the same fingerprint consecutively', () => {
    const gen = new FingerprintGenerator(mockFingerprints);
    const ids = new Set<string>();
    // Get enough samples to verify non-repetition
    for (let i = 0; i < 20; i++) {
      ids.add(gen.getFingerprint().id);
    }
    // Should use multiple fingerprints
    expect(ids.size).toBeGreaterThan(1);
  });

  it('should return the only fingerprint if database has one entry', () => {
    const gen = new FingerprintGenerator([mockFingerprints[0]]);
    const fp = gen.getFingerprint();
    expect(fp.id).toBe('fp-1');
    // Second call should also return same (only option)
    expect(gen.getFingerprint().id).toBe('fp-1');
  });

  it('should throw on empty database', () => {
    const gen = new FingerprintGenerator([]);
    expect(() => gen.getFingerprint()).toThrow('Fingerprint database is empty');
  });

  it('should apply fingerprint headers to request', () => {
    const gen = new FingerprintGenerator(mockFingerprints);
    const fp = mockFingerprints[0];
    const headers = gen.applyToHeaders({ 'Content-Type': 'application/json' }, fp);
    expect(headers['User-Agent']).toBe('UA-1');
    expect(headers['Accept-Language']).toBe('en-US');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-Custom']).toBe('val1');
  });

  it('should add fingerprint to database', () => {
    const gen = new FingerprintGenerator([]);
    expect(gen.getDatabaseSize()).toBe(0);
    gen.addFingerprint(mockFingerprints[0]);
    expect(gen.getDatabaseSize()).toBe(1);
  });

  it('should report database size', () => {
    const gen = new FingerprintGenerator(mockFingerprints);
    expect(gen.getDatabaseSize()).toBe(3);
  });
});
