/**
 * Fingerprint Generator — maintains a database of browser fingerprints
 * and randomly selects one for each outgoing request.
 * Uses static fallback fingerprints (no headless browser dependency).
 */
import { BrowserFingerprint } from '../types';

/** Pre-built fingerprint database mimicking real browsers */
const STATIC_FINGERPRINTS: BrowserFingerprint[] = [
  {
    id: 'chrome-win-120',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    acceptLanguage: 'en-US,en;q=0.9',
    platform: 'Win32',
    tlsVersion: 'TLSv1.3',
    ja3Hash: 'cd08e31494f9531f560d64c695473da9',
    httpVersion: '2',
    headers: { 'sec-ch-ua': '"Chromium";v="120", "Google Chrome";v="120"', 'sec-ch-ua-platform': '"Windows"' },
  },
  {
    id: 'firefox-mac-121',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
    acceptLanguage: 'en-US,en;q=0.5',
    platform: 'MacIntel',
    tlsVersion: 'TLSv1.3',
    ja3Hash: 'b32309a26951912be7dba376398abc3b',
    httpVersion: '2',
    headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
  },
  {
    id: 'safari-mac-17',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    acceptLanguage: 'en-US,en;q=0.9',
    platform: 'MacIntel',
    tlsVersion: 'TLSv1.3',
    ja3Hash: '773906b0efdefa24a7f2b8eb6985bf37',
    httpVersion: '2',
    headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
  },
  {
    id: 'chrome-linux-120',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    acceptLanguage: 'en-US,en;q=0.9',
    platform: 'Linux x86_64',
    tlsVersion: 'TLSv1.3',
    ja3Hash: 'cd08e31494f9531f560d64c695473da9',
    httpVersion: '2',
    headers: { 'sec-ch-ua': '"Chromium";v="120"', 'sec-ch-ua-platform': '"Linux"' },
  },
  {
    id: 'edge-win-120',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    acceptLanguage: 'en-US,en;q=0.9',
    platform: 'Win32',
    tlsVersion: 'TLSv1.3',
    ja3Hash: 'aa56c057389e0297e84fa2693ee17be1',
    httpVersion: '2',
    headers: { 'sec-ch-ua': '"Microsoft Edge";v="120"', 'sec-ch-ua-platform': '"Windows"' },
  },
];

export class FingerprintGenerator {
  private database: BrowserFingerprint[];
  private lastUsedId: string | null = null;

  constructor(customFingerprints?: BrowserFingerprint[]) {
    this.database = customFingerprints ?? [...STATIC_FINGERPRINTS];
  }

  /** Get a random fingerprint (avoids repeating the last one) */
  getFingerprint(): BrowserFingerprint {
    if (this.database.length === 0) {
      throw new Error('Fingerprint database is empty');
    }
    if (this.database.length === 1) {
      return this.database[0];
    }

    let fp: BrowserFingerprint;
    do {
      const idx = Math.floor(Math.random() * this.database.length);
      fp = this.database[idx];
    } while (fp.id === this.lastUsedId);

    this.lastUsedId = fp.id;
    return fp;
  }

  /** Apply fingerprint headers to a request headers object */
  applyToHeaders(headers: Record<string, string>, fp: BrowserFingerprint): Record<string, string> {
    return {
      ...headers,
      'User-Agent': fp.userAgent,
      'Accept-Language': fp.acceptLanguage,
      ...fp.headers,
    };
  }

  /** Add a fingerprint to the database */
  addFingerprint(fp: BrowserFingerprint): void {
    this.database.push(fp);
  }

  getDatabaseSize(): number {
    return this.database.length;
  }
}
