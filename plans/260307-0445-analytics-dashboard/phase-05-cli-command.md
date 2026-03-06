---
title: "Phase 5: CLI Command"
description: "Add `mekong dashboard` command to main.py"
status: completed
priority: P2
effort: 30m
---

# Phase 5: CLI Command

## Overview

Thêm `mekong dashboard` command vào CLI chính.

## Requirements

1. Command `mekong dashboard` khởi tạo server
2. Tự động mở browser
3. Port configurable (--port flag)
4. Hiển thị URL và instructions

## Files to Modify

- `src/main.py` — Add dashboard command
- `pyproject.toml` — Add dependencies (nếu cần)

## Implementation Steps

### 5.1 Add Dashboard Command to main.py

```python
# src/main.py — Add to command imports

# Dashboard command
from src.api.dashboard.runner import run_dashboard


@app.command()
def dashboard(
    port: int = typer.Option(8080, "--port", "-p", help="Server port"),
    no_open: bool = typer.Option(False, "--no-open", help="Don't open browser"),
) -> None:
    """
    📊 Launch analytics dashboard.

    Starts local server and opens browser to dashboard.
    """
    from src.lib.raas_gate_validator import RaasGateValidator

    # Check license (premium feature)
    validator = RaasGateValidator()
    is_valid, error = validator.validate()

    if not is_valid:
        console.print(
            "[bold red]License Required:[/bold red] "
            "Dashboard is a PRO feature."
        )
        console.print("\n[yellow]Upgrade to PRO:[/yellow]")
        console.print("  [cyan]mekong license generate --tier pro[/cyan]\n")
        raise SystemExit(1)

    console.print("""
[bold cyan]📊 Mekong Analytics Dashboard[/bold cyan]

[yellow]Starting server...[/yellow]
    """)

    console.print(f"[dim]Dashboard:[/dim] [bold green]http://localhost:{port}[/bold green]")
    console.print(f"[dim]API Docs:[/dim]  [blue]http://localhost:{port}/api/docs[/blue]")
    console.print("\n[dim]Press Ctrl+C to stop[/dim]\n")

    try:
        run_dashboard(port=port, open_browser=not no_open)
    except KeyboardInterrupt:
        console.print("\n[yellow]Dashboard stopped[/yellow]")
```

### 5.2 Update FREE_COMMANDS

```python
# src/main.py — Update FREE_COMMANDS set

FREE_COMMANDS = {
    "init", "version", "list", "search", "status", "config",
    "doctor", "help", "dash", "license", "clean", "test",
    "license-admin",  # Admin dashboard is free
    # Dashboard is NOT free — it's a PRO feature
}
```

### 5.3 Add Dependencies to pyproject.toml

```toml
# pyproject.toml — Add to dependencies

[project.optional-dependencies]
dashboard = [
    "fastapi>=0.109.0",
    "uvicorn[standard]>=0.27.0",
    "jinja2>=3.1.3",
]

[project.dependencies]
# Add if not already present
httpx>=0.27.0
```

### 5.4 Update Help Message

```python
# src/main.py — Update main() help text

@app.callback(invoke_without_command=True)
def main(...):
    """Mekong CLI - Autonomous AI Agent Framework"""
    # ...
    console.print("""
[bold cyan]🐉 Mekong CLI[/bold cyan] - RaaS Agency Operating System

[dim]Quick Start:[/dim]
  [bold]mekong cook[/bold] "[your goal]"    Plan → Execute → Verify
  [bold]mekong plan[/bold] "[your goal]"    Plan only (dry run)
  [bold]mekong dashboard[/bold]             📊 Analytics dashboard
```

## Success Criteria

- [ ] `mekong dashboard` command hoạt động
- [ ] Browser tự động mở
- [ ] License validation hoạt động (PRO feature)
- [ ] Help text hiển thị đúng

## Dependencies

- Phase 3: Dashboard runner
- FastAPI, uvicorn installed

## Risk Assessment

- **Risk:** Port conflict
- **Mitigation:** Show error message với alternative port suggestion
