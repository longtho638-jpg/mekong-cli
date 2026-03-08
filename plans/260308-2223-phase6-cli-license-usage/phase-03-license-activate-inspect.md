---
title: "Phase 3: License Activate & Inspect Commands"
description: "Implement mekong license activate và inspect - activate key và inspect JWT payload"
status: pending
priority: P2
effort: 1.5h
branch: master
tags: [phase-3, license, cli]
created: 2026-03-08
---

# Phase 3: License Activate & Inspect Commands

## Overview

Implement 2 subcommands:
- `mekong license activate` - Activate license key và lưu vào credentials
- `mekong license inspect` - Inspect JWT payload (decode không verify)

## Requirements

### Activate Command
- Accept mk_ API key hoặc JWT token
- Validate format trước khi lưu
- Lưu vào `~/.mekong/raas/credentials.json`
- Optional: Validate với gateway trước khi lưu
- Support `--no-validate` flag để skip validation

### Inspect Command
- Decode JWT payload (chỉ base64 decode, không verify signature)
- Hiển thị: tenant_id, tier, exp, features
- Support cả JWT từ stdin hoặc file

## Architecture

```
mekong license activate [KEY]
         │
         ▼
┌─────────────────────────┐
│  Format Validation      │
│  - mk_.* or JWT         │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  RaaSAuthClient         │
│  - login()              │
│  - _save_credentials()  │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Secure Storage         │
│  - Keychain (macOS)     │
│  - DPAPI (Windows)      │
│  - File fallback        │
└─────────────────────────┘
```

## Files to Modify/Create

- `src/commands/license_commands.py` - Thêm `activate` và `inspect` subcommands
- `src/core/raas_auth.py` - Đã có `login()` và `_decode_jwt()` methods

## Implementation Steps

### Step 1: Activate Command

```python
# src/commands/license_commands.py

@app.command("activate")
def activate_license(
    key: Optional[str] = typer.Argument(
        None,
        help="License key (mk_...) or JWT token",
    ),
    no_validate: bool = typer.Option(
        False,
        "--no-validate",
        help="Skip gateway validation before activating",
    ),
) -> None:
    """
    🔑 Activate license key and save to credentials.

    Examples:
        mekong license activate mk_abc123...
        mekong license activate  # Interactive prompt
        mekong license activate --no-validate
    """
    from src.core.raas_auth import get_auth_client

    console.print("[bold cyan]🔑 Activating License...[/bold cyan]\n")

    # Get key from various sources
    if not key:
        key = os.getenv("RAAS_LICENSE_KEY")

    if not key:
        key = typer.prompt(
            "Enter license key (mk_...) or JWT token",
            hide_input=True,
        )

    if not key.strip():
        console.print("[red]❌ No key provided[/red]\n")
        raise typer.Exit(1)

    client = get_auth_client()

    # Validate format first
    if key.startswith("mk_"):
        if len(key) < 8:
            console.print("[red]❌ Invalid API key format (too short)[/red]\n")
            raise typer.Exit(1)
    elif "." in key:
        # Basic JWT validation
        payload = client._decode_jwt(key)
        if not payload:
            console.print("[red]❌ Invalid JWT format[/red]\n")
            raise typer.Exit(1)
    else:
        console.print("[red]❌ Unrecognized credential format[/red]\n")
        raise typer.Exit(1)

    # Validate with gateway (optional)
    if not no_validate:
        console.print("Validating with gateway...")
        result = client.validate_credentials(key)

        if not result.valid:
            console.print(f"[red]❌ Validation failed:[/red] {result.error}\n")
            raise typer.Exit(1)

        console.print("[green]✓ Gateway validation passed[/green]\n")

    # Save credentials
    login_result = client.login(token=key, persist=True)

    if login_result.valid:
        console.print("[bold green]✅ License activated![/bold green]\n")
        console.print(f"Tier: {login_result.tenant.tier.upper()}\n")
    else:
        console.print(f"[red]⚠️ Activated but validation failed:[/red] {login_result.error}\n")
```

### Step 2: Inspect Command

