---
title: "Phase 3: License Caching Layer"
description: "5-min TTL license validation cache for faster startup"
priority: P2
status: pending
effort: 1 day
---

# Phase 3: License Caching Layer

## Overview

Implement license validation caching with 5-minute TTL to avoid Node.js subprocess overhead on every CLI invocation.

## Key Insights

Current flow (from `src/lib/raas_gate_validator.py`):
```
CLI Start → _run_validator() → subprocess.run(['npx', 'tsx', ...]) → JSON parse → Validate
                                                                 ↓
                                                              ~200-500ms overhead
```

Target flow with caching:
```
CLI Start → Check Cache → Valid & Not Expired → Skip Validation → Immediate Start
                       ↓
                   Expired or Miss → Validate → Cache Result → Continue
```

## Requirements

### Functional
- Cache valid license for 5 minutes (TTL)
- Cache invalid/empty license for 1 minute (faster retry)
- Manual cache invalidation via `mekong license clear-cache`
- Cache stored in `~/.mekong/license_cache.json`

### Non-Functional
- Cache lookup < 10ms
- Cache write atomic (no corruption)
- Thread-safe for concurrent CLI invocations

## Architecture

```
~/.mekong/
├── config.ini              # Existing config
└── license_cache.json      # New cache file

Cache format:
{
  "validated_at": "2026-03-07T20:30:00Z",
  "expires_at": "2026-03-07T20:35:00Z",
  "result": {
    "valid": true,
    "tier": "pro",
    "features": [...],
    "error": null
  },
  "key_hash": "sha256(first_8_chars_of_key)"
}
```

## Related Code Files

### Modify
- `src/lib/raas_gate_validator.py` - Add caching logic
- `src/main.py` - Add license clear-cache command
- `src/core/config.py` - Add cache path helper

### Create
- `src/lib/license_cache.py` - Cache manager module

### Delete
- None

## Implementation Steps

### Step 1: Create Cache Manager

```python
# src/lib/license_cache.py
"""
License Validation Cache Manager

5-minute TTL for valid licenses, 1-minute for invalid.
Atomic writes with file locking.
"""

import json
import hashlib
import os
import fcntl
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pathlib import Path


class LicenseCacheManager:
    """Manages license validation cache with TTL."""

    def __init__(self):
        self._cache_dir = Path.home() / ".mekong"
        self._cache_file = self._cache_dir / "license_cache.json"
        self._valid_ttl = timedelta(minutes=5)
        self._invalid_ttl = timedelta(minutes=1)

    def _ensure_cache_dir(self) -> None:
        """Create cache directory if not exists."""
        self._cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_key_hash(self, license_key: Optional[str]) -> str:
        """Get SHA-256 hash of license key (for cache invalidation)."""
        if not license_key:
            return "no_key"
        # Hash first 8 chars for cache key matching
        return hashlib.sha256(license_key[:8].encode()).hexdigest()

    def load(self, license_key: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Load cached validation result if not expired.

        Args:
            license_key: Current license key (for hash matching)

        Returns:
            Cached result dict or None if expired/missing
        """
        if not self._cache_file.exists():
            return None

        try:
            with open(self._cache_file, 'r') as f:
                # File locking for concurrent reads
                fcntl.flock(f.fileno(), fcntl.LOCK_SH)
                try:
                    cache_data = json.load(f)
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)

            # Check if cache entry exists for this key
            key_hash = self._get_key_hash(license_key)
            if cache_data.get("key_hash") != key_hash:
                return None  # Different key, cache miss

            # Check expiration
            expires_at = datetime.fromisoformat(cache_data["expires_at"])
            if datetime.now() > expires_at:
                return None  # Expired

            return cache_data["result"]

        except (json.JSONDecodeError, KeyError, IOError):
            return None  # Corrupt cache, treat as miss

    def save(self, result: Dict[str, Any], license_key: Optional[str] = None) -> None:
        """
        Save validation result to cache.

        Args:
            result: Validation result from validator
            license_key: License key used (for hash matching)
        """
        self._ensure_cache_dir()

        # Determine TTL based on validity
        is_valid = result.get("valid", False)
        ttl = self._valid_ttl if is_valid else self._invalid_ttl

        cache_data = {
            "validated_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + ttl).isoformat(),
            "result": result,
            "key_hash": self._get_key_hash(license_key),
            "ttl_seconds": int(ttl.total_seconds()),
        }

        # Atomic write with file locking
        temp_file = self._cache_file.with_suffix('.tmp')
        try:
            with open(temp_file, 'w') as f:
                fcntl.flock(f.fileno(), fcntl.LOCK_EX)
                try:
                    json.dump(cache_data, f, indent=2)
                    f.flush()
                    os.fsync(f.fileno())
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)

            # Atomic rename
            temp_file.rename(self._cache_file)

        except IOError:
            # Failed to write cache - continue without caching
            if temp_file.exists():
                temp_file.unlink()

    def clear(self) -> bool:
        """
        Clear license cache.

        Returns:
            True if cache was cleared, False if didn't exist
        """
        if self._cache_file.exists():
            self._cache_file.unlink()
            return True
        return False

    def status(self) -> Dict[str, Any]:
        """
        Get cache status for debugging.

        Returns:
            Dict with cache status info
        """
        if not self._cache_file.exists():
            return {"exists": False}

        try:
            with open(self._cache_file, 'r') as f:
                cache_data = json.load(f)

            expires_at = datetime.fromisoformat(cache_data["expires_at"])
            now = datetime.now()
            remaining = (expires_at - now).total_seconds()

            return {
                "exists": True,
                "validated_at": cache_data["validated_at"],
                "expires_at": cache_data["expires_at"],
                "ttl_seconds": cache_data.get("ttl_seconds", 300),
                "remaining_seconds": max(0, remaining),
                "is_valid": cache_data["result"].get("valid", False),
                "tier": cache_data["result"].get("tier", "unknown"),
            }
        except Exception as e:
            return {"exists": False, "error": str(e)}


# Singleton instance
_cache_manager: Optional[LicenseCacheManager] = None


def get_cache_manager() -> LicenseCacheManager:
    """Get singleton cache manager instance."""
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = LicenseCacheManager()
    return _cache_manager


__all__ = ["LicenseCacheManager", "get_cache_manager"]
```

