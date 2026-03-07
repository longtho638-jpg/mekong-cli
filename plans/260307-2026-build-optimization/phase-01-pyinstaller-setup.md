---
title: "Phase 1: PyInstaller Setup"
description: "Configure PyInstaller for mekong-cli binary build"
priority: P1
status: pending
effort: 1-2 days
---

# Phase 1: PyInstaller Setup

## Overview

Configure PyInstaller to build standalone binary for mekong-cli with <0.5s startup time.

## Key Insights

- Current: Poetry source install requires Python environment, ~2s startup
- Target: Single binary ~25MB, no Python env required
- Challenge: Dynamic imports (Node.js subprocess for license validation)

## Requirements

### Functional
- PyInstaller spec file with hidden imports
- Build script for macOS (darwin)
- Binary output to `dist/mekong`
- Version embedding in binary

### Non-Functional
- Startup time < 0.5s
- Binary size < 30MB (before UPX)
- Cross-platform support (macOS first, Linux later)

## Architecture

```
pyproject.toml (build-system)
    ↓
scripts/build-binary.sh (PyInstaller invocation)
    ↓
mekong.spec (PyInstaller spec with hidden-imports)
    ↓
dist/mekong (standalone binary)
```

## Related Code Files

### Modify
- `pyproject.toml` - Add PyInstaller dev dependency, build script
- `src/main.py` - Add `sys.frozen` check for PyInstaller runtime

### Create
- `mekong.spec` - PyInstaller specification file
- `scripts/build-binary.sh` - Build script
- `scripts/build-binary.ps1` - Windows build script (optional)

### Delete
- None

## Implementation Steps

### Step 1: Add PyInstaller Dependencies

```toml
# pyproject.toml
[tool.poetry.group.build.dependencies]
pyinstaller = "^6.0.0"
pyinstaller-hooks-contrib = "^2024.0"
```

### Step 2: Create PyInstaller Spec File

```python
# mekong.spec
from PyInstaller.utils.hooks import collect_submodules

block_cipher = None

a = Analysis(
    ['src/main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('src/recipes', 'recipes'),
        ('src/cli', 'cli'),
    ],
    hiddenimports=[
        'typer',
        'rich',
        'fastapi',
        'uvicorn',
        'pydantic',
        'pydantic_settings',
        # RaaS modules
        'src.lib.raas_gate_validator',
        'src.lib.raas_gate_utils',
        'src.core.telemetry_consent',
        'src.core.graceful_shutdown',
        'src.core.phase_completion_detector',
        # All CLI commands
        'src.commands.license_commands',
        'src.commands.license_renewal',
        'src.commands.debug_rate_limits',
        'src.commands.compliance',
        'src.commands.telemetry_commands',
        'src.commands.dashboard_commands',
        # Core modules
        'src.core.planner',
        'src.core.executor',
        'src.core.verifier',
        'src.core.orchestrator',
        'src.core.llm_client',
        'src.core.gateway',
        'src.core.telemetry',
        'src.core.memory',
        # Agents
        'src.agents.git_agent',
        'src.agents.file_agent',
        'src.agents.shell_agent',
        'src.agents.lead_hunter',
        'src.agents.content_writer',
        'src.agents.recipe_crawler',
        # Database
        'sqlalchemy',
        'psycopg2',
        'asyncpg',
        # Auth
        'python_jose',
        'cryptography',
        'passlib',
        'authlib',
    ],
    runtime_hooks=[],
    excludes=[
        'matplotlib',
        'scipy',
        'numpy',
        'pandas',
        'test_*',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    output_exe='dist/mekong',
    name='mekong',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
```

### Step 3: Create Build Script

```bash
#!/usr/bin/env bash
# scripts/build-binary.sh - Build mekong-cli binary with PyInstaller

set -e

echo "🐉 Building Mekong CLI Binary..."

# Clean previous build
rm -rf dist/ build/

# Install build dependencies
poetry install --with build

# Build with PyInstaller
echo "📦 Running PyInstaller..."
poetry run pyinstaller mekong.spec --clean

# Verify binary
if [ -f "dist/mekong" ]; then
    echo "✅ Binary created: dist/mekong"
    echo "📊 Binary size: $(du -h dist/mekong | cut -f1)"
    echo "⏱️  Startup test:"
    time dist/mekong --version
else
    echo "❌ Build failed - dist/mekong not found"
    exit 1
fi
```

### Step 4: Update pyproject.toml Scripts

```toml
[tool.poetry.scripts]
mekong = "src.main:app"
mekong-build = "scripts.build_binary:main"

[tool.pyinstaller]
spec-path = "mekong.spec"
dist-path = "dist"
```

### Step 5: Handle Node.js Subprocess

The license validator spawns Node.js subprocess. For binary distribution:

**Option A: Bundle Node.js** (recommended for standalone)
```python
# In mekong.spec, add node binary
binaries=[
    ('/usr/local/bin/node', 'node'),
]
```

**Option B: Fallback to Python-only validation**
```python
# In raas_gate_validator.py, add _fallback_validate()
# Already exists - enhance to handle PyInstaller runtime
if getattr(sys, 'frozen', False):
    return self._fallback_validate(license_key)
```

## Todo List

- [ ] Add PyInstaller to pyproject.toml build dependencies
- [ ] Create mekong.spec with all hidden imports
- [ ] Create scripts/build-binary.sh
- [ ] Test build on macOS
- [ ] Verify binary size < 30MB
- [ ] Verify startup time < 0.5s
- [ ] Fix any missing imports from error logs
- [ ] Add version embedding to binary

## Success Criteria

- [ ] `scripts/build-binary.sh` runs without errors
- [ ] `dist/mekong` binary created
- [ ] Binary size: 20-30MB
- [ ] Startup time: < 0.5s (average of 10 runs)
- [ ] `mekong --version` works
- [ ] `mekong --help` works
- [ ] Basic commands work (status, config, version)

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Missing hidden imports | High | Medium | Iterative build-fix cycle |
| Binary too large (>50MB) | Medium | High | UPX compression, exclude deps |
| Node.js subprocess fails | Medium | High | Fallback to Python validation |
| Build time > 5min | Low | Low | Cache .pyc files |

## Security Considerations

- Binary should NOT contain hardcoded API keys
- License key validation must work in binary
- RaaS gateway JWT verification must pass

## Next Steps

After Phase 1 complete:
- Move to Phase 2 (Dependency Optimization)
- Parallel: Start Phase 5 (Documentation) for build section

---

*Created: 2026-03-07 | Phase: 1/5 | Effort: 1-2 days*
