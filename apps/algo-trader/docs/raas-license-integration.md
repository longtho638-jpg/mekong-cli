# RAAS License Key Integration Guide

> **ROIaaS Phase 1** — License Gate for Premium Features

## Overview

RAAS (Revenue-as-a-Service) license key system gates premium features with tiered access control.

## License Tiers

| Tier | Features | Monthly Quota |
|------|----------|---------------|
| **FREE** | Basic strategies, live trading, basic backtest | 1,000 API calls |
| **PRO** | + ML models, premium data, advanced optimization | 10,000 API calls |
| **ENTERPRISE** | + Priority support, custom strategies, multi-exchange | 100,000 API calls |

## Quick Start

### 1. Set Environment Variable

```bash
# .env
RAAS_LICENSE_KEY="raas-pro-your-key-here"
```

### 2. Validate License

```typescript
import { LicenseService, LicenseTier } from './lib/raas-gate';

// Validate license key
const service = LicenseService.getInstance();
await service.validate(); // Reads from env var

// Check tier
if (service.hasTier(LicenseTier.PRO)) {
  // Access PRO features
}
```

### 3. Gate Premium Features

```typescript
// ML Models
import { requireMLFeature } from './lib/raas-gate';

requireMLFeature('gru_model'); // Throws if not PRO

// Premium Data
import { requirePremiumData } from './lib/raas-gate';

requirePremiumData(); // Throws if not PRO

// Custom Features
service.requireFeature('advanced_optimization');
```

## Integration Examples

### Backtest Engine

```typescript
import { BacktestEngine } from './backtest/BacktestEngine';
import { LicenseService, LicenseTier } from './lib/raas-gate';

const engine = new BacktestEngine();
const service = LicenseService.getInstance();

// Basic backtest — FREE tier OK
const result = await engine.runDetailed(strategy, candles);

// Walk-forward analysis — PRO only
if (service.hasTier(LicenseTier.PRO)) {
  const wf = await engine.walkForward(strategyFactory, candles);
}

// Monte Carlo — PRO only
if (service.hasTier(LicenseTier.PRO)) {
  const mc = engine.monteCarlo(trades, initialBalance);
}
```

### ML Strategy Loading

```typescript
import { StrategyLoader } from './core/StrategyLoader';

// FREE strategies
const rsi = StrategyLoader.load('RsiSma'); // OK

// ML strategies — PRO required
try {
  const gru = StrategyLoader.load('GruPrediction');
} catch (err) {
  // LicenseError: "Strategy requires PRO license"
}
```

### Model Encryption (PRO Feature)

```typescript
import { encryptModelWeights, decryptModelWeights } from './lib/model-encryption';
import * as tf from '@tensorflow/tfjs';

// Train model
const model = new GruPricePredictionModel();
model.build();

// Save encrypted weights
const artifacts = await model.saveWeights();
const encrypted = await encryptModelWeights(artifacts);

// Store encrypted.salt, encrypted.iv, encrypted.ciphertext, encrypted.authTag

// Load encrypted weights
const decrypted = await decryptModelWeights(encrypted);
model.loadWeights(decrypted);
```

## Error Handling

```typescript
import { LicenseError, LicenseTier } from './lib/raas-gate';

try {
  requireMLFeature('gru_model');
} catch (err) {
  if (err instanceof LicenseError) {
    console.log('Required tier:', err.requiredTier); // PRO
    console.log('Feature:', err.feature); // ml_models
    console.log('Message:', err.message);
    
    // Redirect to upgrade
    res.redirect('/pricing?required=pro');
  }
}
```

## Audit Logging

All license events are logged for compliance:

```json
[RAAS-AUDIT] {
  "eventId": "evt_1234567890_abc123",
  "eventType": "license_check",
  "timestamp": "2026-03-05T14:00:00.000Z",
  "clientId": "tenant-123",
  "tier": "pro",
  "feature": "ml_models",
  "success": true
}
```

## Rate Limiting

- **Validation attempts**: Max 5 per minute per IP
- **API requests**: 100 per minute per API key
- **Quota resets**: Monthly (1st day)

## Security Best Practices

1. **Never expose license keys in client code**
2. **Use environment variables or secure vault**
3. **Rotate keys periodically**
4. **Monitor audit logs for anomalies**
5. **Implement IP allowlisting for enterprise**

## Testing

```bash
# Run license gate tests
npm test -- raas-gate

# Run encryption tests
npm test -- model-encryption

# Run audit logging tests
npm test -- audit
```

## Upgrade Flow

1. User starts with FREE tier
2. Feature access denied → LicenseError thrown
3. App catches error → shows upgrade prompt
4. User purchases PRO → receives new key
5. App validates new key → unlocks features

## Support

- FREE: Community GitHub Issues
- PRO: Email support (48h SLA)
- ENTERPRISE: Priority Slack + 1h SLA