### Step 2: Update RaasGateValidator

```python
# src/lib/raas_gate_validator.py - Add caching

from src.lib.license_cache import get_cache_manager


class RaasGateValidator:
    def __init__(self):
        self._script_path = os.path.join(...)
        self._last_result: Optional[Dict[str, Any]] = None
        self._cache_manager = get_cache_manager()

    def validate(self, license_key: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        """
        Validate license with caching.

        Cache hit → return cached result (if not expired)
        Cache miss → run validator → cache result → return
        """
        # Try cache first (only if license key matches env var)
        if not license_key:
            cached = self._cache_manager.load()
            if cached:
                self._last_result = cached
                return cached.get("valid", False), None

        # Cache miss or different key - run validation
        result = self._run_validator(license_key)

        # Cache the result
        self._cache_manager.save(result, license_key)

        # Return result
        if result.get("no_license"):
            return True, None
        if result.get("valid"):
            return True, None
        error = result.get("error", "License validation failed")
        tier = result.get("tier", "free")
        return False, self._format_error_message(error, tier)
```

### Step 3: Add Cache Clear Command

```python
# src/commands/license_commands.py

@app.command("clear-cache")
def clear_cache() -> None:
    """Clear license validation cache."""
    from src.lib.license_cache import get_cache_manager

    manager = get_cache_manager()
    if manager.clear():
        console.print("[green]✓ License cache cleared[/green]")
    else:
        console.print("[yellow]Cache was already empty[/yellow]")

@app.command("cache-status")
def cache_status() -> None:
    """Show license cache status."""
    from src.lib.license_cache import get_cache_manager

    manager = get_cache_manager()
    status = manager.status()

    if status.get("exists"):
        console.print(f"[bold]Cache Status:[/bold]")
        console.print(f"  Valid: {status['is_valid']}")
        console.print(f"  Tier: {status['tier']}")
        console.print(f"  TTL: {status['ttl_seconds']}s")
        console.print(f"  Remaining: {status['remaining_seconds']:.0f}s")
    else:
        console.print("[yellow]Cache is empty[/yellow]")
```

### Step 4: Update Build for Cache Path

```python
# In mekong.spec, ensure cache dir is writable
# (No special handling needed - cache is in user's home dir)
```

## Todo List

- [ ] Create src/lib/license_cache.py
- [ ] Update RaasGateValidator to use cache
- [ ] Add clear-cache command
- [ ] Add cache-status command
- [ ] Test cache hit/miss scenarios
- [ ] Test cache TTL expiration
- [ ] Test concurrent CLI invocations

## Success Criteria

- [ ] Second CLI invocation uses cache (<10ms lookup)
- [ ] Cache expires after 5 minutes (valid) / 1 minute (invalid)
- [ ] `mekong license clear-cache` clears cache
- [ ] `mekong license cache-status` shows cache info
- [ ] No cache corruption on concurrent access

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Cache corruption | Low | Low | Atomic writes, file locking |
| Stale cache (key changed) | Medium | Medium | Key hash invalidation |
| Concurrent access issues | Low | Low | File locking (fcntl) |
| Disk I/O slowdown | Low | Low | Cache in memory (future opt) |

## Security Considerations

- Only hash of license key stored (not full key)
- Cache file permissions: 600 (owner read/write only)
- Cache cleared on license key change

## Next Steps

After Phase 3 complete:
- Move to Phase 4 (Test Verification)
- Startup time should be <0.3s with cache hit

---

*Created: 2026-03-07 | Phase: 3/5 | Effort: 1 day*
