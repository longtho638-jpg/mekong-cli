---
title: "Phase 4: Test Verification"
description: "Update integration tests for binary build verification"
priority: P1
status: pending
effort: 1 day
---

# Phase 4: Test Verification

## Overview

Update and extend integration tests to verify binary build, RaaS compatibility, and performance requirements.

## Key Insights

Current test structure (from tests/):
- `tests/core/` - Core engine tests
- `tests/integration/` - Integration tests
- `tests/e2e/` - End-to-end tests

New tests needed:
- Binary startup time verification
- RaaS license validation integration
- Performance benchmarks

## Requirements

### Functional
- All existing tests pass with binary build
- New integration tests for RaaS gateway
- Performance benchmark tests

### Non-Functional
- Test suite completes in < 5 minutes
- Integration tests can run against local mock or raas.agencyos.network
- CI/CD compatible (GitHub Actions)

## Architecture

```
tests/
├── test_build.py                 # New: Binary build tests
├── test_performance.py           # New: Startup time benchmarks
├── test_raas_integration.py      # New: RaaS gateway tests
├── integration/
│   └── test_license_validation.py # Updated: License tests
└── ...existing tests...
```

## Related Code Files

### Modify
- `tests/conftest.py` - Add binary fixtures
- `tests/integration/test_license_validation.py` - Add cache tests

### Create
- `tests/test_build.py` - Binary build verification
- `tests/test_performance.py` - Startup benchmarks
- `tests/test_raas_integration.py` - RaaS gateway integration

### Delete
- None

## Implementation Steps

### Step 1: Binary Build Tests

```python
# tests/test_build.py
"""
Binary Build Verification Tests

Tests for PyInstaller binary build output.
"""

import os
import subprocess
import platform
from pathlib import Path
import pytest


@pytest.fixture
def binary_path() -> Path:
    """Path to built binary."""
    return Path(__file__).parent.parent / "dist" / "mekong"


@pytest.fixture
def source_path() -> Path:
    """Path to source mekong command."""
    return Path(__file__).parent.parent / "scripts" / "mekong"


class TestBinaryExists:
    """Verify binary was built successfully."""

    def test_binary_file_exists(self, binary_path: Path) -> None:
        """Binary should exist after build."""
        assert binary_path.exists(), f"Binary not found: {binary_path}"

    def test_binary_is_executable(self, binary_path: Path) -> None:
        """Binary should be executable."""
        assert os.access(binary_path, os.X_OK), "Binary is not executable"

    def test_binary_size_reasonable(self, binary_path: Path) -> None:
        """Binary size should be under 50MB."""
        size_mb = binary_path.stat().st_size / (1024 * 1024)
        assert size_mb < 50, f"Binary too large: {size_mb:.1f}MB"
        assert size_mb > 5, f"Binary suspicious small: {size_mb:.1f}MB"


class TestBinaryFunctionality:
    """Verify binary works correctly."""

    def test_version_command(self, binary_path: Path) -> None:
        """Binary --version should work."""
        result = subprocess.run(
            [str(binary_path), "--version"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        assert result.returncode == 0
        assert "Mekong" in result.stdout or "mekong" in result.stdout

    def test_help_command(self, binary_path: Path) -> None:
        """Binary --help should work."""
        result = subprocess.run(
            [str(binary_path), "--help"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        assert result.returncode == 0
        assert len(result.stdout) > 100

    def test_cook_command_help(self, binary_path: Path) -> None:
        """Binary cook --help should work."""
        result = subprocess.run(
            [str(binary_path), "cook", "--help"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        assert result.returncode == 0
        assert "Plan" in result.stdout or "Execute" in result.stdout


class TestBinaryVsSource:
    """Verify binary behaves same as source."""

    def test_version_matches(self, binary_path: Path, source_path: Path) -> None:
        """Binary version should match source version."""
        # Skip if source doesn't exist
        if not source_path.exists():
            pytest.skip("Source command not available")

        binary_result = subprocess.run(
            [str(binary_path), "--version"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        source_result = subprocess.run(
            [source_path, "--version"],
            capture_output=True,
            text=True,
            timeout=5,
        )

        # Both should succeed
        assert binary_result.returncode == 0
        assert source_result.returncode == 0

        # Versions should match (extract version number)
        import re
        binary_version = re.search(r'v?(\d+\.\d+\.\d+)', binary_result.stdout)
        source_version = re.search(r'v?(\d+\.\d+\.\d+)', source_result.stdout)

        if binary_version and source_version:
            assert binary_version.group(1) == source_version.group(1)
```

