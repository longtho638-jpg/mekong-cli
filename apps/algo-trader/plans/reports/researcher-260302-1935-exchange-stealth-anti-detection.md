# Research Report: Exchange Anti-Detection for Algo Crypto Trading

**Date:** 2026-03-02 | **Scope:** Binance, OKX, Bybit, Coinbase detection + stealth countermeasures

---

## Executive Summary

Crypto exchanges use layered surveillance: API telemetry, order pattern ML models, IP fingerprinting, and regulatory compliance tools (Chainalysis, Solidus Labs, NICE Actimize). Getting flagged is rarely binary — exchanges throttle first, then restrict, then ban. Professional algo traders blend in by mimicking human statistical distributions and staying under behavioral thresholds. The core principle: **predictability kills accounts**.

---

## 1. How Exchanges Detect Bot Trading

### 1.1 API Rate & Weight Analysis
- **Binance Spot**: 6,000 request weight/min per IP. Burst → HTTP 429 → IP ban.
- **Binance Futures**: separate weight system; >1,200 orders/min triggers review.
- **Order-to-Trade Ratio (OTR)**: high cancel rate on unfilled orders = wash trading flag. Binance tracks `totalOrderCount / cancelledOrderCount` per 24h window.
- **Fill rate heuristic**: consistently placing orders that fill at exact best-bid/ask signals HFT arbitrage bot.

### 1.2 Timing Analysis
- Sub-millisecond precision on order placement = inhuman. Human median reaction time is 200-250ms with 50-100ms std deviation.
- Fixed-interval polling (every 1000ms exactly) is a trivial fingerprint.
- Zero variance in order intervals = immediate flag on behavioral ML models.

### 1.3 Order Pattern Analysis
- **Fixed size orders**: placing exactly 0.1 BTC every cycle is textbook bot behavior.
- **Round number bias**: humans tend toward round numbers; bots often produce precise decimal outputs (0.13847 BTC).
- **Simultaneous multi-pair placement**: placing on 20 pairs at the exact same timestamp = coordinated bot.
- **Order book layering**: stacking orders at fixed intervals above/below mid triggers spoofing detection.

### 1.4 IP & Session Fingerprinting
- Multiple accounts from same IP / ASN subnet = linked account detection.
- VPN/datacenter ASNs (AWS, GCP, Hetzner, DigitalOcean) are flagged higher than residential.
- TLS fingerprint (JA3 hash): Python `requests` vs browser vs ccxt produce distinct JA3 signatures.
- User-Agent mismatch: no UA header or bot-like UA on REST calls.
- Session patterns: login at exact intervals, zero idle time, never uses UI endpoints.

### 1.5 Behavioral Heuristics (ML-Based)
- Exchanges use vendors: **Solidus Labs**, **Chainalysis**, **NICE Actimize SURVEIL-X**, **Nasdaq Crypto Surveillance**.
- Detection models include: momentum ignition, layering/spoofing, wash trading correlation, cross-account pattern matching.
- **MiCA (EU, Dec 2024)**: standardized JSON schema for all orders/trades → uniform cross-exchange surveillance.
- Consequence ladder: rate-limit → API key suspension → account restriction → ban.

---

## 2. Stealth Techniques: Technical Implementation

### 2.1 Timing Jitter (Most Critical)

**Never use fixed intervals.** Sample delays from distributions:

```python
import numpy as np
import time

def human_delay(base_ms: float = 500, sigma_ms: float = 150) -> float:
    """Gaussian jitter centered on base_ms."""
    delay = np.random.normal(base_ms, sigma_ms)
    return max(delay, 50) / 1000  # floor at 50ms

def poisson_delay(rate_per_minute: float = 10) -> float:
    """Poisson inter-arrival: random but bounded average rate."""
    return np.random.exponential(60.0 / rate_per_minute)

# Usage: between orders
time.sleep(human_delay(base_ms=800, sigma_ms=200))
```

**Poisson** is superior for order arrival modeling — it's the standard model for random independent events (matches actual human trade arrival).

### 2.2 Volume Distribution (Gaussian Slicing)

```python
def slice_order(total_qty: float, n_slices: int = 5) -> list[float]:
    """Gaussian-distributed order slices, not equal splits."""
    weights = np.abs(np.random.normal(1.0, 0.3, n_slices))
    weights /= weights.sum()
    slices = [round(total_qty * w, 4) for w in weights]
    # Ensure sum is exact
    slices[-1] += total_qty - sum(slices)
    return slices
```

- Randomize size: add ±5-15% noise to target quantity.
- Avoid round numbers: `qty = round(base_qty * (1 + random.uniform(-0.08, 0.08)), 5)`
- TWAP with randomized intervals beats fixed-interval TWAP for detection avoidance.

### 2.3 Order Book Depth Awareness

- Never consume more than 2-3% of visible depth at one price level.
- Check bid-ask spread width before placing — thin spread markets have more surveillance.
- Use **iceberg orders** (supported natively on Binance, OKX) to hide true quantity.
- Place limit orders 1-3 ticks inside the spread, not at exact best bid/ask.

### 2.4 Smart Rate Limiting

