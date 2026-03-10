# 📜 ROIaaS License API Guide

> **ROIaaS Phase 1** — License Gate for Premium Features
> Version: 1.0.0 | Updated: 2026-03-06

---

## 🎯 Overview

Algo Trader implements tier-based licensing to gate premium features while keeping core trading engine open source.

```
┌─────────────────────────────────────────────────────────┐
│                    ROIaaS Model                          │
├─────────────────────────────────────────────────────────┤
│  HƯ (Open)        │  THỰC (Closed/Monetized)            │
│  ─────────────────┼────────────────────────────────────  │
│  • Source code    │  • ML model weights                 │
│  • Base strategies│  • Premium backtest data (>10k)     │
│  • Live trading   │  • Walk-forward analysis            │
│  • Basic backtest │  • Monte Carlo simulation           │
│                   │  • Priority support                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🎫 License Tiers

| Tier | Price | Max Strategies | Max Daily Loss | Max Position | Features |
|------|-------|----------------|----------------|--------------|----------|
| **FREE** | $0 | 1 | $50 | $500 | Base strategies, live trading, basic backtest (<10k candles) |
| **PRO** | $49/mo | 5 | $500 | $5,000 | + ML models, premium data, walk-forward, Monte Carlo |
| **ENTERPRISE** | $199/mo | ∞ | $5,000 | $50,000 | + Priority support, custom strategies, multi-exchange |

---

## 🚀 Quick Start

### 1. Set License Key

```bash
# .env
RAAS_LICENSE_KEY="raas-pro-your-key-here"
```

### 2. Basic Usage

```typescript
import { LicenseService, LicenseTier } from './lib/raas-gate';

const license = LicenseService.getInstance();

// Validate license (reads from env var)
await license.validate();

// Check tier
if (license.hasTier(LicenseTier.PRO)) {
  // Access PRO features
  await runWalkForwardAnalysis();
}

// Or use convenience methods
import { isPremium, validateLicense } from './lib/raas-gate';

if (isPremium()) {
  // PRO or ENTERPRISE
}
```

---

## 📚 API Reference

### LicenseService (Singleton)

```typescript
const license = LicenseService.getInstance();
```

#### Methods

| Method | Params | Returns | Description |
|--------|--------|---------|-------------|
| `validate()` | `key?: string, clientIp?: string` | `Promise<LicenseValidation>` | Validate license key (JWT + legacy) |
| `validateSync()` | `key?: string, clientIp?: string` | `LicenseValidation` | Sync validation |
| `hasTier()` | `required: LicenseTier` | `boolean` | Check if current tier >= required |
| `hasFeature()` | `feature: string` | `boolean` | Check if feature enabled |
| `requireTier()` | `required: LicenseTier, feature: string` | `void` | Throw if insufficient tier |
| `requireFeature()` | `feature: string` | `void` | Throw if feature not enabled |
| `getTier()` | - | `LicenseTier` | Get current tier |
| `isExpired()` | - | `boolean` | Check if license expired |
| `reset()` | - | `void` | Reset cache (testing) |

#### Example: Validate & Check Tier

```typescript
import { LicenseService, LicenseTier, LicenseError } from './lib/raas-gate';

const license = LicenseService.getInstance();

// Validate with custom key
const result = await license.validate('raas-pro-abc123');
console.log(result.tier); // 'pro'

// Check access
if (!license.hasTier(LicenseTier.PRO)) {
  throw new LicenseError(
    'Walk-forward requires PRO license',
    LicenseTier.PRO,
    'walk_forward_analysis'
  );
}

// Or use requireTier (auto-throws)
license.requireTier(LicenseTier.PRO, 'monte_carlo_simulation');
```

---

### Convenience Helpers

```typescript
import {
  isPremium,
  isEnterprise,
  getLicenseTier,
  validateLicense,
  requireMLFeature,
  requirePremiumData,
  requireLicenseMiddleware,
} from './lib/raas-gate';
```

#### Example: Feature Gating

```typescript
// Gate ML features
function loadMLModel(modelName: string) {
  requireMLFeature(modelName); // Throws if not PRO
  // Load model...
}

// Gate premium data
function fetchHistoricalData(symbol: string, days: number) {
  if (days > 10000) {
    requirePremiumData(); // Throws if not PRO
  }
  // Fetch data...
}
```

---

### Express/Fastify Middleware

```typescript
import { requireLicenseMiddleware, LicenseTier } from './lib/raas-gate';

// Fastify example
app.use('/api/v1/optimization/*', requireLicenseMiddleware(LicenseTier.PRO));
app.use('/api/v1/hyperparameter/*', requireLicenseMiddleware(LicenseTier.PRO));
app.use('/api/v1/arb/*', requireLicenseMiddleware(LicenseTier.ENTERPRISE));
```

#### Error Response

```json
{
  "error": "License Required",
  "message": "This endpoint requires PRO license. Current tier: free",
  "requiredTier": "pro",
  "currentTier": "free"
}
```

---

## 🔌 Integration Examples

### Backtest Engine

```typescript
import { BacktestEngine } from './backtest/BacktestEngine';
import { LicenseService, LicenseTier } from './lib/raas-gate';

const engine = new BacktestEngine();
const license = LicenseService.getInstance();

// Basic backtest — FREE tier OK
const result = await engine.runDetailed(strategy, candles);

// Walk-forward analysis — PRO required
try {
  const wf = await engine.walkForward(strategyFactory, candles, 3, 0.7);
} catch (err) {
  if (err instanceof LicenseError) {
    // Show upgrade prompt
    console.log('Upgrade to PRO for walk-forward analysis');
  }
}

