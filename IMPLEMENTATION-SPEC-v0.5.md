# MEKONG-CLI v0.5.0 IMPLEMENTATION SPEC
# ROIaaS DNA Phase 2: LICENSE UI (Quản Trị)
# HIEN-PHAP-ROIAAS Điều 6, Phase 2
# QUAN TRONG: Giữ nguyên v0.1-v0.4. Chỉ THÊM + EXTEND.

---

## 0. PREREQUISITE

v0.4.0 must pass:
```bash
pnpm build && pnpm test        # 490+ tests, 0 failures
mekong license status           # shows tier info
```

---

## 1. SCOPE

Admin/Owner dashboard (CLI-based) to create, revoke, list, and monitor license keys.
This is the management plane — v0.4 was the enforcement plane.

---

## 2. DIRECTORY STRUCTURE

```
src/
  license/
  |   ├── admin.ts              # LicenseAdmin: create/revoke/list/rotate keys
  |   ├── key-generator.ts      # Generate RAAS-xxx keys with HMAC signatures
  |   ├── audit-log.ts          # Audit trail for license operations
  |   └── tier-manager.ts       # Upgrade/downgrade tier, migration logic

  cli/commands/
  |   └── license-admin.ts      # mekong license-admin (create/revoke/list/rotate/audit)
```

---

## 3. IMPLEMENTATION PHASES (7 phases, max 500 lines each)

### Phase 1: Key Generator
- `src/license/key-generator.ts` — generate RAAS-{tier}-{random} keys, sign with HMAC
- Configurable expiry, owner, tier
- Tests: 8+

### Phase 2: License Admin Core
- `src/license/admin.ts` — LicenseAdmin: createKey(), revokeKey(), listKeys(), rotateKey()
- Stores all keys in ~/.mekong/admin/keys.json (admin-side registry)
- Tests: 10+

### Phase 3: Audit Log
- `src/license/audit-log.ts` — append-only JSONL audit trail
- Records: who, when, action (create/revoke/rotate), key-id
- Tests: 6+

### Phase 4: Tier Manager
- `src/license/tier-manager.ts` — upgrade/downgrade logic, prorated expiry calc
- Migration between tiers preserves remaining days proportionally
- Tests: 8+

### Phase 5: CLI Admin Commands
- `src/cli/commands/license-admin.ts` — create/revoke/list/rotate/audit subcommands
- Register in cli/index.ts
- Tests: 8+

### Phase 6: Key Validation Enhancements
- Batch validation, expiry notifications, bulk operations
- Tests: 6+

### Phase 7: Integration & Polish
- Wire admin into engine
- Access control: admin commands require enterprise tier or env MEKONG_ADMIN_SECRET
- Integration tests: 6+

---

## 4. SUCCESS CRITERIA

- [ ] `pnpm test` — 540+ tests, 0 failures
- [ ] `mekong license-admin create --tier pro --owner user@example.com` — generates key
- [ ] `mekong license-admin list` — shows all issued keys
- [ ] `mekong license-admin revoke <key-id>` — revokes + audit log entry
- [ ] Audit trail persists all operations
- [ ] No new runtime dependencies
