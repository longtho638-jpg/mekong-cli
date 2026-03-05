# RaaS License API Documentation

## Overview

RaaS (Revenue as a Service) Open Core licensing gates premium CLI agents and features behind a license key verification system.

**Security Model:**
- Core CLI, commands, skills: **Open Source** (always available)
- Premium agents (CTO Auto-Pilot, Opus-gated): **License Required**
- License validation: Environment variable + format verification + SHA-256 hashing
- Rate limiting: Token bucket algorithm prevents abuse

---

## Security Features

### License Verification

1. **Format Validation**: Pattern matching for standard/short/legacy formats
2. **SHA-256 Hashing**: Keys hashed before comparison
3. **Tier Enforcement**: FREE/PRO/ENTERPRISE access control
4. **Safe Logging**: Masked keys in logs (`meko...5678`)

### Rate Limiting

Prevents brute-force license validation attacks:

| Tier | Rate Limit | Burst |
|------|------------|-------|
| FREE | 10 req/min | 20 |
| PRO | 100 req/min | 200 |
| ENTERPRISE | 1000 req/min | 2000 |

**Implementation:** Token bucket algorithm in `apps/algo-trader/src/lib/rate-limiter.ts`

---

## Environment Variables

### `RAAS_LICENSE_KEY`

Required for premium features. Set in `.env` or environment:

```bash
# .env.example
RAAS_LICENSE_KEY=mekong-ABCD-1234-EFGH-5678
```

**Accepted Formats:**
| Format | Pattern | Example |
|--------|---------|---------|
| Standard | `mekong-XXXX-XXXX-XXXX-XXXX` | `mekong-ABCD-1234-EFGH-5678` |
| Short | `mk_XXXXXXXXXXXXXXXX` | `mk_ABC123DEF456GH78` |
| Legacy | Any string ≥16 chars | `your-license-key-here` |

---

## API Functions

### `hasValidLicense(): boolean`

Check if a valid license is present.

**Returns:** `boolean` - `true` if valid license key exists

**Example:**
```typescript
import { hasValidLicense } from 'lib/raas-gate';

if (hasValidLicense()) {
  // Enable premium features
}
```

---

### `getLicenseValidation(): LicenseValidation`

Get full license validation with metadata.

**Returns:**
```typescript
interface LicenseValidation {
  valid: boolean;
  tier: LicenseTier;
  expiresAt?: Date;
  features: string[];
  error?: string;
}
```

**Example:**
```typescript
import { getLicenseValidation } from 'lib/raas-gate';

const validation = getLicenseValidation();
if (!validation.valid) {
  console.error(validation.error); // "RAAS_LICENSE_KEY not set"
}
```

---

### `requireLicense(featureName: string): void`

Require valid license for a feature. Throws if invalid.

**Throws:** `LicenseError` with code `LICENSE_REQUIRED` or `FEATURE_NOT_LICENSED`

**Example:**
```typescript
import { requireLicense, LicenseError } from 'lib/raas-gate';

try {
  requireLicense('CTO Auto-Pilot');
  // Proceed with premium feature
} catch (error) {
  if (error instanceof LicenseError) {
    console.error(error.code, error.message);
  }
}
```

---

### `requirePremiumAgent(agentName: string): void`

Gate access to premium agents with tier verification.

**Throws:** `LicenseError` with codes:
- `LICENSE_REQUIRED` - No valid license
- `TIER_UPGRADE_REQUIRED` - Current tier insufficient

**Example:**
```typescript
import { requirePremiumAgent } from 'lib/raas-gate';

requirePremiumAgent('opus-strategy');
// Now safe to use Opus Strategy agent
```

---

### `getAvailableAgents(): { available, premium, locked }`

Get lists of available/premium/locked agents.

**Returns:**
```typescript
{
  available: string[];   // Accessible agents
  premium: string[];     // All premium agents
  locked: string[];      // Locked agents (empty if licensed)
}
```

**Example:**
```typescript
import { getAvailableAgents } from 'lib/raas-gate';

const agents = getAvailableAgents();
console.log(`Unlocked: ${agents.available.length}`);
console.log(`Locked: ${agents.locked.length}`);
```

---

### `getLicenseStatus(): SafeLicenseStatus`

Get license status safe for logging (masks key).

**Returns:**
```typescript
{
  hasLicense: boolean;
  tier: LicenseTier;
  featureCount: number;
  maskedKey?: string; // "mek...678"
}
```

---

## License Tiers

| Tier | Agents Available | Features |
|------|-----------------|----------|
| `FREE` | Core agents only | None |
| `PRO` | + All premium agents | CTO Auto-Pilot, Opus agents |
| `ENTERPRISE` | + Custom agents | Priority support, custom models |

---

## Premium Agents

| Agent Key | Name | Tier | Description |
|-----------|------|------|-------------|
| `auto-cto-pilot` | CTO Auto-Pilot | PRO | Tự động tạo tasks theo Binh Pháp |
| `opus-strategy` | Opus Strategy | PRO | Strategic planning với Claude Opus 4.6 |
| `opus-parallel` | Opus Parallel | PRO | Parallel agent orchestration |
| `opus-review` | Opus Code Review | PRO | Security & quality review |

---

## Error Handling

### LicenseError Class

```typescript
class LicenseError extends Error {
  code: 'LICENSE_REQUIRED' | 'FEATURE_NOT_LICENSED' | 'TIER_UPGRADE_REQUIRED';
}
```

### Catch Pattern

```typescript
import { LicenseError } from 'lib/raas-gate';

try {
  requirePremiumAgent('opus-strategy');
} catch (error) {
  if (error instanceof LicenseError) {
    switch (error.code) {
      case 'LICENSE_REQUIRED':
        // Prompt user to get license
        break;
      case 'TIER_UPGRADE_REQUIRED':
        // Prompt upgrade
        break;
    }
  }
}
```

---

## Security Considerations

### Current Implementation

- License key stored in environment variable
- Format validation (pattern matching)
- SHA-256 hashing for key storage
- Tier-based feature gating

### Known Limitations

1. **No cryptographic signature** - Keys are not signed/verified
2. **No expiration enforcement** - Expiration field exists but not populated
3. **No online verification** - No phone-home to license server
4. **No rate limiting** - Unlimited validation attempts

### Production Recommendations

For production deployment:

1. **Implement JWT licenses** with RSA signature verification
2. **Add license server** for online verification
3. **Implement rate limiting** for validation endpoints
4. **Add telemetry** for license usage tracking
5. **Use hardware fingerprinting** for license binding

---

## Migration Guide

### From Legacy (v1.0)

```typescript
// OLD (v1.0)
import { hasValidLicense, requireLicense } from 'lib/raas-gate';

// NEW (v2.0) - Same API, enhanced security
import { hasValidLicense, requireLicense, getLicenseValidation } from 'lib/raas-gate';
```

Backward compatible - existing code continues to work.

---

## Testing

```typescript
import {
  validateLicenseKeyFormat,
  getLicenseValidation,
  LicenseError
} from 'lib/raas-gate';

describe('RaaS License Gate', () => {
  test('validates standard format', () => {
    expect(validateLicenseKeyFormat('mekong-ABCD-1234-EFGH-5678')).toBe(true);
  });

  test('rejects invalid format', () => {
    expect(validateLicenseKeyFormat('too-short')).toBe(false);
  });

  test('returns validation error', () => {
    const validation = getLicenseValidation();
    if (!validation.valid) {
      expect(validation.error).toBeDefined();
    }
  });
});
```