```python
# src/commands/license_commands.py

@app.command("inspect")
def inspect_license(
    token: Optional[str] = typer.Argument(
        None,
        help="JWT token to inspect. If omitted, uses stored credentials.",
    ),
    from_file: Optional[str] = typer.Option(
        None,
        "--file", "-f",
        help="Read JWT from file",
    ),
) -> None:
    """
    🔍 Inspect JWT license payload (decode only, no verification).

    Examples:
        mekong license inspect eyJhbGc...
        mekong license inspect --file token.txt
        mekong license inspect  # Uses stored credentials
    """
    from src.core.raas_auth import get_auth_client

    console.print("[bold cyan]🔍 Inspecting License...[/bold cyan]\n")

    client = get_auth_client()

    # Get token from various sources
    if from_file:
        with open(from_file, "r") as f:
            token = f.read().strip()
    elif not token:
        creds = client._load_credentials()
        token = creds.get("token") or os.getenv("RAAS_LICENSE_KEY")

    if not token:
        console.print("[yellow]⚠️ No token provided[/yellow]\n")
        raise typer.Exit(1)

    # Decode JWT
    payload = client._decode_jwt(token)

    if not payload:
        console.print("[red]❌ Invalid JWT format[/red]\n")
        console.print("Expected format: xxxxx.xxxxx.xxxxx\n")
        raise typer.Exit(1)

    # Display payload
    console.print("[bold]Decoded Payload:[/bold]\n")

    table = Table(show_header=True, header_style="bold cyan")
    table.add_column("Claim", style="dim")
    table.add_column("Value")

    # Standard claims
    table.add_row("sub (Subject)", payload.get("sub", "(missing)"))
    table.add_row("iat (Issued At)", _format_timestamp(payload.get("iat")))
    table.add_row("exp (Expires)", _format_timestamp(payload.get("exp")))

    # Check expiry
    exp = payload.get("exp")
    if exp:
        import time
        if exp < time.time():
            table.add_row("Status", "[red]❌ EXPIRED[/red]")
        else:
            remaining = exp - time.time()
            hours = remaining / 3600
            table.add_row("Status", f"[green]✓ Valid[/green] ({hours:.1f}h remaining)")
    else:
        table.add_row("Status", "[yellow]⚠️ No expiry claim[/yellow]")

    # App metadata (tier, features)
    app_metadata = payload.get("app_metadata", {})
    table.add_row("Tier", app_metadata.get("tier", payload.get("tier", "(missing)")))
    table.add_row("Role", app_metadata.get("role", payload.get("role", "(missing)")))
    table.add_row("Tenant ID", app_metadata.get("tenant_id", payload.get("tenant_id", "(missing)")))

    console.print(table)

    # Features
    features = app_metadata.get("features", payload.get("features", []))
    if features:
        console.print(f"\n[bold]Features:[/bold] ({len(features)})")
        for feature in features[:10]:
            console.print(f"  • {feature}")
        if len(features) > 10:
            console.print(f"  ... and {len(features) - 10} more")

    # Raw JSON (verbose mode)
    console.print("\n[dim]Full payload:[/dim]")
    console.print_json(json.dumps(payload, indent=2))
```

### Step 3: Helper Function

```python
# src/commands/license_commands.py

def _format_timestamp(ts: Optional[int]) -> str:
    """Format Unix timestamp to readable date."""
    if not ts:
        return "(missing)"
    from datetime import datetime
    return datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S UTC")
```

## Verification Criteria

- [ ] `mekong license activate mk_xxx` lưu credentials thành công
- [ ] `--no-validate` flag skip gateway validation
- [ ] `mekong license inspect` hiển thị JWT payload
- [ ] Display expiry status (valid/expired)
- [ ] Read JWT from file với `--file` flag
- [ ] Fallback stored credentials khi không có token arg

## Success Criteria

```
$ mekong license activate mk_abc123

🔑 Activating License...

Validating with gateway...
✓ Gateway validation passed

✅ License activated!
Tier: PRO

$ mekong license inspect

🔍 Inspecting License...

Decoded Payload:

┌─────────────────┬──────────────────────────┐
│ Claim           │ Value                    │
├─────────────────┼──────────────────────────┤
│ sub             │ user_abc123              │
│ iat             │ 2026-03-08 10:00:00 UTC  │
│ exp             │ 2026-12-31 23:59:59 UTC  │
│ Status          │ ✓ Valid (2160.5h remaining)│
│ Tier            │ PRO                      │
│ Role            │ admin                    │
│ Tenant ID       │ tenant_xyz               │
└─────────────────┴──────────────────────────┘

Features: (5)
  • premium_commands
  • ...
```

## Risks

| Risk | Mitigation |
|------|------------|
| Invalid JWT | Clear error message |
| Expired token | Show expiry status clearly |
| Secure storage fail | Fallback file storage |
