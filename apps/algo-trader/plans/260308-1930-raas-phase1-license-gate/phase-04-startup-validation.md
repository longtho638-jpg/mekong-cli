---
title: "Phase 4: Startup Validation"
description: "Block application startup if license key is invalid"
status: pending
priority: P1
effort: 1h
---

# Phase 4: Startup Validation

## Context Links

- Parent: [./plan.md](./plan.md)
- Previous: [./phase-03-kv-rate-limiter.md](./phase-03-kv-rate-limiter.md)
- Related: `../src/lib/license-validator.ts`, `../src/index.ts`

## Overview

**Priority:** P1 (fail-fast security)
**Status:** pending
**Effort:** 1h

Block application startup if license key is missing or invalid.

## Key Insights

1. **Existing validation:** `initLicenseValidation()` already validates at startup
2. **Enhancement needed:** Add remote validation check, not just format check
3. **Graceful degradation:** Allow FREE tier if explicitly configured

## Requirements

### Functional

- [ ] Block startup if `RAAS_LICENSE_KEY` required but invalid
- [ ] Allow startup in FREE mode if key not provided (optional)
- [ ] Clear error messages for common issues
- [ ] Log validation result at startup

### Non-functional

- [ ] Validation completes < 5s (with timeout)
- [ ] No blocking if remote gateway unavailable (fallback to local)

## Architecture

```
Application Startup Flow:
┌─────────────────────────────────────────────────────────────┐
│  1. Load .env                                               │
│         │                                                   │
│         ▼                                                   │
│  2. Check RAAS_LICENSE_KEY present                         │
│         │                                                   │
│         ├── Missing ──▶ Required? ──Yes──▶ Exit with error│
│         │                    └──No──▶ FREE mode OK         │
│         │                                                   │
│         ▼                                                   │
│  3. Validate format (UUIDv4 or legacy)                     │
│         │                                                   │
│         └── Invalid ──▶ Exit with error                    │
│         │                                                   │
│         ▼                                                   │
│  4. Remote validation (async, 5s timeout)                  │
│         │                                                   │
│         ├── Valid ──▶ Log tier, continue                   │
│         ├── Invalid ──▶ Required? ──Yes──▶ Exit           │
│         │                        └──No──▶ FREE mode        │
│         └── Timeout ──▶ Fallback to local JWT, continue    │
│                                                              │
│         ▼                                                   │
│  5. Application starts                                      │
└─────────────────────────────────────────────────────────────┘
```

## Related Code Files

### To Modify

- `src/lib/license-validator.ts` - Add remote validation
- `src/index.ts` - Update initialization logging

### To Create

- None (enhance existing)

## Implementation Steps

### 1. Enhance License Validator

Modify `src/lib/license-validator.ts`:

```typescript
import { LicenseService, LicenseTier } from './raas-gate';

export async function initLicenseValidationAsync(
  options: {
    required?: boolean;
    allowFree?: boolean;
    timeoutMs?: number;
  } = {}
): Promise<LicenseValidationResult> {
  const {
    required = true,
    allowFree = true,
    timeoutMs = 5000,
  } = options;

  const licenseKey = process.env.RAAS_LICENSE_KEY;

  // Check if key is present
  if (!licenseKey || !licenseKey.trim()) {
    if (required && !allowFree) {
      logMissingKeyError();
      process.exit(1);
    } else {
      logger.warn('⚠️  RAAS_LICENSE_KEY not set - running in FREE mode');
      return { valid: false, error: 'missing', keyFormat: 'unknown' };
    }
  }

  // Validate format
  const format = detectKeyFormat(licenseKey);
  if (format === 'unknown') {
    logInvalidFormatError(licenseKey);
    process.exit(1);
  }

  // Remote validation with timeout
  logger.info('🔑 Validating license key...');

  try {
    const validationPromise = LicenseService.getInstance().validate();
    const result = await Promise.race([
      validationPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs)
      ),
    ]);

    if (result.valid) {
      logger.info(`✅ License validated: ${result.tier.toUpperCase()} tier`);
      if (result.expiresAt) {
        logger.info(`   Expires: ${new Date(result.expiresAt).toLocaleDateString()}`);
      }
      logger.info(`   Features: ${result.features.join(', ')}`);
    } else {
      if (required && !allowFree) {
        logger.error('❌ License validation failed');
        process.exit(1);
      }
      logger.warn('⚠️  Running in FREE tier (license invalid)');
    }

    return {
      valid: result.valid,
      error: result.valid ? undefined : 'invalid',
      keyFormat: format,
    };

  } catch (error) {
    if (error instanceof Error && error.message === 'timeout') {
      logger.warn('⚠️  Remote validation timeout - using local validation');
      // Fallback to local validation
      const localResult = LicenseService.getInstance().validateSync();
      logger.info(`✅ Local validation: ${localResult.tier.toUpperCase()} tier`);
      return { valid: localResult.valid, keyFormat: format };
    }

    // Other errors
    logger.error('❌ License validation failed:', error);
    if (required && !allowFree) {
      process.exit(1);
    }
    return { valid: false, error: 'validation_error', keyFormat: format };
  }
}

function logMissingKeyError(): void {
  logger.error('❌ LỖI: RAAS_LICENSE_KEY environment variable is MISSING');
  logger.error('');
  logger.error('Required format (UUIDv4): xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx');
  logger.error('Example: 550e8400-e29b-41d4-a716-446655440000');
  logger.error('');
  logger.error('To get a license key:');
  logger.error('  1. Visit: https://polar.sh/agencyos');
  logger.error('  2. Subscribe to a plan (PRO or ENTERPRISE)');
  logger.error('  3. Copy your license key from dashboard');
  logger.error('  4. Add to .env file: RAAS_LICENSE_KEY=your-key-here');
  logger.error('');
  logger.error('Or set environment variable:');
  logger.error('  export RAAS_LICENSE_KEY=your-license-key');
}

function logInvalidFormatError(key: string): void {
  logger.error('❌ LỖI: RAAS_LICENSE_KEY has INVALID FORMAT');
  logger.error('');
  logger.error(`Provided key: ${key.substring(0, 10)}...`);
  logger.error('');
  logger.error('Expected format (UUIDv4): xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx');
  logger.error('Example: 550e8400-e29b-41d4-a716-446655440000');
}
```

### 2. Update Application Entry Point

Modify `src/index.ts`:

```typescript
// Replace synchronous init with async
import { initLicenseValidationAsync } from './lib/license-validator';

async function bootstrap() {
  // Initialize license validation (async with remote check)
  const licenseResult = await initLicenseValidationAsync({
    required: process.env.NODE_ENV === 'production',
    allowFree: process.env.ALLOW_FREE_TIER === 'true',
    timeoutMs: 5000,
  });

  logger.info(`📄 License status: ${licenseResult.valid ? 'VALID' : 'FREE TIER'}`);

  // Continue with rest of initialization...
  const program = new Command();
  // ... rest of program setup
}

bootstrap().catch(error => {
  logger.error('Bootstrap failed:', error);
  process.exit(1);
});
```

## Success Criteria

- [ ] Async validation with timeout
- [ ] Clear error messages for missing/invalid keys
- [ ] FREE tier allowed if configured
- [ ] Remote validation with local fallback
- [ ] Updated startup logging

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gateway timeout | Medium | 5s timeout, local fallback |
| False negative | High | Local JWT fallback |
| Blocking startup | Low | Optional FREE tier mode |

## Security Considerations

- [ ] Production requires valid license (required=true)
- [ ] Development can run FREE tier (allowFree=true)
- [ ] Error messages don't leak key format details

## Next Steps

1. → Phase 5: Unit + integration tests
