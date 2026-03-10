---
title: "Phase 1: License Validator Core"
description: "Core license validation logic with JWT + API key support"
status: pending
priority: P1
effort: 2h
---

# Phase 1: License Validator Core

## Context Links

- Parent: [./plan.md](./plan.md)
- Existing: `../src/lib/raas-gate.ts` (LicenseService)
- Existing: `../src/lib/license-validator.ts` (startup validation)

## Overview

**Priority:** P1 (foundational)
**Status:** pending
**Effort:** 2h

Enhance existing `LicenseService` with remote validation against raas.agencyos.network.

## Key Insights

1. **Existing foundation:** `LicenseService` already has JWT validation via `verifyLicenseJWT()`
2. **Remote validation needed:** Connect to RaaS Gateway for real-time license verification
3. **Dual auth:** Support both JWT (user-facing) and mk_ API keys (server-to-server)

## Requirements

### Functional

- [ ] Validate `RAAS_LICENSE_KEY` env var on startup
- [ ] Remote validation against `raas.agencyos.network`
- [ ] Support JWT token validation
- [ ] Support mk_ API key authentication
- [ ] Cache validation result for 5 minutes (reduce API calls)

### Non-functional

- [ ] Response time < 100ms (cached)
- [ ] Graceful fallback to FREE tier if remote unavailable
- [ ] Log all validation attempts

## Architecture

```
┌──────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│  Application     │────▶│  LicenseService     │────▶│  RaaS Gateway    │
│  Startup         │     │  .validate()        │     │  /validate       │
└──────────────────┘     └─────────────────────┘     └──────────────────┘
                                │
                                ▼
                         ┌──────────────────┐
                         │  Local Cache     │
                         │  (5 min TTL)     │
                         └──────────────────┘
```

## Related Code Files

### To Modify

- `src/lib/raas-gate.ts` - Add remote validation
- `src/lib/jwt-validator.ts` - Enhance JWT verification

### To Create

- `src/lib/raas-remote-validator.ts` - Remote API client

## Implementation Steps

### 1. Create Remote Validator Client

```typescript
// src/lib/raas-remote-validator.ts
export interface RemoteValidationResult {
  valid: boolean;
  tier: LicenseTier;
  expiresAt?: string;
  features: string[];
  quotaRemaining?: number;
}

export class RaasRemoteValidator {
  private readonly gatewayUrl: string;
  private cache: Map<string, CachedResult> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(gatewayUrl: string = 'https://raas.agencyos.network') {
    this.gatewayUrl = gatewayUrl;
  }

  async validateLicense(
    key: string,
    clientIp?: string
  ): Promise<RemoteValidationResult> {
    // Check cache first
    const cached = this.getFromCache(key);
    if (cached) return cached;

    // Determine auth type
    const isJwt = key.startsWith('eyJ');
    const isApiKey = key.startsWith('mk_');

    // Build request
    const response = await fetch(`${this.gatewayUrl}/api/v1/license/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(isJwt ? { 'Authorization': `Bearer ${key}` } : {}),
        ...(isApiKey ? { 'X-API-Key': key } : {}),
      },
      body: JSON.stringify({ client_ip: clientIp }),
    });

    if (!response.ok) {
      throw new Error(`Gateway validation failed: ${response.status}`);
    }

    const result = await response.json();

    // Cache result
    this.setCache(key, result);

    return result;
  }

  private getFromCache(key: string): RemoteValidationResult | null {
    const cached = this.cache.get(key);
    if (!cached || Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return cached.result;
  }

  private setCache(key: string, result: RemoteValidationResult): void {
    this.cache.set(key, {
      result,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });
  }
}

interface CachedResult {
  result: RemoteValidationResult;
  expiresAt: number;
}
```

### 2. Integrate with LicenseService

Modify `src/lib/raas-gate.ts`:

```typescript
// Add to LicenseService constructor
private remoteValidator: RaasRemoteValidator;

private constructor() {
  this.remoteValidator = new RaasRemoteValidator(
    process.env.RAAS_GATEWAY_URL || 'https://raas.agencyos.network'
  );
}

// Modify validate() method
async validate(key?: string, clientIp?: string): Promise<LicenseValidation> {
  const licenseKey = key || process.env.RAAS_LICENSE_KEY;

  if (!licenseKey) {
    // Return FREE tier (no remote call)
    return this.getFreeTierValidation();
  }

  try {
    // Try remote validation first
    const remoteResult = await this.remoteValidator.validateLicense(
      licenseKey,
      clientIp
    );

    this.validatedLicense = {
      valid: remoteResult.valid,
      tier: remoteResult.tier,
      expiresAt: remoteResult.expiresAt,
      features: remoteResult.features,
    };

    return this.validatedLicense;
  } catch (error) {
    // Fallback to local JWT validation if gateway unavailable
    console.warn('[LicenseService] Remote validation failed, using local validation', error);
    return this.validateLocal(licenseKey, clientIp);
  }
}
```

## Success Criteria

- [ ] Remote validator class implemented
- [ ] 5-minute caching working
- [ ] JWT + API key auth supported
- [ ] Fallback to local validation on gateway error
- [ ] Unit tests for remote validator

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gateway downtime | High | Local JWT fallback |
| Rate limit exceeded | Medium | 5-min cache reduces calls |
| Network latency | Low | Async validation, caching |

## Security Considerations

- [ ] Never log full license keys (truncate for debugging)
- [ ] HTTPS only for gateway communication
- [ ] Validate gateway SSL certificate
- [ ] Timeout after 10s (prevent hanging)

## Next Steps

1. → Phase 2: Add FastAPI middleware
2. → Phase 3: Integrate KV rate limiting
