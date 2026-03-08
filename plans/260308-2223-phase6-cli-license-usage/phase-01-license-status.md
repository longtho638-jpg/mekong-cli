---
title: "Phase 1: License Status Command"
description: "Implement mekong license status - hiển thị license tier, quota, expiry"
status: pending
priority: P1
effort: 1h
branch: master
tags: [phase-1, license, cli]
created: 2026-03-08
---

# Phase 1: License Status Command

## Overview

Implement `mekong license status` command để hiển thị thông tin license hiện tại.

## Requirements

### Functional
- Hiển thị license tier (FREE/PRO/ENTERPRISE)
- Hiển thị quota limits (daily/monthly)
- Hiển thị expiry date (nếu có)
- Hiển thị enabled features
- Hiển thị gateway health status

### Non-functional
- Response time < 2s
- Fallback khi gateway offline (dùng cached session)
- Rich table output với màu sắc

## Architecture

```
mekong license status
         │
         ▼
┌─────────────────────────┐
│  RaaSAuthClient         │
│  - get_session()        │
│  - validate_credentials()│
└──────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  LicenseService         │
│  - validateSync()       │
│  - get_quota_status()   │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Rich Table Output      │
│  - Tier badge           │
│  - Quota progress bars  │
│  - Features list        │
└─────────────────────────┘
```

## Files to Modify

- `src/commands/license_commands.py` - Thêm `status` subcommand
- `src/cli/license_commands.py` - Register subcommand

## Implementation Steps

### Step 1: Create License Status Command

```python
# src/commands/license_commands.py

@app.command("status")
def license_status(
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Show detailed info"),
    json_output: bool = typer.Option(False, "--json", "-j", help="JSON output"),
) -> None:
    """
    📊 Show license status - tier, quota, expiry.

    Examples:
        mekong license status
        mekong license status -v
        mekong license status --json
    """
    from src.core.raas_auth import get_auth_client

    console.print("[bold cyan]📊 License Status[/bold cyan]\n")

    client = get_auth_client()
    session = client.get_session()

    if not session.authenticated:
        console.print("[yellow]⚠️ Not authenticated[/yellow]")
        console.print("Login: mekong auth login\n")
        raise typer.Exit(1)

    # Display license info
    table = Table(show_header=True, header_style="bold cyan")
    table.add_column("Property", style="dim")
    table.add_column("Value")

    # Tier badge
    tier_badge = {
        'free': '🔓 FREE',
        'pro': '💎 PRO',
        'enterprise': '🏢 ENTERPRISE'
    }
    table.add_row("Tier", tier_badge.get(session.tier, session.tier.upper()))
    table.add_row("Tenant ID", session.tenant_id)

    # Get quota status
    quota_status = await get_quota_status(session.tenant_id)

    for quota_type in ['daily', 'monthly']:
        used = quota_status.get(f'{quota_type}_used', 0)
        limit = quota_status.get(f'{quota_type}_limit', 0)
        pct = (used / limit * 100) if limit > 0 else 0

        table.add_row(
            f"{quota_type.capitalize()} Quota",
            f"{used:,.0f} / {limit:,.0f} ({pct:.1f}%)"
        )

    console.print(table)
```

### Step 2: Add Quota Status Helper

```python
# src/lib/raas_gate.py

async def get_quota_status(tenant_id: str) -> dict:
    """Get quota status for tenant."""
    from src.lib.usage_meter import UsageMeter

    meter = UsageMeter()
    return await meter.get_quota_status(tenant_id)
```

### Step 3: Register Command

```python
# src/cli/license_commands.py
from src.commands.license_commands import app as license_app

app.add_typer(license_app, name="license", help="📜 License management")
```

## Verification Criteria

- [ ] `mekong license status` chạy thành công
- [ ] Hiển thị đúng tier (FREE/PRO/ENTERPRISE)
- [ ] Hiển thị daily/monthly quota với %
- [ ] Fallback khi không authenticated (hiển thị warning)
- [ ] `--json` flag output JSON format
- [ ] `--verbose` flag hiển thị thêm features list

## Success Criteria

```
$ mekong license status

📊 License Status

┌─────────────────┬────────────────────────┐
│ Property        │ Value                  │
├─────────────────┼────────────────────────┤
│ Tier            │ 💎 PRO                 │
│ Tenant ID       │ tenant_abc123          │
│ Daily Quota     │ 500 / 1,000 (50.0%)    │
│ Monthly Quota   │ 8,000 / 20,000 (40.0%) │
└─────────────────┴────────────────────────┘

Features: (5)
  • premium_commands
  • priority_support
  • analytics
  • ...
```

## Risks

| Risk | Mitigation |
|------|------------|
| Gateway offline | Fallback cached session |
| No credentials | Clear error message + login instructions |
| Quota data missing | Show N/A instead of crashing |
