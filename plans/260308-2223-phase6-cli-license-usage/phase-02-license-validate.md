---
title: "Phase 2: License Validate Command"
description: "Implement mekong license validate - validate license với RaaS Gateway"
status: pending
priority: P1
effort: 1h
branch: master
tags: [phase-2, license, cli]
created: 2026-03-08
---

# Phase 2: License Validate Command

## Overview

Implement `mekong license validate` command để validate license key với RaaS Gateway.

## Requirements

### Functional
- Validate license key format (mk_ prefix)
- Call gateway `/v1/auth/validate` endpoint
- Hiển thị validation result (valid/invalid)
- Hiển thị tenant info khi valid
- Support both JWT và mk_ API key

### Non-functional
- Timeout 10s cho gateway call
- Retry 3 attempts với exponential backoff
- Circuit breaker pattern (failover secondary gateway)

## Architecture

```
mekong license validate [KEY]
         │
         ▼
┌─────────────────────────┐
│  Format Validation      │
│  - mk_.* (8+ chars)     │
│  - JWT (3 parts)        │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  RaaSAuthClient         │
│  - validate_credentials()│
│  - Circuit Breaker      │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Gateway Response       │
│  - 200: Valid           │
│  - 401: Invalid         │
│  - 403: Revoked         │
│  - 404: Not Found       │
└─────────────────────────┘
```

## Files to Modify

- `src/commands/license_commands.py` - Thêm `validate` subcommand
- `src/core/raas_auth.py` - Đã có `validate_credentials()` method

## Implementation Steps

### Step 1: Create Validate Command

```python
# src/commands/license_commands.py

@app.command("validate")
def validate_license(
    key: Optional[str] = typer.Argument(
        None,
        help="License key (mk_...) or JWT token. If omitted, uses stored credentials.",
    ),
    gateway_url: Optional[str] = typer.Option(
        None,
        "--gateway", "-g",
        help="Gateway URL to validate against",
    ),
) -> None:
    """
    ✅ Validate license key with RaaS Gateway.

    Examples:
        mekong license validate mk_abc123...
        mekong license validate  # Uses stored credentials
        mekong license validate -g https://raas.agencyos.network
    """
    from src.core.raas_auth import get_auth_client

    console.print("[bold cyan]✅ Validating License...[/bold cyan]\n")

    client = get_auth_client(gateway_url=gateway_url)
    result = client.validate_credentials(key)

    if result.valid and result.tenant:
        console.print("[bold green]✅ Valid License![/bold green]\n")

        table = Table(show_header=True, header_style="bold green")
        table.add_column("Property", style="dim")
        table.add_column("Value", style="green")

        table.add_row("Tenant ID", result.tenant.tenant_id)
        table.add_row("Tier", result.tenant.tier.upper())
        table.add_row("Role", result.tenant.role)

        if result.tenant.license_key:
            masked = f"{result.tenant.license_key[:8]}...{result.tenant.license_key[-4:]}"
            table.add_row("License Key", masked)

        if result.tenant.expires_at:
            table.add_row(
                "Expires",
                result.tenant.expires_at.strftime("%Y-%m-%d %H:%M UTC"),
            )

        console.print(table)

        if result.tenant.features:
            console.print(f"\n[bold]Features:[/bold] ({len(result.tenant.features)})")
            for feature in result.tenant.features[:5]:
                console.print(f"  • {feature}")
    else:
        console.print("[bold red]❌ Invalid License[/bold red]\n")
        console.print(f"[red]Error:[/red] {result.error}\n")
        if result.error_code:
            console.print(f"[dim]Code: {result.error_code}[/dim]\n")
        raise typer.Exit(1)
```

### Step 2: Add Retry Logic (if not already in raas_auth.py)

```python
# src/core/retry_handler.py

import asyncio
from typing import Callable, Any
from functools import wraps

async def retry_with_backoff(
    func: Callable,
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 10.0,
    exponential_base: float = 2.0,
) -> Any:
    """
    Retry function with exponential backoff.

    Args:
        func: Async function to retry
        max_attempts: Maximum number of attempts
        base_delay: Base delay in seconds
        max_delay: Maximum delay in seconds
        exponential_base: Base for exponential calculation

    Returns:
        Result from successful function call

    Raises:
        Last exception if all attempts fail
    """
    last_exception = None

    for attempt in range(1, max_attempts + 1):
        try:
            return await func()
        except Exception as e:
            last_exception = e

            if attempt < max_attempts:
                delay = min(base_delay * (exponential_base ** (attempt - 1)), max_delay)
                await asyncio.sleep(delay)

    raise last_exception
```

## Verification Criteria

- [ ] `mekong license validate mk_xxx` chạy thành công
- [ ] Valid license → Hiển thị tenant info
- [ ] Invalid license → Error message + exit code 1
- [ ] Gateway timeout → Retry 3 lần với backoff
- [ ] Không có key → Dùng stored credentials
- [ ] `--gateway` flag override gateway URL

## Success Criteria

```
$ mekong license validate mk_abc123xyz

✅ Validating License...

✅ Valid License!

┌──────────────┬─────────────────────────┐
│ Property     │ Value                   │
├──────────────┼─────────────────────────┤
│ Tenant ID    │ tenant_abc123           │
│ Tier         │ PRO                     │
│ Role         │ admin                   │
│ License Key  │ mk_abc12...xyz          │
│ Expires      │ 2026-12-31 23:59 UTC    │
└──────────────┴─────────────────────────┘

Features: (5)
  • premium_commands
  • priority_support
  ...
```

## Risks

| Risk | Mitigation |
|------|------------|
| Gateway timeout | Retry với exponential backoff |
| Invalid format | Early validation, clear error |
| Network error | Circuit breaker failover |
