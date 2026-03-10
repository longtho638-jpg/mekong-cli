"""
Permission Registry — Command-level Permission Mapping

Features:
- Map commands to required permissions
- Permission hierarchy (read < write < admin)
- Integration with startup validation
- Tier-based access control
"""

from __future__ import annotations

from enum import Enum
from typing import Dict, Optional
from dataclasses import dataclass


class Permission(Enum):
    """Command permissions."""

    READ = "read"  # Read-only operations
    EXECUTE = "execute"  # Execute commands
    WRITE = "write"  # Modify resources
    ADMIN = "admin"  # Administrative operations


@dataclass
class CommandPermission:
    """Permission requirement for a command."""

    command: str
    permission: Permission
    description: str


# Command to permission mapping
# None = free command (no permission required)
COMMAND_PERMISSIONS: Dict[str, Optional[Permission]] = {
    # FREE_COMMANDS (no permission required)
    "init": None,
    "version": None,
    "help": None,
    "status": None,
    "config": None,
    "doctor": None,
    "clean": None,
    "test": None,
    "analytics": None,
    "telemetry": None,
    "dashboard": None,
    "update": None,
    "raas-auth": None,
    "auth": None,
    "validate-license": None,
    "license-status": None,
    "check-phases": None,
    "complete-phase6": None,
    "health": None,
    "raas-debug-export": None,
    "features": None,
    "permissions": None,
    "entitlement": None,
    "kv-sync": None,
    "kv-status": None,
    # READ permissions
    "list": Permission.READ,
    "search": Permission.READ,
    "plan": Permission.READ,
    "show": Permission.READ,
    "license:status": Permission.READ,
    "license:usage": Permission.READ,
    "license:report": Permission.READ,
    "license:tiers": Permission.READ,
    # EXECUTE permissions (default for most commands)
    "cook": Permission.EXECUTE,
    "run": Permission.EXECUTE,
    "agent": Permission.EXECUTE,
    "license:validate": Permission.EXECUTE,
    "sync": Permission.EXECUTE,
    # WRITE permissions
    "license:generate": Permission.WRITE,
    "license:revoke": Permission.WRITE,
    "license:reset": Permission.WRITE,
    "tier-admin:create": Permission.WRITE,
    "tier-admin:update": Permission.WRITE,
    "sync:reset": Permission.WRITE,
    # ADMIN permissions
    "license-admin": Permission.ADMIN,
    "tier-admin": Permission.ADMIN,
    "tier-admin:delete": Permission.ADMIN,
    "security-cmd": Permission.ADMIN,
    "security": Permission.ADMIN,
    "compliance": Permission.ADMIN,
    "billing": Permission.ADMIN,
    "roi": Permission.ADMIN,
}


class PermissionRegistry:
    """Registry for command permissions."""

    # Tier hierarchy: free < trial < pro < enterprise
    TIER_PERMISSIONS = {
        "free": {Permission.READ},
        "trial": {Permission.READ, Permission.EXECUTE},
        "pro": {Permission.READ, Permission.EXECUTE, Permission.WRITE},
        "enterprise": {
            Permission.READ,
            Permission.EXECUTE,
            Permission.WRITE,
            Permission.ADMIN,
        },
    }

    def __init__(self):
        self._permissions: Dict[str, Optional[Permission]] = (
            COMMAND_PERMISSIONS.copy()
        )

    def get_permission(self, command: str) -> Optional[Permission]:
        """Get required permission for command."""
        return self._permissions.get(command)

    def register_command(self, command: str, permission: Permission) -> None:
        """Register a command with its permission."""
        self._permissions[command] = permission

    def is_free_command(self, command: str) -> bool:
        """Check if command is free (no permission required)."""
        return self._permissions.get(command) is None

    def check_permission(self, command: str, user_tier: str) -> bool:
        """
        Check if user tier has required permission.

        Args:
            command: Command to check
            user_tier: User's tier (free/trial/pro/enterprise)

        Returns:
            True if user has permission
        """
        permission = self.get_permission(command)

        # Free command - no permission required
        if permission is None:
            return True

        # Get allowed permissions for tier
        allowed = self.TIER_PERMISSIONS.get(user_tier, set())

        return permission in allowed

    def get_tier_commands(self, tier: str) -> Dict[str, bool]:
        """
        Get all commands and their availability for a tier.

        Args:
            tier: Tier to check

        Returns:
            Dict mapping command -> available (bool)
        """
        allowed = self.TIER_PERMISSIONS.get(tier, set())
        result = {}

        for command, permission in self._permissions.items():
            if permission is None:
                result[command] = True  # Free command
            else:
                result[command] = permission in allowed

        return result


# Global instance
_registry: Optional[PermissionRegistry] = None


def get_registry() -> PermissionRegistry:
    """Get global permission registry."""
    global _registry
    if _registry is None:
        _registry = PermissionRegistry()
    return _registry


def show_permissions_status() -> None:
    """Display permission status and tier limits."""
    from rich.console import Console
    from rich.table import Table

    console = Console()
    registry = get_registry()

    # Get current tier
    from src.core.raas_auth import get_auth_client

    auth_client = get_auth_client()
    session = auth_client.get_session()
    tier = session.tier if session.authenticated else "free"

    # Build table
    table = Table(title="🔐 Permission Status", show_header=True)
    table.add_column("Permission", style="cyan")
    table.add_column("Commands", style="white")
    table.add_column("Your Access", style="green")

    # Group commands by permission level
    perm_commands: Dict[Optional[Permission], list] = {}
    for cmd, perm in COMMAND_PERMISSIONS.items():
        if perm not in perm_commands:
            perm_commands[perm] = []
        perm_commands[perm].append(cmd)

    # Display by permission level
    for perm in [None, Permission.READ, Permission.EXECUTE, Permission.WRITE, Permission.ADMIN]:
        commands = perm_commands.get(perm, [])
        if not commands:
            continue

        has_access = registry.check_permission(commands[0] if commands else "", tier)
        access_str = "✓ Granted" if has_access else "✗ Denied"
        access_style = "green" if has_access else "red"

        perm_name = perm.value.upper() if perm else "FREE"
        table.add_row(
            perm_name,
            f"{len(commands)} commands",
            f"[{access_style}]{access_str}[/{access_style}]",
        )

    console.print(table)
    console.print(f"\n[dim]Current tier: {tier.upper()}[/dim]")

    # Show tier capabilities
    console.print("\n[bold]Tier Capabilities:[/bold]")
    allowed = registry.TIER_PERMISSIONS.get(tier, set())
    capabilities = []
    if Permission.READ in allowed:
        capabilities.append("Read")
    if Permission.EXECUTE in allowed:
        capabilities.append("Execute")
    if Permission.WRITE in allowed:
        capabilities.append("Write")
    if Permission.ADMIN in allowed:
        capabilities.append("Admin")

    console.print(f"  [dim]→ {', '.join(capabilities) if capabilities else 'None'}[/dim]")


__all__ = [
    "Permission",
    "CommandPermission",
    "COMMAND_PERMISSIONS",
    "PermissionRegistry",
    "get_registry",
    "show_permissions_status",
]
