# License Validation Guide

> **ROIaaS Phase 1** - Startup license validation with TypeScript source of truth

---

## Overview

Mekong CLI uses a two-tier license validation system:

1. **TypeScript Source of Truth** (`src/lib/raas-gate.ts`) - Core validation logic
2. **Python Wrapper** (`src/lib/raas_gate_validator.py`) - Spawns Node.js subprocess

This architecture ensures:
- Single source of truth for license validation
- Consistent validation across TypeScript and Python components
- Fallback to local validation when Node.js unavailable

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  mekong CLI (Python - src/main.py)                      │
│    │                                                     │
│    ▼ startup                                             │
│  ┌─────────────────────────────────────────────────┐    │
│  │  src/lib/raas_gate_validator.py (Python wrapper) │    │
│  │    - spawn Node.js subprocess                    │    │
│  │    - pass RAAS_LICENSE_KEY                       │    │
│  │    - parse JSON response                         │    │
│  └─────────────────────────────────────────────────┘    │
│    │                                                     │
│    ▼ subprocess                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  scripts/validate-license.ts (Node.js)           │    │
│  │    - import LicenseService từ lib/raas-gate.ts   │    │
│  │    - validateSync()                              │    │
│  │    - output JSON: {valid, tier, features, error} │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## License Tiers

| Tier | Features | Commands/day | Validation |
|------|----------|--------------|------------|
| **FREE** | Basic CLI, open-source agents | Unlimited | No key required |
| **PRO** | Premium agents, ML models, custom workflows | 1,000 | Valid key required |
| **ENTERPRISE** | AGI auto-pilot, team collaboration, SSO | Unlimited | Valid key required |

---

## Setup

### 1. Get a License Key

Visit [raas.mekong.dev/pricing](https://raas.mekong.dev/pricing) to get your license key.

### 2. Set Environment Variable

```bash
# Add to .env file
RAAS_LICENSE_KEY=raas_pro_20260306_abc123def456789

# Or export in shell
export RAAS_LICENSE_KEY=raas_pro_20260306_abc123def456789
```

### 3. Verify License

```bash
mekong license check
```

---

## Free Commands

These commands work **without** a license key:

- `mekong --version` / `mekong -v`
- `mekong --help` / `mekong -h`
- `mekong init`
- `mekong list`
- `mekong search <query>`
- `mekong status`
- `mekong config`
- `mekong doctor`
- `mekong dash`
- `mekong license <subcommand>`

---

## Premium Commands

These commands **require** a valid license key:

- `mekong cook "<goal>"` - Plan → Execute → Verify
- `mekong plan "<goal>"` (complex plans)
- `mekong gateway` - Start HTTP server
- `mekong binh-phap` - Strategy commands
- `mekong swarm` - Multi-agent orchestration
- `mekong schedule` - Task scheduling
- `mekong telegram` - Telegram bot
- `mekong agi` - AGI auto-pilot

---

## Validation Flow

### At Startup

When you run a premium command:

1. CLI checks if command is in FREE_COMMANDS list
2. If premium, spawns Node.js validator subprocess
3. Validator loads `LicenseService` singleton
4. Returns JSON: `{valid, tier, features, error}`
5. Python wrapper parses response
6. If invalid → exits with error message

### Error Messages

**Missing License:**
```
License Error: ╔══════════════════════════════════════════════════╗
║  🔒 RaaS License Required                        ║
╠══════════════════════════════════════════════════╣
║  Command 'cook' requires RaaS License Key.       ║
║  Get your license: https://raas.mekong.dev/license
╚══════════════════════════════════════════════════╝
```

**Invalid Format:**
```
License Error: Invalid license key format. Expected raas-[tier]-[hash]
```

**Expired:**
```
License Error: License expired. Please renew at https://raas.mekong.dev/pricing
```

---

## Key Formats

Valid license key formats:

```
# Pro tier
raas_pro_20260306_abc123def456789
raas_pro_<timestamp>_<random>_<hmac>
RPP-<hash>  (legacy pro prefix)

# Enterprise tier
raas_ent_20260306_xyz789abc123456
raas_enterprise_<timestamp>_<random>_<hmac>
REP-<hash>  (legacy enterprise prefix)

# Skunkworks (pro tier)
sk-raas-<hash>
rk-raas-<hash>
```

---

## Testing

Run unit tests:

```bash
python3 -m pytest tests/test_raas_gate_validator.py -v
```

Test scenarios covered:
- No license (free tier access)
- Valid pro license
- Valid enterprise license
- Invalid license format
- Expired license
- Singleton pattern
- Error handling

---

## Troubleshooting

### "License validation timeout"

**Cause:** Node.js subprocess taking too long to start.

**Fix:**
1. Ensure `npx` is installed: `npm install -g npm`
2. Install tsx globally: `npm install -g tsx`
3. Retry command

### "npx: command not found"

**Cause:** Node.js/npm not installed.

**Fix:**
```bash
# Install Node.js (macOS)
brew install node

# Or use nvm
nvm install 20
nvm use 20
```

### "Too many validation attempts"

**Cause:** Rate limiting triggered (5 attempts/minute).

**Fix:** Wait 5 minutes and try again.

---

## Security Notes

- License keys use HMAC-SHA256 signatures
- Validation is timing-safe (prevent timing attacks)
- Rate limiting prevents brute force
- Audit logging for compliance

---

## API Reference

### Python

```python
from src.lib.raas_gate_validator import (
    RaasGateValidator,
    validate_at_startup,
    require_valid_license,
)

# Validate license
validator = RaasGateValidator()
is_valid, error = validator.validate()

# Require valid license (exits on failure)
require_valid_license()

# Get tier and features
tier = validator.get_tier()  # "free", "pro", "enterprise"
features = validator.get_features()  # list of enabled features
```

### TypeScript

```typescript
import { LicenseService } from './src/lib/raas-gate';

const service = LicenseService.getInstance();
const result = service.validateSync(licenseKey);

console.log(result.valid);   // boolean
console.log(result.tier);    // "free" | "pro" | "enterprise"
console.log(result.features); // string[]
```

---

## Migration Guide

### From Phase 1 (Local Validation)

If you were using the old local validation:

1. Update to latest version
2. Keys starting with `raas-` still work
3. New format: `raas_[tier]_[timestamp]_[random]_[hmac]`
4. Legacy prefixes `RPP-` and `REP-` still supported

### From Phase 2 (Remote Validation)

Phase 2 adds:
- Remote API validation (fallback to local)
- Usage metering
- Key generation

To enable remote validation:
```bash
export RAAS_API_URL=https://api.raas.mekong.dev
```

---

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/raas-gate.ts` | TypeScript validation logic |
| `src/lib/raas_gate_validator.py` | Python wrapper |
| `scripts/validate-license.ts` | Node.js CLI validator |
| `src/main.py` | Startup validation integration |
| `tests/test_raas_gate_validator.py` | Unit tests |

---

## Support

- Documentation: [raas.mekong.dev/docs](https://raas.mekong.dev/docs)
- Pricing: [raas.mekong.dev/pricing](https://raas.mekong.dev/pricing)
- Issues: [GitHub Issues](https://github.com/mekong-cli/mekong-cli/issues)
