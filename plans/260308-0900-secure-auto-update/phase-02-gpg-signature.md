# Phase 02: GPG Signature Verification

**Target:** 2026-03-09
**Blocks:** Phase 01 (SHA256) - can be iterative
**Dependencies:** cryptography library (already in pyproject.toml)

---

## Goal

Add GPG signature verification using the `cryptography` library instead of `python-gnupg`.

---

##Why cryptography (NOT python-gnupg)

| Issue | python-gnupg | cryptography |
|-------|--------------|--------------|
| Subprocess | Many subprocess calls | Pure Python |
| Security | Command injection risks | Proven secure |
| Maintenance | Unmaintained since 2021 | Actively maintained |
| Platform | Complex setup on all OS | Works everywhere |

---

## Implementation Steps

### Step 1: Create release keys module

**File:** `src/lib/release_keys.py` (NEW)

```python
"""Embedded public keys for signature verification.

This module contains public keys used to verify release asset signatures.
Keys are embedded at build time - no external dependencies required.
"""

# Production public key for mekong-cli releases
# Format: PEM-encoded RSA public key
RELEASE_PUBLIC_KEY = b"""-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"""

# Alternate keys for key rotation practice
# Add additional keys if needed for multi-signer setup
ALT_PUBLIC_KEY = b"""-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"""


def get_public_key() -> bytes:
    """Get the current public key for verification."""
    return RELEASE_PUBLIC_KEY


def load_public_key_from_path(key_path: str) -> bytes:
    """Load public key from file path.

    Args:
        key_path: Path to PEM file containing public key

    Returns:
        Bytes of PEM content
    """
    from pathlib import Path
    return Path(key_path).expanduser().read_bytes()
```

### Step 2: Add signature verification to auto_updater

**File:** `src/core/auto_updater.py` (add new methods)

```python
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.exceptions import InvalidSignature
from pathlib import Path
from typing import Optional


class SecurityError(Exception):
    """Security-related errors during update."""
    pass


class AutoUpdater:
    # ... existing methods ...

    def _load_public_key(self) -> rsa.RSAPublicKey:
        """Load embedded public key for signature verification.

        Returns:
            Loaded RSA public key

        Raises:
            SecurityError: If key cannot be loaded
        """
        try:
            from src.lib.release_keys import get_public_key
            public_key_pem = get_public_key()
            return serialization.load_pem_public_key(public_key_pem)
        except Exception as e:
            raise SecurityError(f"Failed to load public key: {e}")

    def verify_signature(
        self,
        asset_content: bytes,
        signature_b64: str,
        public_key: Optional[rsa.RSAPublicKey] = None,
    ) -> bool:
        """Verify RSA signature of asset content.

        Args:
            asset_content: Raw bytes of downloaded asset
            signature_b64: Base64-encoded signature from release
            public_key: Optional public key (uses embedded if not provided)

        Returns:
            True if signature is valid

        Raises:
            SecurityError: If signature verification fails
        """
        if public_key is None:
            public_key = self._load_public_key()

        try:
            # Decode base64 signature
            signature_bytes = __import__('base64').b64decode(signature_b64.strip())

            # Verify using SHA256 with PKCS1v15 padding
            public_key.verify(
                signature_bytes,
                asset_content,
                padding.PKCS1v15(),
                hashes.SHA256(),
            )
            return True
        except InvalidSignature:
            raise SecurityError("Signature verification failed - asset may be tampered")
        except Exception as e:
            raise SecurityError(f"Signature verification error: {e}")

    def download_and_verify(
        self,
        update_info: UpdateInfo,
        verify_signature: bool = True,
    ) -> Path:
        """Download asset with full security verification.

        1. Download file to temp directory
        2. Verify SHA256 checksum (if provided)
        3. Verify GPG signature (if provided)

        Args:
            update_info: UpdateInfo from check_for_updates
            verify_signature: If True, verify GPG signature

        Returns:
            Path to verified downloaded file

        Raises:
            SecurityError: If any verification fails
        """
        # Download first (without checksum check yet)
        response = requests.get(update_info.download_url, stream=True, timeout=30)
        response.raise_for_status()

        tmp_dir = Path(tempfile.mkdtemp(prefix="mekong-update-"))
        filename = update_info.download_url.split("/")[-1] or f"mekong-{update_info.version}.tar.gz"
        dest = tmp_dir / filename

        # Collect content for signature verification
        content_chunks = []
        with dest.open("wb") as fh:
            for chunk in response.iter_content(chunk_size=8192):
                fh.write(chunk)
                content_chunks.append(chunk)

        asset_content = b"".join(content_chunks)

        # Verify checksum if provided
        if update_info.checksum:
            if not verify_file_checksum(dest, update_info.checksum):
                dest.unlink()
                raise SecurityError(
                    f"Checksum verification failed for {filename}\n"
                    f"Expected: {update_info.checksum}"
                )

        # Verify signature if provided
        if verify_signature and update_info.signature:
            self.verify_signature(asset_content, update_info.signature)

        return dest
```

### Step 3: Update Apply for Error Logging

**File:** `src/core/auto_updater.py`

```python
def apply_with_logging(self, update_path: Path) -> bool:
    """Apply update with detailed logging for debugging.

    Args:
        update_path: Path to downloaded package

    Returns:
        True on success, False on failure
    """
    import logging
    logger = logging.getLogger(__name__)

    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", str(update_path), "--quiet"],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            logger.error(f"Pip install failed with code {result.returncode}")
            logger.error(f"stdout: {result.stdout}")
            logger.error(f"stderr: {result.stderr}")
            return False

        logger.info(f"Successfully installed {update_path}")
        return True

    except Exception as e:
        logger.error(f"Update application failed with exception: {e}")
        return False
```