```python
class StealthRateLimiter:
    """Stay at 60-70% of exchange limit, not 95%+."""

    def __init__(self, max_weight_per_min: int = 6000, target_pct: float = 0.65):
        self.budget = max_weight_per_min * target_pct  # 3900/min
        self.window_start = time.time()
        self.used = 0

    def consume(self, weight: int):
        now = time.time()
        if now - self.window_start > 60:
            self.used = 0
            self.window_start = now
        if self.used + weight > self.budget:
            sleep_time = 60 - (now - self.window_start)
            time.sleep(sleep_time + random.uniform(1, 5))  # jitter the reset
            self.used = 0
            self.window_start = time.time()
        self.used += weight
```

Key: **never run at 90%+ of limit**. Pattern of consistently hitting 99% is itself a detection signal.

### 2.5 Human-Like Session Behavior

- Inject occasional REST calls to non-trading endpoints (account info, balance checks).
- Vary order type mix: ~70% limit, ~20% market, ~10% stop-limit (pure limit-only bots are obvious).
- Simulate idle gaps: 5-30 minute pauses that look like "user stepped away."
- Add occasional intentional small losses / unprofitable trades to break pattern consistency.
- Never trade 24/7 at uniform intensity — humans sleep.

### 2.6 IP / Network Fingerprint Rotation

- Use **residential proxies** (not datacenter IPs): Bright Data, Oxylabs, Smartproxy.
- Rotate IPs per session, not per request (too frequent rotation is itself a flag).
- Each IP → one API key. Never share API keys across IPs.
- Use different TLS client libraries or configure JA3 fingerprint: `curl-cffi` in Python mimics browser TLS.

```python
from curl_cffi import requests  # Mimics Chrome TLS fingerprint
session = requests.Session(impersonate="chrome110")
```

### 2.7 Order Cancellation Hygiene

- Keep cancel rate < 20% of placed orders (OTR threshold varies by exchange).
- Avoid placing-then-immediately-canceling within same second.
- If using maker strategy, allow orders to rest ≥500ms before considering cancel.

---

## 3. Libraries & Academic References

### Libraries with Relevant Features

| Library | Stealth Feature | Notes |
|---------|----------------|-------|
| `ccxt` | Rate limit manager, retry backoff | No built-in jitter; add manually |
| `hummingbot` | Native rate limiting, connector framework | Open source, study connector layer |
| `freqtrade` | `stoploss_on_exchange`, throttle config | No stealth but configurable timing |
| `curl-cffi` | Browser TLS impersonation (JA3) | Critical for fingerprint avoidance |
| `numpy` | Gaussian/Poisson sampling | For all timing and volume randomization |

### Academic / Conceptual Foundations

- **Almgren & Chriss (2000)**: "Optimal Execution of Portfolio Transactions" — optimal liquidation model; TWAP/VWAP derived from this. Executing at lower participation rates minimizes detection footprint.
- **Implementation Shortfall** (Perold 1988): framework for slicing orders; naturally produces variable-size slices.
- **Avellaneda & Stoikov (2008)**: market-making model with inventory risk; natural randomness in quotes.
- **MiCA Technical Standards (Dec 2024)**: defines machine-readable order/trade schema used by EU exchange surveillance — understanding this helps design non-detectable patterns.
- FINRA 2024 Regulatory Oversight Report: documents momentum ignition / layering detection patterns (directly applicable to crypto).

---

## 4. What Gets You Flagged vs. Blending In

| Flagged (Bot Signature) | Blending In (Human Signature) |
|------------------------|-------------------------------|
| Fixed interval orders (1000ms exactly) | Gaussian jitter (800ms ± 200ms) |
| Always exact round quantities | Quantities with natural variance |
| 100% fill rate, zero slippage | Occasional partial fills, small losses |
| 24/7 uniform trading activity | Activity clusters, idle gaps |
| API-only session, no UI calls | Mixed endpoint usage |
| Datacenter IP, VPN ASN | Residential IP, stable geolocation |
| Cancel rate >50% (HFT spoofing) | Cancel rate <20% |
| Simultaneous multi-pair at same ms | Staggered pair execution |
| Perfect timing at open/close | Distributed across session |
| Python `requests` default TLS | Browser-impersonating TLS (curl-cffi) |

---

## 5. Implementation Priority (Ranked)

1. **Timing jitter** — single highest-impact change; Poisson delays immediately break fixed-interval fingerprint.
2. **Volume randomization** — Gaussian-sliced orders; avoid round numbers.
3. **Rate limiter at 65% budget** — never spike to limits.
4. **Cancel rate control** — stay under 20% OTR.
5. **Order book depth check** — don't consume >2% of visible liquidity per order.
6. **Session behavior injection** — idle gaps, non-trading API calls.
7. **TLS fingerprint** — use `curl-cffi` for API calls.
8. **Residential IP** — only if operating at scale with multiple accounts.

---

## Unresolved Questions

- Specific OTR thresholds per exchange (Binance/OKX publish limits but not behavioral thresholds).
- Whether exchanges share ban lists cross-platform (suspected but unconfirmed).
- Effectiveness of JA3 mimicry specifically for Binance WAF (Cloudflare-backed).
- Whether OKX's native TWAP/iceberg order types bypass their own surveillance triggers.
