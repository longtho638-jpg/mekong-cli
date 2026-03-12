# MEKONG-CLI v0.4.0 IMPLEMENTATION SPEC
# ROIaaS DNA Phase 1: LICENSE GATE (Rào Chắn)
# HIEN-PHAP-ROIAAS Điều 6, Phase 1
# QUAN TRONG: Giữ nguyên v0.1-v0.3. Chỉ THÊM + EXTEND.

---

## 0. PREREQUISITE

v0.3.0 must pass:
```bash
pnpm build && pnpm test        # 437+ tests, 0 failures
mekong kaizen report            # Kaizen analytics works
mekong marketplace search       # marketplace responds
```

---

## 1. NEW DEPENDENCIES

```bash
# No new runtime deps — uses native crypto + fs
pnpm add -D @types/node   # verify only
```

Bump version: `{ "version": "0.4.0" }`

---

## 2. DIRECTORY STRUCTURE

```
src/
  license/
  |   ├── types.ts              # LicenseKey, LicenseTier, LicenseStatus, UsageQuota, TIER_QUOTAS
  |   ├── gate.ts               # LicenseGate: validate key, check tier, enforce access
  |   ├── store.ts              # LicenseStore: persist/load ~/.mekong/license.json
  |   ├── verifier.ts           # HMAC-SHA256 signature validation, expiry, grace period
  |   ├── feature-map.ts        # Map features → required tier
  |   ├── middleware.ts          # CLI preAction hook for license gating
  |   └── remote.ts             # RemoteLicenseClient: remote API + cache fallback

  cli/commands/
  |   └── license.ts            # mekong license (status/activate/deactivate/info)
```

---

## 3. TYPES — src/license/types.ts

```typescript
export type LicenseTier = 'free' | 'starter' | 'pro' | 'enterprise';
export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'grace';

export interface LicenseKey {
  key: string;
  tier: LicenseTier;
  status: LicenseStatus;
  issuedAt: string;
  expiresAt: string;
  owner: string;
  signature: string;           // HMAC-SHA256
}

export interface UsageQuota {
  tier: LicenseTier;
  llmCallsPerDay: number;
  toolRunsPerDay: number;
  sopRunsPerDay: number;
  storageBytes: number;
}

export interface LicenseValidation {
  valid: boolean;
  tier: LicenseTier;
  remainingDays: number;
  quotas: UsageQuota;
  message?: string;
}

export const TIER_QUOTAS: Record<LicenseTier, UsageQuota> = { /* free/starter/pro/enterprise */ };
```

---

## 4. IMPLEMENTATION PHASES (7 phases, max 500 lines each)

### Phase 1: License Types & Store
- `src/license/types.ts` — types + TIER_QUOTAS const
- `src/license/store.ts` — LicenseStore: load/save/clear from ~/.mekong/license.json
- File permissions 0o600, creates dir if missing, ok(null) when no file
- Tests: 10+

### Phase 2: License Verifier
- `src/license/verifier.ts` — HMAC-SHA256 verification, expiry check, 7-day grace period
- Uses native `crypto.createHmac`
- Tests: 8+

### Phase 3: License Gate & Feature Map
- `src/license/gate.ts` — LicenseGate: validate(), canAccess(), getCurrentTier()
- `src/license/feature-map.ts` — FEATURE_MAP array, tierMeetsMinimum(), getRequiredTier()
- Feature tiers: free(run/sop/status), starter(crm/finance/dashboard), pro(kaizen/marketplace/plugin/mcp), enterprise(self-improve)
- Tests: 12+

### Phase 4: License Middleware
- `src/license/middleware.ts` — commander preAction hook
- Blocks premium commands with upgrade message
- --help/--version always pass
- Tests: 6+

### Phase 5: Remote License Client
- `src/license/remote.ts` — validate against API, cache fallback for offline
- Native fetch(), exponential backoff on 429
- Tests: 6+

### Phase 6: CLI Command + Registration
- `src/cli/commands/license.ts` — status/activate/deactivate/info subcommands
- Update `src/cli/index.ts` — register + wire middleware
- Update `src/config/defaults.ts` — license config section
- Tests: 6+

### Phase 7: Engine Integration & Polish
- Wire LicenseGate into MekongEngine.init()
- Background validation on boot (non-blocking)
- Premium commands show upgrade prompt
- Integration tests: 6+
- All 437+ existing tests still pass

---

## 5. SUCCESS CRITERIA

- [ ] `pnpm build` — 0 TS errors
- [ ] `pnpm test` — 490+ tests, 0 failures
- [ ] `mekong license status` — shows "free" when no key
- [ ] `mekong license activate --key RAAS-xxx` — stores + validates
- [ ] Premium command without license → upgrade message (not crash)
- [ ] Engine boots < 500ms with background license check
- [ ] No new runtime dependencies
- [ ] Backward compat with all v0.1-v0.3 commands
