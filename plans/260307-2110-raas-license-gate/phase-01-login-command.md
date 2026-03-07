---
title: "Phase 1: Login Command + Secure Storage"
description: "Implement mekong login command with interactive prompts and platform-native secure storage"
status: pending
priority: P1
effort: 2h
---

# Phase 1: Login Command + Secure Storage

## Context Links

- Related: `src/commands/license_commands.py` — existing license commands
- Related: `src/lib/raas-gate.ts` — TypeScript license validator
- Related: `src/raas/license_models.py` — Pydantic license models

## Overview

**Priority:** P1 (Critical Path)
**Status:** pending
**Description:** Implement `mekong login` command with interactive prompts and platform-native secure storage.

## Key Insights

- Current license system uses env var `RAAS_LICENSE_KEY` only
- No interactive login flow exists
- No secure storage — keys stored in plain text .env files
- Need cross-platform support: macOS Keychain, Windows Credential Vault, Linux encrypted file

## Requirements

### Functional

1. `mekong login` command with interactive prompts
2. Email input for license association
3. License key input (paste or manual entry)
4. Store validated key in platform-native secure storage
5. `mekong logout` command to clear stored credentials
6. `mekong auth status` to show current auth state

### Non-Functional

- Zero dependencies on external keyring libraries (use native CLI tools)
- Sub-100ms credential lookup
- Encrypted storage on Linux (AES-256)
- Clear error messages for each platform

## Architecture

```
mekong login Flow:
┌─────────────┐    ┌──────────────┐    ┌───────────────┐    ┌────────────────┐
│   User      │───▶│ Interactive  │───▶│  Gateway      │───▶│  Secure        │
│   Input     │    │  Prompt      │    │  Validate     │    │  Storage       │
└─────────────┘    └──────────────┘    └───────────────┘    └────────────────┘
     │                   │                    │                     │
     │  1. Run command   │                    │                     │
     ├──────────────────▶│                    │                     │
     │                   │  2. Email + Key    │                     │
     │                   ├───────────────────▶│                     │
     │                   │                    │  3. POST /verify    │
     │                   │                    ├────────────────────▶│
     │                   │                    │                     │ 4. Store
     │                   │                    │                     ├───────▶ Keychain/Vault/File
     │                   │  5. Success        │                     │
     │◀──────────────────┤                    │                     │
```

## Related Code Files

### Files to Create

- `src/commands/auth_commands.py` — login/logout/status commands
- `src/auth/secure_storage.py` — Cross-platform secure storage abstraction
- `src/auth/storage_backends/` — Platform-specific implementations
  - `macos_keychain.py`
  - `windows_vault.py`
  - `linux_encrypted.py`
- `src/auth/login_client.py` — Gateway API client for login flow

### Files to Modify

- `src/main.py` — Register auth commands
- `src/lib/raas_gate_validator.py` — Add secure storage lookup

## Implementation Steps

### Step 1: Secure Storage Backend (1h)

1. Create `src/auth/secure_storage.py` with abstract base class
2. Implement `MacOSKeychainBackend`:
   ```bash
   security add-generic-password -s mekong-cli -a $USER -w "$LICENSE_KEY"
   security find-generic-password -s mekong-cli -a $USER -w
   ```
3. Implement `WindowsVaultBackend` via PowerShell:
   ```powershell
   cmdkey /generic:mekong-cli /user:$USER /pass:$LICENSE_KEY
   ```
4. Implement `LinuxEncryptedBackend`:
   - Generate encryption key from machine ID + salt
   - AES-256-GCM encrypt license key
   - Store in `~/.mekong/credentials.enc`

### Step 2: Login Command (45min)

1. Create `src/commands/auth_commands.py` with Typer app
2. Implement `login()` command:
   - Prompt for email (validation required)
   - Prompt for license key (hidden input optional)
   - Call gateway `/v1/auth/verify`
   - Store on success
3. Implement `logout()` command:
   - Remove credentials from secure storage
   - Clear cache
4. Implement `status()` command:
   - Show logged-in state
   - Display license tier + expiry

### Step 3: Integration (15min)

1. Register commands in `src/main.py`
2. Update `RaasGateValidator` to check secure storage first
3. Fallback to env var `RAAS_LICENSE_KEY` if storage empty

## Success Criteria

- [ ] `mekong login` prompts for email + key interactively
- [ ] Credentials stored securely (platform-native)
- [ ] `mekong logout` removes credentials
- [ ] `mekong auth status` shows current license state
- [ ] Existing license validation uses secure storage transparently
- [ ] No console.log statements in production code
- [ ] Type hints on all functions
- [ ] Docstrings on public methods

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Keychain CLI unavailable | Medium | Fallback to encrypted file |
| Windows PowerShell restricted | Medium | Use certutil alternative |
| Linux encryption key lost | Low | Re-login required (documented) |

## Security Considerations

- License keys never logged or printed after storage
- Encryption key for Linux derived from hardware ID (non-exportable)
- Gateway validation happens before storage (no invalid keys stored)

## Next Steps

→ Phase 2: Implement gateway `/v1/auth/verify` endpoint

## Todo List

- [ ] Create secure storage abstraction layer
- [ ] Implement macOS Keychain backend
- [ ] Implement Windows Credential Vault backend
- [ ] Implement Linux encrypted file backend
- [ ] Create login command with interactive prompts
- [ ] Create logout command
- [ ] Create auth status command
- [ ] Register commands in main.py
- [ ] Update RaasGateValidator to use secure storage
- [ ] Remove all console.log statements
- [ ] Add type hints and docstrings
