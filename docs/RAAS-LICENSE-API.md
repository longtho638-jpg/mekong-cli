# 📜 RAAS License Gate API — ROIaaS Phase 1

> **R = ROI = RaaS** — Gating premium features behind license key.
> Ref: `docs/HIEN_PHAP_ROIAAS.md` - Dual-Stream Revenue Strategy

---

## Overview

RAAS License Gate enables **Engineering ROI** by gating premium CLI agents and features behind `RAAS_LICENSE_KEY` environment variable.

**Open Core Model:**
| Component | Status | Notes |
|-----------|--------|-------|
| Core CLI commands | ✅ Free | Always available |
| Open-source agents | ✅ Free | Community patterns |
| Premium agents | 🔒 Licensed | CTO Auto-Pilot, Opus-gated |
| Advanced workflows | 🔒 Licensed | Parallel execution, AGI loop |

---

## Quick Start

### 1. Set License Key

```bash
# .env or environment
RAAS_LICENSE_KEY=raas_pro_abc123def456789
```

### 2. Check Status

```typescript
import { getLicenseStatus } from './src/lib/raas-gate';

console.log(getLicenseStatus());
// 💎 PRO License: raas_pr...6789
//    Features: premium-agents, advanced-patterns, priority-support, custom-workflows
```

### 3. Gate Features

```typescript
import { hasFeature, requireFeature } from './src/lib/raas-gate';

// Check before using premium feature
if (hasFeature('agi-auto-pilot')) {
  // Run AGI Auto-Pilot
}

// Or throw error if not licensed
requireFeature('team-collaboration'); // Throws if no license
```

---

## License Tiers

| Tier | Env Var Pattern | Features |
|------|-----------------|----------|
| **FREE** | (none) | `basic-cli-commands`, `open-source-agents`, `community-patterns` |
| **PRO** | `raas_pro_*` | + `premium-agents`, `advanced-patterns`, `priority-support`, `custom-workflows` |
| **ENTERPRISE** | `raas_ent_*` | + `agi-auto-pilot`, `team-collaboration`, `audit-logs`, `sso-integration`, `dedicated-support` |

---

## API Reference

### `validateLicense(): LicenseValidation`

Returns full license validation result.

```typescript
interface LicenseValidation {
  isValid: boolean;
  licenseKey?: string;      // Masked
  tier: 'free' | 'pro' | 'enterprise';
  features: string[];
  error?: string;
}
```

### `hasFeature(feature: string): boolean`

Check if specific feature is available.

### `requireFeature(feature: string): void`

Require feature — throws `Error` if not available.

### `getLicenseStatus(): string`

Human-readable license status for CLI output.

### `loadLicenseFromFile(filePath?: string): LicenseValidation`

Load license from `.raas-license` file alternative to env var.

### `cliLicenseCheck(): void`

Print license status to console (for `mekong license` command).

---

## Premium Agents Matrix

| Agent | Tier | Description |
|-------|------|-------------|
| `cto-auto-pilot` | PRO | Tự động tạo tasks theo Binh Pháp |
| `opus-strategy` | PRO | Strategic planning với Claude Opus |
| `opus-parallel` | PRO | Parallel agent orchestration |
| `agi-loop` | ENTERPRISE | AGI self-improvement loop |
| `team-collab` | ENTERPRISE | Multi-session coordination |

---

## Security Model

### Current Implementation (Phase 1)

✅ Format validation (regex patterns)
✅ Tier-based feature gating
✅ Safe logging (masked keys)
✅ File-based license fallback

### Known Limitations (Phase 2 Roadmap)

⚠️ No cryptographic signatures
⚠️ No online verification
⚠️ No rate limiting on validation
⚠️ No expiration enforcement

### Production Hardening (Future)

1. JWT-based licenses with RSA signatures
2. License server verification
3. Rate limiting (token bucket)
4. Hardware fingerprinting
5. Telemetry & usage tracking

---

## Testing

```bash
# Run unit tests
pnpm test src/lib/raas-gate.test.ts

# Expected output
# ✓ validateLicense - 6 tests
# ✓ hasFeature - 4 tests
# ✓ requireFeature - 2 tests
# ✓ getLicenseStatus - 3 tests
# Total: 15 tests
```

---

## Troubleshooting

### "No license key provided"

**Fix:** Set `RAAS_LICENSE_KEY` in `.env`:
```bash
RAAS_LICENSE_KEY=raas_pro_your-key-here
```

### "License key too short"

**Fix:** Keys must be ≥16 characters. Use format:
- `raas_pro_XXXXXXXXXXXXXXXX`
- `raas_ent_XXXXXXXXXXXXXXXX`
- `sk-raas-XXXXXXXXXXXXXXXX`

### "Feature not available"

**Fix:** Upgrade license tier:
- PRO: Contact sales@agencyos.network
- ENTERPRISE: Custom deployment

---

## Code Examples

### TypeScript/Node.js

```typescript
import { validateLicense, hasFeature } from '@mekong/vibe-analytics';

// Validate at startup
const license = validateLicense();
if (!license.isValid) {
  console.log(`Running in ${license.tier} mode`);
}

// Gate premium routes
app.post('/api/agi-pilot', (req, res) => {
  if (!hasFeature('agi-auto-pilot')) {
    return res.status(403).json({ error: 'License required' });
  }
  // Handle AGI request
});
```

### Python

```python
import os
from src.lib.raas_gate import validate_license, has_feature

# Check license
license = validate_license()
if license['is_valid']:
    print(f"Licensed: {license['tier']}")

# Gate feature
if has_feature('premium-agents'):
    run_premium_agent()
else:
    print("Upgrade required")
```

---

## Related Docs

- `docs/HIEN_PHAP_ROIAAS.md` - ROIaaS Constitution
- `docs/BINH_PHAP_MASTER.md` - Strategic Planning
- `src/lib/raas-gate.ts` - Implementation
- `src/lib/raas-gate.test.ts` - Unit Tests

---

_Last Updated: 2026-03-05_
_Version: 1.0.0 (Phase 1)_
