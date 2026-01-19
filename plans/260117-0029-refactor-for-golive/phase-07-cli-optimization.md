# Phase 07: CLI Tooling Optimization

**Timeline:** Phase 7 (Week 2)
**Impact:** Developer experience + security
**Priority:** P1

---

## 📋 CONTEXT

**Parent Plan:** `/Users/macbookprom1/mekong-cli/plans/260117-0029-refactor-for-golive/plan.md`
**Dependencies:** Phase 6 (infrastructure foundation)
**Related Docs:** `docs/code-standards.md`, `.claude/rules/development-rules.md`

---

## 🎯 OVERVIEW

**Date:** 2026-01-19
**Description:** Modularize CLI tooling, extract command registry pattern, unify license generation, add subprocess safety
**Priority:** P1
**Status:** Pending

---

## 🔑 KEY INSIGHTS

From scout report:

1. **ops.py Bloat**: 235 lines mixing network/quota/health/deploy concerns + subprocess calls without sanitization
2. **entrypoint.py Monolithic**: 251 lines of hardcoded command registration + banner text
3. **License Key Duplication**: 2 implementations (`backend/api/routers/webhooks.py`, `core/licensing/legacy.py`)
4. **Subprocess Security**: 5 files use subprocess without input validation (command injection risk)

---

## 📊 REQUIREMENTS

### Deliverables

1. **Split ops.py into 3 Modules**
   - `cli/ops/network.py` (network diagnostics)
   - `cli/ops/monitoring.py` (quota/health checks)
   - `cli/ops/deployment.py` (deploy operations)

2. **Extract Command Registry Pattern**
   - Move hardcoded commands to declarative config
   - Create plugin-style command loader
   - Reduce entrypoint.py from 251 → ~80 lines

3. **Unify License Key Generation**
   - Single source in `core/licensing/generator.py`
   - Deprecate legacy implementations
   - Add format validation

4. **Subprocess Safety Wrappers**
   - Create `cli/utils/subprocess_safe.py`
   - Add input sanitization + timeout handling
   - Enforce usage across all CLI commands

---

## 🏗️ ARCHITECTURE

### Current Structure (Problematic)
```
cli/
├── entrypoint.py      # 251 lines - monolithic
├── commands/
│   ├── ops.py         # 235 lines - mixed concerns
│   ├── bridge.py      # 153 lines - subprocess calls
│   ├── mcp.py         # 79 lines - subprocess calls
│   └── outreach.py    # 138 lines - subprocess calls
├── developer.py       # 113 lines - subprocess calls
└── billing.py         # 130 lines - license validation

core/licensing/
├── legacy.py          # generate_license_key() - DUPLICATE
└── validator.py       # 300 lines - needs generator import

backend/api/routers/
└── webhooks.py        # generate_license_key() - DUPLICATE
```

### Target Structure (Optimized)
```
cli/
├── entrypoint.py      # 80 lines - minimal loader
├── config/
│   └── commands.yaml  # Declarative command registry
├── commands/
│   ├── ops/           # Split from ops.py
│   │   ├── network.py      # 80 lines
│   │   ├── monitoring.py   # 80 lines
│   │   └── deployment.py   # 75 lines
│   └── [other commands]
├── utils/
│   ├── subprocess_safe.py  # Subprocess wrapper
│   └── command_loader.py   # Registry pattern
└── billing.py         # Import from core.licensing

core/licensing/
├── generator.py       # SINGLE license key generator
├── validator.py       # Validation logic
└── formats.py         # Format specs (AGENCYOS-*, mk_live_*)

backend/api/routers/
└── webhooks.py        # Import from core.licensing.generator
```

---

## 📂 RELATED CODE FILES

| File | Lines | Issues |
|------|-------|--------|
| `cli/entrypoint.py` | 251 | Monolithic registration, hardcoded banner |
| `cli/commands/ops.py` | 235 | Mixed concerns, subprocess without validation |
| `cli/commands/bridge.py` | 153 | Subprocess security risk |
| `cli/commands/mcp.py` | 79 | Subprocess security risk |
| `cli/commands/outreach.py` | 138 | Subprocess security risk |
| `cli/developer.py` | 113 | Subprocess security risk |
| `core/licensing/legacy.py` | ~100 | Duplicate license generation |
| `backend/api/routers/webhooks.py` | 209 | Duplicate license generation |

---

## 🛠️ IMPLEMENTATION STEPS

### Step 1: Split ops.py (4h)

1. **Extract network operations**
   ```python
   # cli/ops/network.py
   import subprocess
   from cli.utils.subprocess_safe import run_safe

   def check_network():
       """Network diagnostics"""
       return run_safe(['ping', '-c', '1', 'google.com'])

   def check_dns():
       """DNS resolution check"""
       return run_safe(['nslookup', 'agencyos.network'])
   ```