### Step 2: Performance Benchmarks

```python
# tests/test_performance.py
"""
Performance Benchmark Tests

Startup time, memory usage, and binary size benchmarks.
"""

import subprocess
import time
import statistics
from pathlib import Path
import pytest


@pytest.fixture
def binary_path() -> Path:
    """Path to built binary."""
    return Path(__file__).parent.parent / "dist" / "mekong"


class TestStartupPerformance:
    """Startup time benchmarks."""

    @pytest.mark.parametrize("command", [
        "--version",
        "--help",
        "license cache-status",
    ])
    def test_startup_time(self, binary_path: Path, command: str) -> None:
        """Startup time should be under 0.5s."""
        times = []
        runs = 10

        for _ in range(runs):
            start = time.perf_counter()
            result = subprocess.run(
                [str(binary_path)] + command.split(),
                capture_output=True,
                text=True,
                timeout=5,
            )
            elapsed = time.perf_counter() - start
            times.append(elapsed)

            assert result.returncode == 0, f"Command failed: {command}"

        # Calculate statistics
        avg_time = statistics.mean(times)
        p95_time = sorted(times)[int(runs * 0.95)]

        assert avg_time < 0.5, f"Average startup {avg_time:.3f}s > 0.5s"
        assert p95_time < 0.7, f"P95 startup {p95_time:.3f}s > 0.7s"

        print(f"\n{command}: avg={avg_time:.3f}s, p95={p95_time:.3f}s")

    def test_cached_license_startup(self, binary_path: Path) -> None:
        """With cached license, startup should be faster."""
        # First run warms cache
        subprocess.run(
            [str(binary_path), "license", "cache-status"],
            capture_output=True,
            text=True,
            timeout=5,
        )

        # Second run should use cache
        times = []
        for _ in range(5):
            start = time.perf_counter()
            subprocess.run(
                [str(binary_path), "--version"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            times.append(time.perf_counter() - start)

        avg_cached = statistics.mean(times)
        # Cached startup should be noticeably faster
        # (This is a soft assertion - informational)
        print(f"Cached startup avg: {avg_cached:.3f}s")


class TestMemoryUsage:
    """Memory usage benchmarks."""

    def test_binary_memory_footprint(self, binary_path: Path) -> None:
        """Binary memory footprint should be reasonable."""
        import psutil

        # Start binary in background
        proc = subprocess.Popen(
            [str(binary_path), "--help"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        try:
            process = psutil.Process(proc.pid)
            mem_info = process.memory_info()

            # RSS should be under 100MB for CLI
            rss_mb = mem_info.rss / (1024 * 1024)
            assert rss_mb < 100, f"Memory usage {rss_mb:.1f}MB > 100MB"

            print(f"Memory footprint: {rss_mb:.1f}MB")
        finally:
            proc.terminate()
            proc.wait(timeout=2)
```

### Step 3: RaaS Integration Tests

