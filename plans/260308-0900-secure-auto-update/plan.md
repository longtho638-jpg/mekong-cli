# Secure Auto-Update Implementation Plan

**Date:** 2026-03-08
**Status:** Draft for planning
**Prerequisite:** Research report at `plans/reports/researcher-260308-secure-auto-update-patterns.md`

---

## Overview

Implement production-grade secure auto-update for Mekong CLI with:
- SHA256 checksum verification
- GPG signature verification (using cryptography library)
- Sandboxed execution
- Config preservation via backup/restore

---

## Phase 0: Infrastructure Setup

### Tasks

- [ ] Generate RSA key pair for code signing
- [ ] Configure CI/CD to sign release assets
- [ ] Store public key in CLI source for verification
- [ ] Set uprelease pipeline with checksums and signatures

### File: `scripts/release-sign.sh`

```bash
# Script to sign release assets during CI/CD
# Inputs: asset_file, private_key
# Output: asset_file.sha256, asset_file.sig
```

---

## Phase 1: SHA256 Checksum Verification

### Implementation Points

**File: `src/core/auto_updater.py` (MODIFY)**

- Add `download_and_verify()` method
- Extract checksum from release body
- Verify before pip installation
- Clean up on failure

**File: `src/lib/raas_gate.py` (ADD)**

- Add update validation endpoint
- Return checksum + signature for downloaded asset

### Tests

- [ ] `tests/test_auto_updater_checksum.py`
- [ ] Mock GitHub API returning releases with checksums
- [ ]Verify corrupted download rejected

### Success Criteria

- ✅ Downloaded file checksum matches expected
- ✅ Mismatched checksum raises `SecurityError`
- ✅ Temporary files cleaned up on failure

---

## Phase 2: GPG Signature Verification

### Implementation Points

**File: `src/core/auto_updater.py` (MODIFY)**

```python
class AutoUpdater:
    def __init__(self, ...):
        # Load public key from embedded source
        self.public_key = self._load_public_key()

    def _load_public_key(self) -> bytes:
        """Load embedded public key from source."""
        # Public key embedded in package
        pass

    def verify_signature(self, asset_content: bytes, signature: bytes) -> bool:
        """Verify RSA signature using cryptography library."""
        pass
```

**File: `src/lib/release_keys.py` (NEW)**

```python
"""Embedded public keys for signature verification."""
# Public key used to verify release assets
RELEASE_PUBLIC_KEY = b"""-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----"""
```

### Tests

- [ ] `tests/test_auto_updater_signature.py`
- [ ] Verify valid signature accepted
- [ ] Verify tampered asset rejected

### Success Criteria

- ✅ Valid signatures verified successfully
- ✅ Invalid/mismatched signatures rejected
- ✅ No external GPG subprocess calls

---

## Phase 3: Sandboxed Execution

### Implementation Points

**File: `src/cli/update_commands.py` (NEW)**

```python
"""Update-related CLI commands with security."""

@app.command()
def update(
    force: bool = False,
    verify_only: bool = False,
) -> None:
    """
    Check for and install updates with full security verification.

    1. Check GitHub for newer version
    2. Download with checksum verification
    3. Verify signature
    4. Backup current config
    5. Install in sandboxed subprocess
    """
    pass
```

**File: `src/core/auto_updater.py` (MODIFY)**

```python
def apply_with_sandbox(self, update_path: Path) -> bool:
    """Apply update in sandbox with timeout and command restrictions."""
    policy = SandboxPolicy(
        allowed_capabilities={SandboxCapability.SHELL_EXEC, SandboxCapability.FILE_READ},
        max_execution_time=120,
        max_memory_mb=1024,
        allowed_paths=["/tmp/mekong-update-*"],
        denied_commands=["rm -rf*", "sudo*", "chmod*"],
    )
    sandbox = Sandbox(policy)

    # Install via pip within sandbox
    return sandbox.enforce(self._install_pip, update_path)
```

### Tests

- [ ] `tests/test_sandbox_update.py`
- [ ] Verify timeout enforcement
- [ ] Verify denied commands blocked

### Success Criteria

- ✅ pip install runs with timeout (120s max)
- ✅ Denied commands cannot execute
- ✅ Execution within memory limits

---

## Phase 4: Config Preservation

### Implementation Points