// Monte Carlo — PRO required
try {
  const mc = engine.monteCarlo(trades, 10000, 100);
} catch (err) {
  if (err instanceof LicenseError) {
    console.log('Upgrade to PRO for Monte Carlo simulation');
  }
}
```

### Premium Data (>10k candles)

```typescript
async function fetchCandles(symbol: string, days: number) {
  const license = LicenseService.getInstance();

  if (days > 10000) {
    license.requireFeature('premium_data');
  }

  // Fetch from data provider...
}
```

### ML Strategy Loading

```typescript
import { StrategyLoader } from './core/StrategyLoader';

// FREE strategies
const rsi = await StrategyLoader.load('RsiSma'); // OK

// ML strategies — PRO required
try {
  const gru = await StrategyLoader.load('GruPricePrediction');
} catch (err) {
  if (err instanceof LicenseError) {
    console.log('Upgrade to PRO for ML strategies');
  }
}
```

---

## 🔄 Migration Guide

### For Existing Users (Pre-License)

If you've been using algo-trader before license gating:

#### Step 1: Check Current Usage

```bash
# Check which features you use
grep -r "walkForward\|monteCarlo\|GruPrice" src/
```

#### Step 2: Choose Tier

| If you use... | Upgrade to... |
|---------------|---------------|
| Only RSI/SMA strategies | FREE (no action) |
| ML models, walk-forward | PRO ($49/mo) |
| Multi-exchange arbitrage | ENTERPRISE ($199/mo) |

#### Step 3: Set License Key

```bash
# .env
RAAS_LICENSE_KEY="raas-pro-your-key-here"

# Or pass via header
curl -H "X-API-Key: raas-pro-your-key" http://localhost:3000/api/v1/optimization
```

#### Step 4: Handle Upgrade Gracefully

```typescript
import { LicenseError, LicenseTier } from './lib/raas-gate';

try {
  await runPremiumFeature();
} catch (err) {
  if (err instanceof LicenseError) {
    // Log error with tier info
    console.error(`Upgrade required: ${err.requiredTier}`);
    console.error(`Missing feature: ${err.feature}`);

    // Show upgrade UI
    showUpgradeDialog(err.requiredTier);
  }
}
```

---

### For New Integrations

```typescript
// 1. Import
import { LicenseService, LicenseTier, LicenseError } from './lib/raas-gate';

// 2. Validate early (app startup)
await LicenseService.getInstance().validate();

// 3. Gate features at point of use
function accessPremiumFeature() {
  LicenseService.getInstance().requireTier(LicenseTier.PRO, 'feature_name');
  // Feature implementation...
}

// 4. Handle errors gracefully
try {
  accessPremiumFeature();
} catch (err) {
  if (err instanceof LicenseError) {
    // Redirect to pricing
    res.redirect('/pricing?required=pro&feature=feature_name');
  }
}
```

---

## 🛡️ Security Features

| Feature | Description |
|---------|-------------|
| JWT Validation | Cryptographic signing (HS256) |
| Rate Limiting | Max 5 validation attempts/min per IP |
| Audit Logging | All license checks logged (DEBUG_AUDIT=true) |
| Expiration Check | Auto-revoke expired licenses |
| Timing-Safe | Prevents timing attacks on checksums |

### Enable Audit Logging

```bash
# .env
DEBUG_AUDIT=true
```

```json
// Output
[RAAS-AUDIT] {
  "event": "license_check",
  "feature": "ml_models",
  "success": true,
  "tier": "pro",
  "timestamp": "2026-03-06T01:00:00.000Z"
}
```

---

## 🧪 Testing

```bash
# Run license tests
npm test -- --testPathPattern="raas-gate|license"

# Run with audit logging
DEBUG_AUDIT=true npm test

# Run integration tests
npm test -- --testPathPattern="integration"
```

### Mock License in Tests

```typescript
import { LicenseService, LicenseTier } from './lib/raas-gate';

beforeEach(() => {
  const license = LicenseService.getInstance();
  license.reset();
});

test('PRO feature with mock license', async () => {
  const license = LicenseService.getInstance();
  await license.activateLicense('test-pro-key', LicenseTier.PRO);

  // Test PRO feature
  expect(() => {
    license.requireFeature('ml_models');
  }).not.toThrow();
});
```

---

## 🆘 Troubleshooting

### Error: "Feature requires PRO license"

```typescript
// Cause: Trying to access PRO feature without license
// Fix: Set RAAS_LICENSE_KEY or upgrade tier

// Check current tier
const license = LicenseService.getInstance();
console.log(license.getTier()); // 'free'

// Validate with key
await license.validate('raas-pro-your-key');
```

### Error: "Too many validation attempts"

```typescript
// Cause: Rate limit exceeded (5 attempts/min)
// Fix: Wait 5 minutes or contact support

// Check rate limit status
const attempts = license.getValidationAttempts('192.168.1.100');
console.log(attempts); // 5
```

### Error: "License expired"

```typescript
// Cause: License expiration date passed
// Fix: Renew license

// Check expiration
if (license.isExpired()) {
  console.log('License expired, please renew');
}
```

---

## 📞 Support

| Tier | Support Channel | SLA |
|------|-----------------|-----|
| FREE | GitHub Issues | Community |
| PRO | Email | 48 hours |
| ENTERPRISE | Priority Slack | 1 hour |

---

## 🔗 Related Files

- `src/lib/raas-gate.ts` — Core license service
- `src/lib/jwt-validator.ts` — JWT verification
- `src/lib/raas-gate.test.ts` — Unit tests
- `tests/integration/license-endpoint-access.test.ts` — Integration tests
- `docs/LICENSE_GATING.md` — Gating documentation
