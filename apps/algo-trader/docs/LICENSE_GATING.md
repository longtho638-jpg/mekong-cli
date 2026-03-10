# RAAS License Gating Documentation

## Overview

Algo-trader implements tier-based license gating to monetize premium features while keeping core trading engine open source.

## License Tiers

| Tier | Key Format | Features |
|------|------------|----------|
| **FREE** | (none) | Base strategies, live trading, basic backtest |
| **PRO** | `raas-pro-*`, `RPP-*` | ML models, premium data, advanced optimization |
| **ENTERPRISE** | `raas-ent-*`, `REP-*` | All features + priority support, custom strategies |

## Gated Features

### ML Model Weights (PRO)
- `GruPricePredictionModel.saveWeights()`
- `GruPricePredictionModel.loadWeights()`
- `StrategyLoader.registerMLStrategies()`

### API Endpoints

#### PRO Tier Required
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/tenants/*` | ALL | Tenant management |
| `/api/v1/strategies/*` | ALL | Strategy marketplace |
| `/api/v1/optimization/*` | ALL | Hyperparameter optimization |
| `/api/v1/hyperparameter/*` | ALL | Advanced optimization jobs |

#### ENTERPRISE Tier Required
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/arb/*` | ALL | Arbitrage scanning & execution |

#### FREE (No Gate)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health`, `/ready` | GET | Health checks |
| `/api/v1/health`, `/api/v1/ready` | GET | API health |
| `/api/v1/backtest/*` | ALL | Basic backtesting |
| `/api/v1/billing/*` | ALL | Billing info |

## Configuration

### Environment Variables
```bash
RAAS_LICENSE_KEY=raas-pro-your-key-here
```

### Headers (Priority: X-API-Key > Authorization > Env)
```http
X-API-Key: raas-pro-your-key-here
# OR
Authorization: Bearer raas-pro-your-key-here
```

## Error Responses

### 403 License Required
```json
{
  "error": "License Required",
  "message": "This endpoint requires PRO license. Current tier: free",
  "requiredTier": "pro",
  "currentTier": "free"
}
```

### LicenseError Exception
```typescript
{
  "name": "LicenseError",
  "message": "Feature \"ml_models\" is not enabled",
  "requiredTier": "pro",
  "feature": "ml_models"
}
```

## Testing

### Unit Tests
```bash
npm test -- --testPathPattern="raas-gate|license-auth"
```

### Integration Tests
```bash
npm test -- --testPathPattern="license-integration"
```

## Migration Guide

### Adding License Gate to New Features

1. Import LicenseService:
```typescript
import { LicenseService, LicenseTier, LicenseError } from '../lib/raas-gate';
```

2. Check tier before execution:
```typescript
const licenseService = LicenseService.getInstance();
if (!licenseService.hasTier(LicenseTier.PRO)) {
  throw new LicenseError(
    'Feature requires PRO license',
    LicenseTier.PRO,
    'feature_name'
  );
}
```

3. Or use convenience methods:
```typescript
LicenseService.getInstance().requireTier(LicenseTier.PRO, 'feature_name');
```

## Security Notes

- License validation is server-side only (no client bypass)
- Keys should be stored securely (env vars, secret managers)
- Production: validate keys against central license server
- Keys are cached per process restart

## Related Files

- `src/lib/raas-gate.ts` - Core license service
- `src/api/middleware/license-auth-middleware.ts` - API middleware
- `src/lib/raas-gate.test.ts` - Unit tests
- `tests/integration/license-endpoint-access.test.ts` - Integration tests
