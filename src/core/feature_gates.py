"""
Feature Gates — JWT-based Feature Entitlement Enforcement

Features:
- Parse JWT claims for feature entitlements
- @require_feature decorator for command gating
- Feature registry with descriptions
- Integration with raas_auth.py TenantContext
"""

from __future__ import annotations

from functools import wraps
from typing import List, Callable, Dict, Any
import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from src.core.raas_auth import get_auth_client

console = Console()

# Feature registry with descriptions
FEATURE_REGISTRY: Dict[str, Dict[str, str]] = {
    "cli_commands": {
        "name": "CLI Commands",
        "description": "Basic CLI access",
    },
    "advanced_agents": {
        "name": "Advanced Agents",
        "description": "Premium agent access (Planner, Developer, etc.)",
    },
    "gateway_integration": {
        "name": "Gateway Integration",
        "description": "RaaS Gateway sync and telemetry",
    },
    "enterprise_features": {
        "name": "Enterprise",
        "description": "Enterprise-only features (SSO, custom limits)",
    },
    "kv_store_sync": {
        "name": "KV Store Sync",
        "description": "Rate limit state synchronization",
    },
    "real_time_entitlements": {
        "name": "Real-time Entitlements",
        "description": "Live usage cap enforcement",
    },
}


class FeatureGateError(Exception):
    """Raised when feature access is denied."""

    def __init__(self, feature: str, tier: str):
        self.feature = feature
        self.tier = tier
        super().__init__(
            f"Feature '{feature}' requires higher tier (current: {tier})"
        )


def get_enabled_features() -> List[str]:
    """
    Get list of enabled features from current JWT.

    Returns:
        List of enabled feature IDs
    """
    auth_client = get_auth_client()
    tenant = auth_client.get_tenant_context()

    if not tenant:
        # Try to get from session
        session = auth_client.get_session()
        if session.authenticated:
            # Re-validate to get tenant context
            creds = auth_client._load_credentials()
            token = creds.get("token")
            if token:
                result = auth_client.validate_credentials(token)
                if result.valid and result.tenant:
                    return result.tenant.features or []
        return []

    return tenant.features or []


def has_feature(feature: str) -> bool:
    """
    Check if user has specific feature enabled.

    Args:
        feature: Feature ID to check

    Returns:
        True if feature is enabled
    """
    enabled = get_enabled_features()

    # "all_features" grants access to everything
    if "all_features" in enabled:
        return True

    return feature in enabled


def require_feature(feature: str) -> Callable:
    """
    Decorator for requiring specific features.

    Usage:
        @app.command()
        @require_feature("advanced_agents")
        def premium_command():
            ...

    Args:
        feature: Feature ID required

    Returns:
        Decorator function
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            if not has_feature(feature):
                auth_client = get_auth_client()
                tenant = auth_client.get_tenant_context()
                tier = tenant.tier if tenant else "free"

                console.print(
                    f"[bold red]✗ Feature Required: {feature}[/bold red]"
                )
                console.print(f"[dim]Current tier: {tier}[/dim]")
                console.print(
                    "[yellow]Upgrade at: https://raas.agencyos.network[/yellow]"
                )
                raise typer.Exit(code=1)

            return func(*args, **kwargs)

        return wrapper

    return decorator


def show_features_status() -> None:
    """Display feature status table."""
    auth_client = get_auth_client()
    session = auth_client.get_session()

    # Get enabled features
    enabled = get_enabled_features()

    # Build table
    table = Table(title="🔑 Feature Status", show_header=True)
    table.add_column("Feature", style="cyan")
    table.add_column("Description", style="white")
    table.add_column("Status", style="green")

    for feature_id, info in FEATURE_REGISTRY.items():
        is_enabled = feature_id in enabled or "all_features" in enabled
        status = "✓ Enabled" if is_enabled else "✗ Locked"
        status_style = "green" if is_enabled else "dim"

        table.add_row(
            info["name"],
            info["description"],
            f"[{status_style}]{status}[/{status_style}]",
        )

    console.print(table)

    # Show tier info
    tier = session.tier if session.authenticated else "free"
    tenant_id = session.tenant_id if session.authenticated else "anonymous"

    console.print(
        Panel(
            f"[dim]Tier: {tier.upper()} | Tenant: {tenant_id}[/dim]"
        )
    )


__all__ = [
    "FEATURE_REGISTRY",
    "FeatureGateError",
    "get_enabled_features",
    "has_feature",
    "require_feature",
    "show_features_status",
]