```python
# tests/test_raas_integration.py
"""
RaaS Gateway Integration Tests

Tests for RaaS license validation, JWT auth, and API key gating.
"""

import os
import subprocess
from pathlib import Path
import pytest


@pytest.fixture
def binary_path() -> Path:
    """Path to built binary."""
    return Path(__file__).parent.parent / "dist" / "mekong"


@pytest.fixture
def raas_env() -> dict:
    """Environment with RaaS configuration."""
    env = os.environ.copy()
    # Use test RaaS gateway
    env["RAAS_GATEWAY_URL"] = "https://raas.agencyos.network"
    return env


class TestLicenseValidation:
    """License validation integration tests."""

    def test_no_license_allows_free_commands(
        self, binary_path: Path, raas_env: dict
    ) -> None:
        """Free commands work without license."""
        env = {**raas_env}
        env.pop("RAAS_LICENSE_KEY", None)  # Ensure no license

        result = subprocess.run(
            [str(binary_path), "version"],
            capture_output=True,
            text=True,
            timeout=10,
            env=env,
        )

        assert result.returncode == 0
        assert "Mekong" in result.stdout

    def test_invalid_license_blocked(
        self, binary_path: Path, raas_env: dict
    ) -> None:
        """Invalid license blocks premium commands."""
        env = {**raas_env, "RAAS_LICENSE_KEY": "invalid-key-12345"}

        result = subprocess.run(
            [str(binary_path), "cook", "test"],
            capture_output=True,
            text=True,
            timeout=10,
            env=env,
        )

        # Should fail with license error
        assert result.returncode != 0
        assert "License" in result.stderr or "license" in result.stderr.lower()


class TestJWTAuth:
    """JWT authentication tests."""

    @pytest.mark.skipif(
        not os.getenv("TEST_RAAS_JWT"),
        reason="Requires TEST_RAAS_JWT environment variable"
    )
    def test_jwt_token_validation(
        self, binary_path: Path, raas_env: dict
    ) -> None:
        """JWT tokens are validated correctly."""
        # This test requires valid JWT token in env
        jwt_token = os.getenv("TEST_RAAS_JWT_TOKEN")
        env = {**raas_env, "RAAS_JWT_TOKEN": jwt_token}

        result = subprocess.run(
            [str(binary_path), "agent", "git", "status"],
            capture_output=True,
            text=True,
            timeout=10,
            env=env,
        )

        # Should succeed with valid JWT
        assert result.returncode == 0


class TestAPIKeyFormats:
    """API key format tests."""

    @pytest.mark.parametrize("key_format", [
        "mk_test_",
        "raas_pro_",
        "REP-",
        "RPP-",
    ])
    def test_api_key_formats(
        self, binary_path: Path, raas_env: dict, key_format: str
    ) -> None:
        """Various API key formats are recognized."""
        test_key = f"{key_format}test123456"
        env = {**raas_env, "RAAS_LICENSE_KEY": test_key}

        result = subprocess.run(
            [str(binary_path), "license", "cache-status"],
            capture_output=True,
            text=True,
            timeout=10,
            env=env,
        )

        # Should at least parse the key format
        assert result.returncode == 0 or "tier" in result.stdout.lower()
```

### Step 4: Update conftest.py

```python
# tests/conftest.py - Add fixtures

import pytest
from pathlib import Path


@pytest.fixture(scope="session")
def project_root() -> Path:
    """Project root directory."""
    return Path(__file__).parent.parent


@pytest.fixture(scope="session")
def dist_dir(project_root: Path) -> Path:
    """Distribution directory."""
    return project_root / "dist"


@pytest.fixture
def mock_license_key() -> str:
    """Mock license key for testing."""
    return "mk_test_12345678901234567890"


@pytest.fixture
def clean_cache_env(tmp_path: Path) -> dict:
    """Environment with clean cache directory."""
    import os
    env = os.environ.copy()
    cache_dir = tmp_path / ".mekong"
    cache_dir.mkdir()
    env["HOME"] = str(tmp_path)
    return env
```

## Todo List

- [ ] Create tests/test_build.py
- [ ] Create tests/test_performance.py
- [ ] Create tests/test_raas_integration.py
- [ ] Update tests/conftest.py with fixtures
- [ ] Run test suite against binary
- [ ] Fix any failing tests
- [ ] Add CI workflow for binary tests

## Success Criteria

- [ ] All existing tests pass
- [ ] New binary tests pass
- [ ] Performance benchmarks meet targets
- [ ] RaaS integration tests pass (with mock or real gateway)
- [ ] Test suite completes in < 5 minutes

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Binary tests fail on CI | Medium | Medium | Skip binary tests if not built |
| RaaS gateway unavailable | Low | Medium | Mock gateway for local tests |
| Performance tests flaky | Medium | Low | Use P95, not max times |

## Security Considerations

- Test API keys must be test-only (not production)
- JWT tokens in CI must be scoped to test environment
- No production credentials in test code

## Next Steps

After Phase 4 complete:
- Move to Phase 5 (Documentation)
- All tests should pass before merge

---

*Created: 2026-03-07 | Phase: 4/5 | Effort: 1 day*
