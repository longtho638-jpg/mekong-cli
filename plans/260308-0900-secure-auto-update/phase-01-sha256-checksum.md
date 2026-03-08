# Phase 01: SHA256 Checksum Implementation

**Target:** 2026-03-08
**Blocks:** None (can implement independently)

---

## Goal

Add SHA256 checksum verification to `AutoUpdater.download()` before pip installation.

---

## Implementation Steps

### Step 1: Update `UpdateInfo` dataclass

**File:** `src/core/auto_updater.py`

```python
@dataclass
class UpdateInfo:
    version: str
    channel: UpdateChannel
    download_url: str
    release_notes: str
    published_at: str
    checksum: str  # Already exists - verify it's used correctly
    # Add new field
    signature: Optional[str] = None  # For Phase 2
```

### Step 2: Add checksum extraction utility

**File:** `src/core/auto_updater.py` (add after imports)

```python
def extract_checksum_from_release_body(body: str) -> str:
    """Extract SHA256 checksum from GitHub release body.

    Expected format in release body:
    ```
    sha256: abc123def456...
    ```
    """
    if "sha256:" in body:
        checksum = body.split("sha256:")[-1].split()[0]
        # Validate it looks like SHA256 (64 hex chars)
        if len(checksum) == 64 and all(c in '0123456789abcdef' for c in checksum.lower()):
            return checksum
    return ""
```

### Step 3: Add checksum verification function

**File:** `src/core/auto_updater.py` (add after imports)

```python
import hashlib

def verify_file_checksum(file_path: Path, expected: str) -> bool:
    """Verify file SHA256 checksum matches expected value."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256_hash.update(chunk)
    return sha256_hash.hexdigest() == expected
```

### Step 4: Modify `AutoUpdater.download()` method

**Current code (lines 111-121):**

```python
def download(self, update_info: UpdateInfo) -> Path:
    """Download release asset to a temp dir. Returns path to downloaded file."""
    response = requests.get(update_info.download_url, stream=True, timeout=30)
    response.raise_for_status()
    tmp_dir = Path(tempfile.mkdtemp(prefix="mekong-update-"))
    filename = update_info.download_url.split("/")[-1] or f"mekong-{update_info.version}.tar.gz"
    dest = tmp_dir / filename
    with dest.open("wb") as fh:
        for chunk in response.iter_content(chunk_size=8192):
            fh.write(chunk)
    return dest
```

**New implementation:**

```python
def download(self, update_info: UpdateInfo, verify_checksum: bool = True) -> Path:
    """Download release asset to a temp dir with optional checksum verification.

    Args:
        update_info: UpdateInfo from check_for_updates
        verify_checksum: If True, verify checksum before returning

    Returns:
        Path to downloaded file

    Raises:
        SecurityError: If checksum verification fails
    """
    response = requests.get(update_info.download_url, stream=True, timeout=30)
    response.raise_for_status()

    tmp_dir = Path(tempfile.mkdtemp(prefix="mekong-update-"))
    filename = update_info.download_url.split("/")[-1] or f"mekong-{update_info.version}.tar.gz"
    dest = tmp_dir / filename

    # Download to temp file first
    with dest.open("wb") as fh:
        for chunk in response.iter_content(chunk_size=8192):
            fh.write(chunk)

    # Verify checksum if provided and enabled
    if verify_checksum and update_info.checksum:
        if not verify_file_checksum(dest, update_info.checksum):
            dest.unlink()  # Clean up corrupted file
            raise SecurityError(
                f"Checksum verification failed for {filename}\n"
                f"Expected: {update_info.checksum}\n"
                f"Downloaded file may be corrupted or tampered with."
            )

    return dest
```

### Step 5: Update `apply()` method to use new download logic

**Current (lines 123-129):**

```python
def apply(self, update_path: Path) -> bool:
    """Install downloaded package via pip. Returns True on success."""
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", str(update_path), "--quiet"],
        capture_output=True,
    )
    return result.returncode == 0
```

**No change needed** - `apply()` already receives verified Path.

### Step 6: Handle `apply()` errors (rollback)

**File:** `src/core/auto_updater.py`

```python
def apply(self, update_path: Path) -> bool:
    """Install downloaded package via pip. Returns True on success."""
    import subprocess

    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", str(update_path), "--quiet"],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        # Log error for debugging
        logger.error(f"Pip install failed: {result.stderr}")
        return False

    return True

def apply_with_fallback(self, update_path: Path) -> bool:
    """Apply update with error logging."""
    try:
        return self.apply(update_path)
    except Exception as e:
        logger.error(f"Update application failed: {e}")
        return False
```

---

## Test Plan

### Test 1: Valid checksum passes

```python
def test_download_valid_checksum():
    updater = AutoUpdater("1.0.0", "https://api.github.com/repos/test/test")
    update_info = UpdateInfo(
        version="2.0.0",
        channel=UpdateChannel.STABLE,
        download_url="https://example.com/mekong-2.0.0.tar.gz",
        release_notes="Test release",
        published_at="2026-03-08T00:00:00Z",
        checksum="a" * 64,  # Mock valid checksum
    )

    # Mock requests.get to return file with matching checksum
    path = updater.download(update_info)
    assert path.exists()
```

### Test 2: Invalid checksum fails

```python
def test_download_invalid_checksum():
    updater = AutoUpdater("1.0.0", "https://api.github.com/repos/test/test")
    update_info = UpdateInfo(
        version="2.0.0",
        channel=UpdateChannel.STABLE,
        download_url="https://example.com/mekong-2.0.0.tar.gz",
        release_notes="Test release",
        published_at="2026-03-08T00:00:00Z",
        checksum="b" * 64,  # Different from actual
    )

    # Mock requests.get to return test file
    with pytest.raises(SecurityError) as exc_info:
        updater.download(update_info)

    assert "Checksum verification failed" in str(exc_info.value)
```

### Test 3: No checksum (optional) succeeds

```python
def test_download_no_checksum_skipped():
    updater = AutoUpdater("1.0.0", "https://api.github.com/repos/test/test")
    update_info = UpdateInfo(
        version="2.0.0",
        channel=UpdateChannel.STABLE,
        download_url="https://example.com/mekong-2.0.0.tar.gz",
        release_notes="Test release",
        published_at="2026-03-08T00:00:00Z",
        checksum="",  # No checksum provided
    )

    # Should succeed (checksum verification skipped)
    path = updater.download(update_info, verify_checksum=True)
    assert path.exists()
```

---

## Rollback

If this implementation has issues:
- `git checkout HEAD -- src/core/auto_updater.py`
- Rollback is trivial (single file modification)

---

## Verification

```bash
# Run tests
python3 -m pytest tests/test_auto_updater_checksum.py -v

# Verify no syntax errors
python3 -m py_compile src/core/auto_updater.py

# Type check
mypy src/core/auto_updater.py
```

---

*Phase 01 created: 2026-03-08*
*Ready for: tester agent validation*
