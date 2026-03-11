# Engineering: Status Command Review — Mekong CLI v5.0

## Command: /status
## Date: 2026-03-11

---

## Source File: src/commands/status.py

Status command exists at `src/commands/status.py`. File implements a Typer CLI group
named "status" with help text "System health & API status".

---

## Command Structure

```
mekong status system        — System health check
mekong status api           — API endpoint status
mekong status missions      — Active mission list
mekong status balance       — MCU credit balance
```

The Typer app is instantiated as:
```python
app = typer.Typer(name="status", help="System health & API status")
```

---

## `status system` Implementation (lines 16-80+)

Checks performed:
1. **Python version** — reads `sys.version_info` tuple
2. **Config status** — calls `get_config()` from `src.core.config`
3. **LLM Client** — calls `get_client()`, checks `is_available` and `model` attributes
4. **Memory** — instantiates `MemoryStore()`, calls `stats()['total']`
5. **Governance** — instantiates `Governance()`, checks `is_halted()` state

Display: Rich Panel with cyan border, each check on its own line with ✅/❌

---

## Issues Found

### Issue 1: No Network/API Check in system
`status system` checks local components only. No verification that:
- Gateway API is reachable on configured port
- LLM provider endpoint responds to ping
- Database (asyncpg) is connected

The `is_available` flag on LLM client is local state, not a live endpoint test.

### Issue 2: MemoryStore instantiation on every call
```python
memory = MemoryStore()
```
Fresh instantiation per status check. If MemoryStore has startup overhead
(file I/O, vector DB init), this adds latency to status command.

### Issue 3: Governance halted state not actionable
Display shows "🔴 HALTED" vs "🟢 RUNNING" but no remediation hint on what
to do when halted. Users see a red status with no path forward.

### Issue 4: Silent Exception Swallowing
```python
try:
    memory = MemoryStore()
    stats = memory.stats()
    console.print(f"[bold]Memory:[/bold] ✅ ({stats['total']} executions)")
except Exception:
    console.print("[bold]Memory:[/bold] ❌")
```
Exception type and message are swallowed. No `--verbose` flag to surface errors.
Users cannot distinguish "file not found" from "corrupted data" from "permission error".

### Issue 5: No exit code on failure
If multiple components show ❌, the command still exits with code 0.
CI pipelines cannot detect unhealthy status programmatically.
Fix: track failure count, exit with code 1 if any critical component fails.

---

## Additional Status Commands

### dashboard_commands.py:65 — `dashboard status`
A separate `status` command exists in dashboard_commands.py:
```python
@app.command("status")
def dashboard_status() -> None:
    """Verifies database connection, cache status, and data freshness."""
```
This is a different status command for the dashboard subsystem.
Two separate status commands with different scopes creates confusion.

---

## Comparison to mekong/commands Status Files
- `.claude/commands/` has no dedicated `/status` command definition
- Status is surfaced through `/health` in gateway.py
- CLI status command (`src/commands/status.py`) and API health endpoint (`/health`)
  return different information with no cross-linking

---

## Recommendations

1. **Add live endpoint ping:** Include HTTP test to configured gateway URL in `status system`
2. **Add --verbose flag:** Expose exception details for debugging
3. **Non-zero exit on failure:** Exit code 1 when critical components are ❌
4. **Consolidate status commands:** Merge dashboard_commands.status into status.py
5. **Add LLM provider latency test:** Ping LLM endpoint and report response time in ms
6. **Add remediation hints:** When component is ❌, print "Fix: export LLM_API_KEY=..." etc.

---

## Overall Assessment
Status command exists and is functional for basic local health checks.
Primary gaps: no live network tests, silent exception handling, and no CI-usable exit codes.
The command is useful for human inspection but not for automated health monitoring pipelines.