2. **Extract monitoring operations**
   ```python
   # cli/ops/monitoring.py
   import psutil

   def check_quota():
       """Resource quota check"""
       disk = psutil.disk_usage('/')
       memory = psutil.virtual_memory()
       return {'disk': disk.percent, 'memory': memory.percent}

   def health_check():
       """System health diagnostics"""
       return {
           'cpu': psutil.cpu_percent(),
           'load': psutil.getloadavg()
       }
   ```

3. **Extract deployment operations**
   ```python
   # cli/ops/deployment.py
   from cli.utils.subprocess_safe import run_safe

   def deploy_backend():
       """Deploy backend services"""
       return run_safe(['pnpm', 'deploy:backend'], timeout=300)

   def deploy_frontend():
       """Deploy frontend apps"""
       return run_safe(['pnpm', 'deploy:frontend'], timeout=300)
   ```

4. **Update ops.py to re-export**
   ```python
   # cli/commands/ops.py (legacy wrapper)
   from cli.ops.network import check_network, check_dns
   from cli.ops.monitoring import check_quota, health_check
   from cli.ops.deployment import deploy_backend, deploy_frontend

   # Maintain backward compatibility
   __all__ = [
       'check_network', 'check_dns',
       'check_quota', 'health_check',
       'deploy_backend', 'deploy_frontend'
   ]
   ```

### Step 2: Extract Command Registry (6h)

1. **Create declarative config**
   ```yaml
   # cli/config/commands.yaml
   commands:
     - name: scout
       module: cli.commands.scout
       function: run_scout
       description: "Explore codebase intelligently"
       args:
         - name: query
           type: string
           required: true

     - name: plan
       module: cli.commands.plan
       function: create_plan
       description: "Create strategic implementation plan"
       args:
         - name: goal
           type: string
           required: true
   ```

2. **Create command loader**
   ```python
   # cli/utils/command_loader.py
   import importlib
   import yaml
   from pathlib import Path

   class CommandRegistry:
       def __init__(self, config_path: str):
           self.commands = {}
           self._load_config(config_path)

       def _load_config(self, config_path: str):
           with open(config_path) as f:
               config = yaml.safe_load(f)

           for cmd_def in config['commands']:
               module = importlib.import_module(cmd_def['module'])
               func = getattr(module, cmd_def['function'])
               self.commands[cmd_def['name']] = {
                   'func': func,
                   'description': cmd_def['description'],
                   'args': cmd_def['args']
               }

       def get(self, name: str):
           return self.commands.get(name)

       def list_commands(self):
           return self.commands.keys()
   ```

3. **Refactor entrypoint.py**
   ```python
   # cli/entrypoint.py (simplified)
   from cli.utils.command_loader import CommandRegistry
   import typer

   app = typer.Typer()
   registry = CommandRegistry('cli/config/commands.yaml')

   @app.command()
   def run(command: str, *args):
       """Execute registered command"""
       cmd = registry.get(command)
       if not cmd:
           typer.echo(f"Unknown command: {command}")
           raise typer.Exit(1)

       return cmd['func'](*args)

   @app.command()
   def list_commands():
       """List available commands"""
       for name in registry.list_commands():
           cmd = registry.get(name)
           typer.echo(f"{name}: {cmd['description']}")

   if __name__ == '__main__':
       app()
   ```

### Step 3: Unify License Generation (3h)

1. **Create single generator module**
   ```python
   # core/licensing/generator.py
   import secrets
   import hashlib
   from datetime import datetime

   class LicenseGenerator:
       FORMATS = {
           'agencyos': 'AGENCYOS-{segment1}-{segment2}-{segment3}',
           'mekong': 'mk_live_{hash}_{timestamp}'
       }

       def generate(self, format: str = 'agencyos', **kwargs) -> str:
           """Generate license key with specified format"""
           if format == 'agencyos':
               return self._generate_agencyos()
           elif format == 'mekong':
               return self._generate_mekong()
           raise ValueError(f"Unknown format: {format}")

       def _generate_agencyos(self) -> str:
           """AGENCYOS-XXXX-YYYY-ZZZZ format"""
           segments = [
               secrets.token_hex(2).upper(),
               secrets.token_hex(2).upper(),
               secrets.token_hex(2).upper()
           ]
           return f"AGENCYOS-{'-'.join(segments)}"

       def _generate_mekong(self) -> str:
           """mk_live_hash_timestamp format"""
           hash_part = hashlib.sha256(secrets.token_bytes(32)).hexdigest()[:16]
           timestamp = int(datetime.now().timestamp())
           return f"mk_live_{hash_part}_{timestamp}"

   # Singleton instance
   license_generator = LicenseGenerator()
   ```

2. **Update webhooks.py**
   ```python
   # backend/api/routers/webhooks.py
   from core.licensing.generator import license_generator

   @router.post('/webhook')
   async def handle_webhook(payload: WebhookPayload):
       # Replace local generate_license_key()
       license_key = license_generator.generate(format='mekong')
       # ... rest of webhook logic
   ```