### Step 4: Extract signature from release body

**File:** `src/core/auto_updater.py` (modify key extraction)

**Current (line 96):**

```python
checksum = body.split("sha256:")[-1].split()[0] if "sha256:" in body else ""
```

**New:**

```python
# Extract checksum
checksum = ""
if "sha256:" in body:
    checksum = body.split("sha256:")[-1].split()[0]

# Extract GPG signature
signature = ""
if "gpg-signature:" in body:
    signature = body.split("gpg-signature:")[-1].split()[0]
elif "-----BEGIN PGP SIGNATURE-----" in body:
    # Full signature block in body
    sig_start = body.find("-----BEGIN PGP SIGNATURE-----")
    sig_end = body.find("-----END PGP SIGNATURE-----", sig_start)
    if sig_start > 0 and sig_end > sig_start:
        signature = body[sig_start:sig_end + 27]  # Include headers
```

---

## Test Plan

### Test 1: Valid signature passes

```python
def test_verify_signature_valid():
    """Test verification of valid signature."""
    from src.core.auto_updater import AutoUpdater
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.backends import default_backend

    # Generate key pair for testing
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    public_key = private_key.public_key()

    # Sign test content
    content = b"test release asset content"
    signature = private_key.sign(content, padding.PKCS1v15(), hashes.SHA256())

    updater = AutoUpdater("1.0.0", "https://api.github.com/repos/test/test")
    updater._public_key = public_key  # Override for test

    assert updater.verify_signature(content, signature)
```

### Test 2: Invalid signature fails

```python
def test_verify_signature_invalid():
    """Test that tampered content fails verification."""
    from src.core.auto_updater import AutoUpdater, SecurityError

    updater = AutoUpdater("1.0.0", "https://api.github.com/repos/test/test")

    content = b"legitimate content"
    wrong_signature = b"0" * 128  # Invalid signature

    with pytest.raises(SecurityError) as exc_info:
        updater.verify_signature(content, wrong_signature)

    assert "Signature verification failed" in str(exc_info.value)
```

### Test 3: Full download_and_verify flow

```python
def test_download_and_verify_full():
    """Test complete download and verify flow."""
    from src.core.auto_updater import AutoUpdater, UpdateInfo, UpdateChannel
    from unittest.mock import patch, MagicMock
    import base64
    import tempfile
    from pathlib import Path

    # Setup mocks
    updater = AutoUpdater("1.0.0", "https://api.github.com/repos/test/test")
    update_info = UpdateInfo(
        version="2.0.0",
        channel=UpdateChannel.STABLE,
        download_url="https://example.com/mekong-2.0.0.tar.gz",
        release_notes="Test",
        published_at="2026-03-09T00:00:00Z",
        checksum="",  # Skip checksum for this test
        signature="",  # Skip signature for this test
    )

    # Mock requests.get
    with patch('requests.get') as mock_get:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.iter_content = lambda chunk_size: [b"test asset content"]
        mock_get.return_value = mock_response

        # Should return path without error
        path = updater.download_and_verify(update_info, verify_signature=False)
        assert path.exists()
        assert path.name.endswith(".tar.gz")
```

---

## CI/CD Signing Integration

### GitHub Actions Workflow Addition

**File:** `.github/workflows/release.yml` (add after build step)

```yaml
- name: Sign Release Asset
  env:
    GPG_PRIVATE_KEY: ${{ secrets.GPG_PRIVATE_KEY }}
  run: |
    # Decode and import private key
    echo "$GPG_PRIVATE_KEY" | base64 -d > /tmp/private.key
    gpg --batch --import /tmp/private.key

    # Create signature
    gpg --batch --yes --passphrase "" --armor --detach-sign dist/mekong-cli-${{ version }}.tar.gz

    # Add signature to release
    echo "gpg-signature: $(base64 -w0 dist/mekong-cli-${{ version }}.tar.gz.asc)" >> $GITHUB_ENV
```

### Release Body Format

When creating release via GitHub API, include:

```
## Changelog
- Fixed bug in parser
- Added new command

## Checksum
sha256: abc123def456...

## GPG Signature
-----BEGIN PGP SIGNATURE-----
...
-----END PGP SIGNATURE-----
```

Or simpler format:

```
Release: mekong-cli v2.0.0
sha256: abc123def456...
gpg-signature: base64_encoded_signature_here
```

---

## Rollback

If issues occur:
```bash
# Revert auto_updater.py
git checkout HEAD -- src/core/auto_updater.py

# Revert release_keys.py (if exists)
rm src/lib/release_keys.py
```

---

## Verification

```bash
# Test signature verification
python3 -m pytest tests/test_auto_updater_signature.py -v

# Check cryptography imports
python3 -c "from cryptography.hazmat.primitives.asymmetric import rsa; print('OK')"

# Type check
mypy src/core/auto_updater.py src/lib/release_keys.py
```

---

## Security Checklist

- [ ] Uses `cryptography` library (pure Python, no subprocess)
- [ ] Public key embedded in source (no external fetch)
- [ ] Signature verified BEFORE installation
- [ ] Clear error messages on verification failure
- [ ] No sensitive data in logs
- [ ] Key rotation path documented

---

*Phase 02 created: 2026-03-09*
*Ready for: code-reviewer agent*