**File: `src/lib/config_backup.py` (NEW)**

```python
class ConfigBackup:
    CONFIG_DIR = Path.home() / ".mekong"

    def backup(self) -> Path:
        """Create timestamped backup of config."""
        pass

    def restore(self, backup_path: Path) -> bool:
        """Restore config from backup."""
        pass

    def cleanup_old(self, keep: int = 3) -> None:
        """Remove old backups, keeping most recent N."""
        pass
```

**File: `src/core/auto_updater.py` (MODIFY)**

```python
def apply_with_backup(self, update_path: Path) -> bool:
    """Apply update with backup/rollback."""
    backup = ConfigBackup()
    backup_path = backup.backup()

    try:
        result = self.apply_with_sandbox(update_path)
        if result:
            backup.cleanup_old()
            return True
    except Exception:
        backup.restore(backup_path)
        raise

    return False
```

### Tests

- [ ] `tests/test_config_backup.py`
- [ ] Backup creation verified
- [ ] Restore from backup verified
- [ ] Cleanup removes old backups

### Success Criteria

- ✅ Backup created before update
- ✅ Config restored on failure
- ✅ Old backups pruned (keep last 3)

---

## Phase 5: RaaS Gateway Integration

### Implementation Points

**File: `apps/raas-gateway/src/update-handler.js` (NEW)**

```javascript
export async function handleUpdateCheck(request, env) {
    // Verify license
    // Check for newer version
    // Return version info + checksum + signature
}

export async function handleUpdateDownload(request, env) {
    // Verify license + auth token
    // Return pre-signed URL for asset
}
```

**Routes (add to `apps/raas-gateway/index.js`)**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/update/check` | Check for updates |
| GET | `/v1/update/info` | Get release metadata |
| POST | `/v1/update/download` | Get signed download URL |

### Tests

- [ ] Integration test for gateway endpoints
- [ ] License validation verified

### Success Criteria

- ✅ All endpoints require valid license
- ✅ Download URLs include auth token
- ✅ Rate limiting applied per tenant

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `src/lib/release_keys.py` | Embedded public key for signatures |
| `src/lib/config_backup.py` | Config backup/restore utility |
| `src/cli/update_commands.py` | CLI update commands |
| `tests/test_auto_updater_signature.py` | Signature verification tests |
| `tests/test_auto_updater_checksum.py` | Checksum verification tests |
| `tests/test_config_backup.py` | Backup/restore tests |
| `tests/test_sandbox_update.py` | Sandbox execution tests |
| `scripts/release-sign.sh` | CI/CD release signing script |
| `apps/raas-gateway/src/update-handler.js` | Gateway update endpoints |

### Modified Files

| File | Changes |
|------|---------|
| `src/core/auto_updater.py` | Add checksum + signature verification, sandbox, backup |
| `apps/raas-gateway/index.js` | Add update routes |
| `pyproject.toml` | Add optional dependencies if needed |

### Deleted Files

- None (all new functionality, no removal)

---

## Security Checkpoints

| Checkpoint | Verification |
|------------|--------------|
| TLS only | All downloads use HTTPS |
| Checksum before install | SHA256 checked before pip install |
| Signature before checksum | GPG verified before pip install |
| Sandbox before execute | Subprocess within policy |
| Backup before update | Config backed up before pip |
| Rollback on fail | Restore on any failure |

---

## Rollout Strategy

1. **Phase 1 (Week 1):** SHA256 checksum verification (highest priority)
2. **Phase 2 (Week 2):** GPG signature verification
3. **Phase 3 (Week 3):** Sandboxed execution
4. **Phase 4 (Week 4):** Config preservation
5. **Phase 5 (Week 5):** RaaS integration + end-to-end testing

---

## Unresolved Questions

1. **Public key rotation:** How to handle when signing key needs replacement?
   - Option A: Include N public keys in binary (backward compatible)
   - Option B: Fetch from `/v1/config` endpoint on first run

2. **Update frequency:** How often to check?
   - Recommended: Daily for security updates, weekly for features
   - Current: 1-hour cache (too aggressive)

3. **User control:** Should users be able to opt-out?
   - Recommended: Config flag `update.auto.enabled = true`

---

*Plan created: 2026-03-08*
*Next: Review by code-reviewer agent, then implementation*
