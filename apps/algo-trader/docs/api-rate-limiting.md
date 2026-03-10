# RAAS License API Documentation

## Overview

RAAS (ROI as a Service) License Gate provides tier-based feature access control for the algo-trader platform.

**Authentication:** JWT-based license key validation (HMAC-SHA256)
**Authorization:** Tier-based access control (FREE, PRO, ENTERPRISE)

---

## License Tiers

| Tier | Features | Price |
|------|----------|-------|
| **FREE** | `basic_strategies`, `live_trading`, `basic_backtest` | $0 |
| **PRO** | FREE + `ml_models`, `premium_data`, `advanced_optimization` | $49/mo |
| **ENTERPRISE** | PRO + `priority_support`, `custom_strategies`, `multi_exchange` | Custom |

---

## Rate Limiting

**Limits:**
- 5 validation attempts per minute per IP address
- 5-minute block duration after threshold exceeded
- Successful validations don't count against limit

**Response Headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: <number>
X-RateLimit-Reset: <unix-timestamp>
```

**Error Response (429 Too Many Requests):**
```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many validation attempts. Please try again later.",
  "retryAfter": 300
}
```

---

## API Endpoints

### Validate License Key

**POST** `/api/license/validate`

**Request:**
```json
{
  "licenseKey": "raas-pro-abc123.abc123signature",
  "clientIp": "192.168.1.100"
}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "tier": "pro",
  "expiresAt": "2027-12-31T23:59:59.999Z",
  "features": ["ml_models", "premium_data", "advanced_optimization"]
}
```

**Response (403 Forbidden - Invalid):**
```json
{
  "valid": false,
  "tier": "free",
  "features": ["basic_strategies", "live_trading", "basic_backtest"]
}
```

---

### Verify Feature Access

**POST** `/api/license/verify-feature`

**Request:**
```json
{
  "licenseKey": "raas-pro-abc123",
  "feature": "ml_models"
}
```

**Response (200 OK):**
```json
{
  "allowed": true,
  "tier": "pro"
}
```

**Response (403 Forbidden):**
```json
{
  "allowed": false,
  "error": "Feature \"ml_models\" requires PRO license",
  "currentTier": "free",
  "requiredTier": "pro"
}
```

---

## Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| `LICENSE_INVALID` | Invalid license key format | Check key format (base64.base64) |
| `LICENSE_EXPIRED` | License has expired | Renew license |
| `TIER_INSUFFICIENT` | Current tier too low | Upgrade license |
| `RATE_LIMITED` | Too many attempts | Wait 5 minutes |
| `SIGNATURE_INVALID` | HMAC signature mismatch | Regenerate key |

---

## License Key Format

**Structure:** `base64url(payload).base64url(signature)`

**Payload Schema:**
```typescript
{
  sub: string;      // License key ID (e.g., "lic_abc123")
  tier: "free" | "pro" | "enterprise";
  features: string[];
  exp?: number;     // Expiration timestamp (seconds)
  iat: number;      // Issued at (seconds)
  iss: string;      // Issuer (e.g., "raas")
}
```

**Example Payload:**
```json
{
  "sub": "lic_a1b2c3d4e5f6",
  "tier": "pro",
  "features": ["ml_models", "premium_data"],
  "exp": 1735689600,
  "iat": 1704067200,
  "iss": "raas"
}
```

---

## Middleware Usage

### Express/Fastify

```typescript
import { requireLicenseMiddleware, LicenseTier } from './raas-gate';

// Protect premium routes
app.use('/api/premium/*', requireLicenseMiddleware(LicenseTier.PRO));

// Protect enterprise routes
app.use('/api/enterprise/*', requireLicenseMiddleware(LicenseTier.ENTERPRISE));
```

### Direct Usage

```typescript
import { LicenseService, LicenseTier, LicenseError } from './raas-gate';

const licenseService = LicenseService.getInstance();

// Validate license
await licenseService.validate(licenseKey, clientIp);

// Check tier
if (!licenseService.hasTier(LicenseTier.PRO)) {
  throw new LicenseError('PRO license required', LicenseTier.PRO, 'feature_name');
}

// Check feature
if (!licenseService.hasFeature('ml_models')) {
  // Handle missing feature
}
```

---

## Audit Logging

All license checks are logged in JSON format:

```json
{
  "event": "license_check",
  "feature": "ml_models",
  "success": true,
  "tier": "pro",
  "ip": "192.168.1.100",
  "timestamp": "2026-03-05T15:30:00.000Z"
}
```

**Event Types:**
- `license_check` - Feature/tier access check
- `license_expired` - Expired license detected
- `validation_failed` - Invalid key or rate limited

**Production Integration:**
```typescript
// Configure SIEM endpoint
process.env.SIEM_ENDPOINT = 'https://logging.example.com/ingest';
process.env.SIEM_API_KEY = 'your-api-key';
```

---

## Security Best Practices

1. **Never expose license keys client-side** - Validate on server only
2. **Use HTTPS** - License keys transmitted over secure channel only
3. **Rotate secrets** - Change `RAAS_LICENSE_SECRET` quarterly
4. **Monitor audit logs** - Alert on unusual validation failure patterns
5. **Rate limit by IP** - Prevent brute-force attacks

---

## Testing

```bash
# Run unit tests
npm test -- raas-gate.test.ts

# Run integration tests
npm test -- raas-gate.integration.test.ts

# Run security audit tests
npm test -- raas-gate-security.test.ts
```

---

## Related Documentation

- [Security Audit Report](../plans/reports/raas-security-audit-260305.md)
- [License Crypto Implementation](../src/lib/license-crypto.ts)
- [RAAS Gate Implementation](../src/lib/raas-gate.ts)