3. **Deprecate legacy.py**
   ```python
   # core/licensing/legacy.py
   from core.licensing.generator import license_generator
   import warnings

   def generate_license_key(*args, **kwargs):
       warnings.warn(
           "legacy.generate_license_key is deprecated. "
           "Use core.licensing.generator.license_generator instead",
           DeprecationWarning,
           stacklevel=2
       )
       return license_generator.generate(*args, **kwargs)
   ```

### Step 4: Subprocess Safety Wrappers (3h)

1. **Create safety wrapper module**
   ```python
   # cli/utils/subprocess_safe.py
   import subprocess
   import shlex
   from typing import List, Optional

   class SubprocessError(Exception):
       pass

   def run_safe(
       command: List[str],
       timeout: int = 30,
       allow_shell: bool = False,
       check: bool = True
   ) -> subprocess.CompletedProcess:
       """
       Safe subprocess execution with validation

       Args:
           command: Command as list (NOT string to prevent injection)
           timeout: Execution timeout in seconds
           allow_shell: DANGEROUS - only if absolutely necessary
           check: Raise exception on non-zero exit
       """
       # Validate command is list
       if not isinstance(command, list):
           raise SubprocessError("Command must be list, not string")

       # Sanitize each argument
       sanitized = [shlex.quote(str(arg)) if allow_shell else str(arg)
                    for arg in command]

       try:
           result = subprocess.run(
               sanitized,
               capture_output=True,
               text=True,
               timeout=timeout,
               check=check,
               shell=allow_shell  # Should be False in 99% of cases
           )
           return result

       except subprocess.TimeoutExpired:
           raise SubprocessError(f"Command timed out after {timeout}s")
       except subprocess.CalledProcessError as e:
           raise SubprocessError(f"Command failed: {e.stderr}")
   ```

2. **Enforce usage across CLI**
   ```python
   # cli/commands/bridge.py (refactored)
   from cli.utils.subprocess_safe import run_safe

   def run_bridge_command(args: List[str]):
       """Execute bridge command safely"""
       result = run_safe(['mekong-bridge'] + args, timeout=60)
       return result.stdout
   ```

3. **Add linting rule**
   ```yaml
   # .pylintrc or ruff.toml
   [tool.ruff.lint]
   select = ["S603"]  # subprocess-without-shell-equals-true

   # Ban direct subprocess usage
   ban-relative-imports = ["subprocess.run", "subprocess.call"]
   ```

---

## ✅ TODO

### Analysis
- [ ] Map all subprocess usages across CLI
- [ ] Identify command registry requirements
- [ ] Document license key format specifications

### Implementation
- [ ] Split ops.py into network/monitoring/deployment
- [ ] Create command registry pattern (commands.yaml + loader)
- [ ] Unify license generation in core/licensing/generator.py
- [ ] Implement subprocess safety wrapper
- [ ] Refactor 5 files to use run_safe()

### Validation
- [ ] Test all ops.py functions after split
- [ ] Verify command registry loads all commands
- [ ] Validate license key generation compatibility
- [ ] Security audit subprocess wrapper
- [ ] Run subprocess linter checks

### Documentation
- [ ] Document command registry pattern
- [ ] Create subprocess safety guidelines
- [ ] Update license generation docs

---

## 📊 SUCCESS CRITERIA

### Code Quality
- ✅ ops.py: 235 → 3 files × ~80 lines each
- ✅ entrypoint.py: 251 → 80 lines
- ✅ License generation: 2 implementations → 1 unified
- ✅ Subprocess calls: 0 unsafe usages

### Security
- ✅ All subprocess calls use run_safe()
- ✅ Input sanitization: 100% coverage
- ✅ Timeout handling: All long-running commands
- ✅ Shell=True usage: 0 instances (or explicitly documented)

### Developer Experience
- ✅ Command registration: Declarative YAML
- ✅ Plugin pattern: New commands in 5 minutes
- ✅ Type safety: 100% typed signatures

---

## ⚠️ RISK ASSESSMENT

**Medium Risk:**
- Command registry refactor could break existing integrations
- License key format changes may invalidate existing keys
- Subprocess wrapper could break edge cases

**Mitigation:**
- Feature flag command registry during transition
- Maintain backward compatibility for license formats
- Comprehensive subprocess wrapper testing
- Gradual rollout with monitoring

---

## 🔒 SECURITY CONSIDERATIONS

**High Priority:**
- Subprocess injection prevention (P0)
- License key entropy validation
- Command execution authorization

**Implementation:**
- Input sanitization in run_safe()
- Secrets validation (min 128-bit entropy)
- Command allowlist for sensitive operations

---

## 🚀 NEXT STEPS

1. **Day 1:** Split ops.py + create subprocess wrapper (6h)
2. **Day 2:** Extract command registry pattern (6h)
3. **Day 3:** Unify license generation + refactor usage (4h)

**Total Effort:** 16 hours over 3 days

---

_Phase 7: CLI optimization for security and developer experience_
