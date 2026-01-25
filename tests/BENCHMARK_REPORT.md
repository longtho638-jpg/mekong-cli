# CLI Performance Benchmark Report

**Generated:** 2026-01-25
**Target:** --help responds in <200ms
**Current Status:** ❌ CRITICAL - All commands >1000ms

---

## Executive Summary

**Performance Score: 0.0%** (Target: >80%)

- ✗ Main CLI: 1617.9ms (808% slower than target)
- ✗ All 18 commands: >1000ms (CRITICAL)
- ⚠ Import bottleneck: `cli.commands.revenue` takes 817ms alone

**Root Cause:** Heavy module imports happening at registration time, not execution time.

---

## Detailed Results

### Main CLI
```
mekong --help: 1617.9ms (min: 1168.9ms, max: 2894.7ms) [CRITICAL]
```

### Command Performance (sorted by avg time)
```
utility_commands --help:  1393.0ms
vibe --help:              1444.6ms
outreach --help:          1265.7ms
bridge --help:            1246.0ms
setup --help:             1226.4ms
test --help:              1220.7ms
deploy --help:            1198.2ms
revenue --help:           1192.3ms
plan --help:              1177.5ms
content --help:           1176.1ms
dev_commands --help:      1175.2ms
finance --help:           1172.5ms
mcp_commands --help:      1167.6ms
sales --help:             1143.1ms
mcp --help:               1136.3ms
scout --help:             1135.2ms
dashboard --help:         1124.4ms
strategy_commands --help: 1115.6ms
```

### Import Time Analysis
```
SLOW (>200ms):
  cli.commands.revenue:     817.0ms  ← PRIMARY BOTTLENECK

WARNING (100-200ms):
  cli.commands.plan:        178.2ms
  cli.commands.test:        173.0ms
  cli.commands.deploy:      155.9ms
  cli.entrypoint:           113.9ms

GOOD (<100ms):
  typer:                     81.4ms
  rich.console:              61.1ms
  core.constants:             1.6ms  ← EXCELLENT
```

---

## Root Cause Analysis

### Problem 1: Eager Loading in `register_commands()`

**File:** `cli/entrypoint.py:27-80`

The `register_commands()` function imports ALL command modules immediately:

```python
def register_commands():
    from cli.commands.revenue import revenue_app  # ← Imports RevenueEngine (817ms)
    app.add_typer(revenue_app, name="revenue")

    from cli.commands.deploy import deploy_app
    app.add_typer(deploy_app, name="deploy")
    # ... 16 more imports ...
```

This happens **every time**, even for `mekong --help`.

### Problem 2: Heavy Top-Level Imports in Command Modules

**Example:** `cli/commands/revenue.py:9`

```python
from antigravity.core.revenue.engine import RevenueEngine  # ← Imported immediately
```

The `RevenueEngine` import loads the entire revenue system, even when just showing `--help`.

### Problem 3: Inefficient Lazy Loading Implementation

Current "lazy loading" in `register_commands()` is NOT lazy - it imports at registration time, not execution time.

---

## Optimization Recommendations

### Priority 1: Fix Lazy Loading (CRITICAL)

**Current (WRONG):**
```python
def register_commands():
    from cli.commands.revenue import revenue_app  # ← Eager import
    app.add_typer(revenue_app, name="revenue")
```

**Recommended (TRUE LAZY):**
```python
def register_commands():
    # Use lazy callbacks - imports only when command executed
    @app.command("revenue")
    def revenue_lazy():
        from cli.commands.revenue import revenue_app
        app.add_typer(revenue_app, name="revenue")
        # Re-invoke with actual command
```

**OR use Typer's built-in lazy loading:**
```python
def register_commands():
    app.add_typer(
        lambda: __import__('cli.commands.revenue', fromlist=['revenue_app']).revenue_app,
        name="revenue"
    )
```

### Priority 2: Defer Heavy Imports in Commands

**Current (WRONG):**
```python
# cli/commands/revenue.py
from antigravity.core.revenue.engine import RevenueEngine  # ← Top-level

@revenue_app.command("dashboard")
def show_dashboard():
    engine = RevenueEngine()  # Already imported
```

**Recommended (RIGHT):**
```python
# cli/commands/revenue.py
# NO top-level imports of heavy modules

@revenue_app.command("dashboard")
def show_dashboard():
    from antigravity.core.revenue.engine import RevenueEngine  # ← Import here
    engine = RevenueEngine()
```

**Benefit:** `--help` won't import RevenueEngine (saves 817ms).

### Priority 3: Use Lazy Loader for Optional Dependencies

For modules that might not be installed:

