# Stealth Order Execution Algorithms — Technical Reference
**Date:** 2026-03-02 | **Target:** TypeScript algo-trader backend

---

## Executive Summary

Stealth execution = two layers: **order mechanics** (sizing/timing) + **network camouflage** (fingerprint/IP). Both required. Most exchange surveillance systems trigger on statistical patterns (round numbers, fixed intervals, OTR ratio) — defeating them requires stochastic modeling, not simple randomness.

---

## 1. TWAP with Randomization

Standard TWAP is detectable via autocorrelation. Use Poisson inter-arrival + log-normal sizing.

```typescript
export class StealthTWAP {
  // Poisson delay: exponential distribution, λ = target rate/ms
  static poissonDelay(ordersPerMinute: number): number {
    const lambda = ordersPerMinute / 60000;
    return Math.round(-Math.log(1.0 - Math.random()) / lambda);
  }

  // Log-normal size: always positive, avoids round numbers
  static jitterSize(base: number, sigma = 0.15): number {
    const factor = Math.exp((Math.random() - 0.5) * sigma);
    return parseFloat((base * factor).toPrecision(7)); // "dirty" numbers
  }

  async execute(totalQty: number, durationMs: number, slices: number) {
    const baseInterval = durationMs / slices;
    const baseSize = totalQty / slices;
    for (let i = 0; i < slices; i++) {
      const delay = this.constructor.poissonDelay(60000 / baseInterval);
      await sleep(delay);
      const size = this.constructor.jitterSize(baseSize);
      await placeOrder(size);
    }
  }
}
```

**Key rules:** σ=0.15 keeps sizing within ±15%. Never use `Math.random() * interval` — uniform is detectable.

---

## 2. VWAP Stealth (Participation-of-Volume)

Stay below **8% market participation** — above 15% triggers HFT predatory response.

```typescript
export class StealthVWAP {
  // POV formula: OrderQty = (rate * marketVol) / (1 - rate)
  computeSlice(marketVolume: number, baseRate = 0.05): number {
    // Adaptive: slow down in high volatility
    const adaptiveRate = baseRate * (0.8 + Math.random() * 0.2);
    return parseFloat(((adaptiveRate * marketVolume) / (1 - adaptiveRate)).toFixed(8));
  }

  // VPIN toxicity gate — pause if order flow is toxic
  calculateVPIN(buckets: { buyVol: number; sellVol: number }[]): number {
    const imbalance = buckets.reduce((s, b) => s + Math.abs(b.buyVol - b.sellVol), 0);
    const total = buckets.reduce((s, b) => s + b.buyVol + b.sellVol, 0);
    return imbalance / total; // 0-1, pause execution if > 0.6
  }
}
```

---

## 3. Iceberg Orders

Visible tip must **vary per refresh** to defeat iceberg-checker algorithms.

```typescript
export class IcebergManager {
  // Tip varies ±15% each refresh
  nextTip(remaining: number, baseTip: number): number {
    const randomTip = baseTip * (0.85 + Math.random() * 0.30);
    return Math.min(parseFloat(randomTip.toFixed(8)), remaining);
  }

  // Event-driven: wait for WS fill, then delay refresh
  refreshDelay(): number {
    return 50 + Math.random() * 150; // 50-200ms human-like
  }
}

// WebSocket event pattern:
ws.on('orderTradeUpdate', async (fill) => {
  if (fill.orderId === icebergOrderId) {
    await sleep(iceberg.refreshDelay());
    const nextQty = iceberg.nextTip(remaining, BASE_TIP);
    await placeOrder(nextQty);
  }
});
```

---

## 4. Order Splitting (Child Orders)

```typescript
export function splitOrder(totalQty: number, minChunks = 5, maxChunks = 12): number[] {
  const n = minChunks + Math.floor(Math.random() * (maxChunks - minChunks));
  const raw = Array.from({ length: n }, () => Math.random());
  const sum = raw.reduce((a, b) => a + b, 0);
  // Normalize + apply log-normal noise per chunk
  return raw.map(r => parseFloat(((r / sum) * totalQty * (0.97 + Math.random() * 0.06)).toPrecision(7)));
}

// Stagger across pairs: never fire simultaneously
async function executeParallel(pairs: string[], qty: number) {
  for (const pair of pairs) {
    const stagger = 50 + Math.random() * 200; // 50-250ms offset
    setTimeout(() => executeOnPair(pair, qty), stagger);
  }
}
```

---

## 5. Anti-Pattern Detection Rules

Exchange surveillance (Solidus Labs, Eventus) triggers on:

| Pattern | Threshold | Fix |
|---------|-----------|-----|
| Order-to-Trade Ratio | >20:1 | Limit cancels, use IOC/FOK |
| Round numbers | 1.0, 100, 0.5 exactly | Apply ±0.025% noise |
| Fixed interval orders | σ<5% of mean | Poisson inter-arrival |
| Simultaneous multi-pair | <10ms apart | 50-200ms stagger |
| Fixed price offset | Always 1 tick inside | Vary 1-3 ticks randomly |

```typescript
export function applyCamouflage(amount: number): number {
  const noise = 1 + (Math.random() - 0.5) * 0.0005;
  return parseFloat((amount * noise).toPrecision(7));
}
```

---

## 6. Noise Injection

```typescript
export class NoiseInjector {
  // Random "decoy" orders at low qty — cancel after 500-2000ms
  async injectNoise(symbol: string, side: 'buy' | 'sell') {
    const decoyQty = 0.001 + Math.random() * 0.005; // tiny size
    const id = await placeLimitOrder(symbol, side, decoyQty, bestBid * 0.999);
    await sleep(500 + Math.random() * 1500);
    await cancelOrder(id);
  }

  // Occasional opposite-side small order to mask directional flow
  shouldInjectOpposite(): boolean {
    return Math.random() < 0.08; // 8% of the time
  }
}
```

---

## 7. Adaptive Rate Limiting

```typescript
export class AdaptiveRateLimiter {
  private errorCount = 0;
  private baseDelay = 200;

  async throttle(fn: () => Promise<any>) {
    const delay = this.baseDelay * Math.pow(1.5, this.errorCount);
    const jitter = delay * (0.8 + Math.random() * 0.4); // ±20% jitter
    await sleep(jitter);
    try {
      const result = await fn();
      this.errorCount = Math.max(0, this.errorCount - 1); // decay on success
      return result;
    } catch (e: any) {
      if (e.code === 429 || e.code === 418) {
        this.errorCount++;
        await sleep(60000 * this.errorCount); // back off hard on 418
      }
      throw e;
    }
  }
}
```

---

## 8. WebSocket/API Fingerprint Masking

TLS JA3 hash and HTTP/2 SETTINGS frame are exchange bot signals.

```typescript
import got from 'got';
import { CookieJar } from 'tough-cookie';

export class StealthHttpClient {
  private jar = new CookieJar();
  private uaPool = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  ];

  async request(url: string, opts = {}) {
    return got(url, {
      cookieJar: this.jar,
      headers: {
        'User-Agent': this.uaPool[Math.floor(Math.random() * this.uaPool.length)],
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      // Custom ciphers to mimic Chrome 120 JA3
      https: {
        ciphers: 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256',
        minVersion: 'TLSv1.2' as any,
      },
      ...opts,
    });
  }
}
```

---

## 9. IP Rotation & Proxy Strategy

- Use **sticky residential proxies** (Brightdata, Oxylabs) — rotate every 15-30min, not per-request
- Datacenter IPs (AWS/GCP) are pre-flagged by most exchanges
- IP-per-account: never share proxy between exchange accounts

```typescript
import { HttpProxyAgent } from 'http-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

export class ProxyRotator {
  private proxies: string[];
  private current = 0;
  private lastRotate = Date.now();
  private rotateInterval = 20 * 60 * 1000; // 20min

  getAgent() {
    if (Date.now() - this.lastRotate > this.rotateInterval) {
      this.current = (this.current + 1) % this.proxies.length;
      this.lastRotate = Date.now();
    }
    return new HttpProxyAgent(this.proxies[this.current]);
  }
}
```

---

## 10. Session Management

```typescript
export class HumanSessionManager {
  private sessionStart = Date.now();
  private requestCount = 0;

  // Simulate human "think time" between actions
  async humanPause() {
    const r = Math.random();
    if (r < 0.05) await sleep(30000 + Math.random() * 60000); // 5%: long pause
    else if (r < 0.2) await sleep(5000 + Math.random() * 15000); // 15%: medium
    else await sleep(200 + Math.random() * 2000); // 80%: normal
  }

  // Session length: 20-90 min, then "logout"
  shouldRotateSession(): boolean {
    const age = Date.now() - this.sessionStart;
    return age > (20 + Math.random() * 70) * 60 * 1000;
  }
}
```

---

## Key Libraries

| Purpose | Package |
|---------|---------|
| HTTP with TLS control | `got` + `got-cjs` |
| Cookie persistence | `tough-cookie` |
| HTTP proxy | `http-proxy-agent` |
| SOCKS proxy | `socks-proxy-agent` |
| Statistical distributions | `d3-random` or manual |

---

## Unresolved Questions

1. Does algo-trader use Binance-specific WS or generic CCXT? — affects iceberg refresh implementation
2. Is multi-account trading in scope? (changes IP rotation architecture significantly)
3. Regulatory jurisdiction — some noise injection patterns (decoy orders) may violate MiCA/FINRA spoofing rules depending on intent and jurisdiction