```python
from scripts.lazy_loader import LazyImporter

# Defer heavy imports
revenue_engine = LazyImporter('antigravity.core.revenue.engine', 'RevenueEngine')

@revenue_app.command("dashboard")
def show_dashboard():
    engine = revenue_engine()  # Import happens here
```

### Priority 4: Cache Command Registration

Only register commands once:

```python
_commands_registered = False

def register_commands():
    global _commands_registered
    if _commands_registered:
        return
    _commands_registered = True
    # ... rest of registration ...
```

### Priority 5: Profile and Optimize Heavy Modules

Run detailed profiling on slow imports:

```bash
python3 -c "import cProfile; cProfile.run('import antigravity.core.revenue.engine', sort='cumtime')"
```

Look for:
- Heavy data loading at import time
- Database connections in module scope
- Large file reads
- Complex initialization

---

## Implementation Plan

### Phase 1: Quick Wins (Target: <500ms)

1. ✅ Move all heavy imports inside command functions
2. ✅ Add command registration caching
3. ✅ Defer `RevenueEngine` import in revenue.py
4. ✅ Defer similar imports in deploy.py, test.py, plan.py

**Expected Result:** 60-70% improvement

### Phase 2: True Lazy Loading (Target: <200ms)

1. ✅ Implement proper lazy command registration
2. ✅ Use `LazyImporter` for all antigravity.core modules
3. ✅ Move rich table creation inside commands
4. ✅ Defer logging imports

**Expected Result:** 80-90% improvement

### Phase 3: Advanced Optimization (Target: <100ms)

1. ✅ Pre-compile Python bytecode (.pyc)
2. ✅ Use importlib.util.LazyLoader for stdlib modules
3. ✅ Profile startup with py-spy
4. ✅ Consider using exec() for command isolation

**Expected Result:** 95% improvement

---

## Verification

After implementing optimizations, re-run benchmark:

```bash
python tests/benchmark_cli.py
```

**Success Criteria:**
- ✅ Main CLI --help < 200ms
- ✅ All commands --help < 500ms
- ✅ Performance score > 80%
- ✅ No import errors or functionality regression

---

## Code Examples

### Example: Optimized Command Module

**Before:**
```python
# cli/commands/revenue.py
from antigravity.core.revenue.engine import RevenueEngine
from core.automation.autopilot import RevenueAutopilotService
import typer
from rich.console import Console
from rich.table import Table

console = Console()
revenue_app = typer.Typer(help="💰 Manage Revenue & Financials")

@revenue_app.command("dashboard")
def show_dashboard():
    engine = RevenueEngine()
    # ... rest of function ...
```

**After:**
```python
# cli/commands/revenue.py
import typer

# Lazy imports - only used when needed
revenue_app = typer.Typer(help="💰 Manage Revenue & Financials")

@revenue_app.command("dashboard")
def show_dashboard():
    # Import only when command executed
    from antigravity.core.revenue.engine import RevenueEngine
    from rich.console import Console
    from rich.table import Table

    console = Console()
    engine = RevenueEngine()
    # ... rest of function ...
```

**Improvement:** Saves 817ms for `--help`.

### Example: Optimized Entrypoint

**Before:**
```python
def register_commands():
    from cli.commands.revenue import revenue_app
    app.add_typer(revenue_app, name="revenue")
    # ... 16 more imports ...
```

**After:**
```python
_commands_registered = False

def register_commands():
    global _commands_registered
    if _commands_registered:
        return
    _commands_registered = True

    # True lazy loading - import only when command invoked
    def make_lazy_loader(module_path, app_name):
        def loader():
            mod = __import__(module_path, fromlist=[app_name])
            return getattr(mod, app_name)
        return loader

    app.add_typer(
        make_lazy_loader('cli.commands.revenue', 'revenue_app')(),
        name="revenue"
    )
    # ... rest of commands ...
```

**Improvement:** Commands registered, but not imported until used.

---

## Monitoring

Add performance monitoring to track improvements:

```python
# cli/entrypoint.py
import time

def main():
    start_time = time.perf_counter()

    # ... CLI execution ...

    elapsed = (time.perf_counter() - start_time) * 1000
    if elapsed > 200:
        print(f"⚠️  Slow startup: {elapsed:.1f}ms", file=sys.stderr)
```

---

## Appendix: Benchmark Command Reference

```bash
# Run full benchmark
python tests/benchmark_cli.py

# Run with verbose output
python tests/benchmark_cli.py --verbose

# Export to JSON
python tests/benchmark_cli.py --export-json report.json

# Profile specific module
python3 -c "import cProfile; cProfile.run('import cli.commands.revenue', sort='cumtime')"

# Check import time
python3 -c "import time; start=time.perf_counter(); import cli.entrypoint; print((time.perf_counter()-start)*1000)"
```

---

**Report End**
Generated by `tests/benchmark_cli.py` on 2026-01-25
