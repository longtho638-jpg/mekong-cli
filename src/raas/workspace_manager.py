"""Workspace Manager — Multi-tenant workspace isolation."""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .workspace_repository import Workspace, WorkspaceRepository

logger = logging.getLogger(__name__)

MEKONG_ROOT = Path(__file__).parent.parent.parent
MEKONG_DIR = MEKONG_ROOT / ".mekong"


@dataclass
class WorkspaceContext:
    """Current workspace context."""

    workspace_id: str
    workspace_slug: str
    tenant_id: str
    workspace_name: str
    config: dict[str, Any] = field(default_factory=dict)


class WorkspaceManager:
    """
    Manages workspace context switching and isolation.

    Usage:
        manager = WorkspaceManager()
        manager.switch_workspace("my-project")
        context = manager.get_current_context()
        config = manager.get_workspace_config(context.workspace_id)
    """

    def __init__(self, repository: WorkspaceRepository | None = None) -> None:
        self.repo = repository or WorkspaceRepository()
        self._context: WorkspaceContext | None = None
        self._context_file = MEKONG_DIR / "active_workspace.json"

        # Ensure mekong directory exists
        MEKONG_DIR.mkdir(parents=True, exist_ok=True)

        # Load active workspace from disk
        self._load_context()

    def _load_context(self) -> None:
        """Load active workspace context from disk."""
        import json

        if self._context_file.exists():
            try:
                data = json.loads(self._context_file.read_text())
                self._context = WorkspaceContext(
                    workspace_id=data.get("workspace_id", ""),
                    workspace_slug=data.get("workspace_slug", ""),
                    tenant_id=data.get("tenant_id", ""),
                    workspace_name=data.get("workspace_name", ""),
                    config=data.get("config", {}),
                )
                logger.info(f"[WorkspaceManager] Loaded context: {self._context.workspace_slug}")
            except (json.JSONDecodeError, KeyError) as e:
                logger.warning(f"[WorkspaceManager] Failed to load context: {e}")

    def _save_context(self) -> None:
        """Save active workspace context to disk."""
        import json

        if not self._context:
            if self._context_file.exists():
                self._context_file.unlink()
            return

        data = {
            "workspace_id": self._context.workspace_id,
            "workspace_slug": self._context.workspace_slug,
            "tenant_id": self._context.tenant_id,
            "workspace_name": self._context.workspace_name,
            "config": self._context.config,
        }
        self._context_file.write_text(json.dumps(data, indent=2))

    def switch_workspace(self, slug: str) -> WorkspaceContext:
        """
        Switch to a different workspace.

        Args:
            slug: Workspace slug to switch to

        Returns:
            New WorkspaceContext

        Raises:
            ValueError: If workspace not found
        """
        workspace = self.repo.get_by_slug(slug)
        if not workspace:
            raise ValueError(f"Workspace '{slug}' not found")

        self._context = WorkspaceContext(
            workspace_id=workspace.id,
            workspace_slug=workspace.slug,
            tenant_id=workspace.tenant_id,
            workspace_name=workspace.name,
            config=workspace.config,
        )
        self._save_context()

        logger.info(f"[WorkspaceManager] Switched to workspace: {slug}")
        return self._context

    def get_current_context(self) -> WorkspaceContext | None:
        """Get current workspace context."""
        return self._context

    def get_or_create_default(self, tenant_id: str) -> WorkspaceContext:
        """Get default workspace or create if not exists."""
        # Try to get existing default
        if self._context and self._context.tenant_id == tenant_id:
            return self._context

        # List tenant's workspaces
        workspaces = self.repo.list_by_tenant(tenant_id)
        if workspaces:
            # Use first active workspace
            for ws in workspaces:
                if ws.is_active:
                    return self.switch_workspace(ws.slug)

        # Create default workspace
        slug = "default"
        self.repo.create(
            tenant_id=tenant_id,
            name="Default Workspace",
            slug=slug,
            config={},
        )
        return self.switch_workspace(slug)

    def create_workspace(
        self,
        tenant_id: str,
        name: str,
        slug: str,
        config: dict[str, Any] | None = None,
    ) -> Workspace:
        """Create a new workspace."""
        return self.repo.create(tenant_id, name, slug, config or {})

    def list_workspaces(self, tenant_id: str) -> list[Workspace]:
        """List all workspaces for a tenant."""
        return self.repo.list_by_tenant(tenant_id)

    def get_workspace_config(self, workspace_id: str) -> dict[str, Any]:
        """Get workspace configuration."""
        workspace = self.repo.get_by_id(workspace_id)
        return workspace.config if workspace else {}

    def update_workspace_config(
        self, workspace_id: str, config: dict[str, Any]
    ) -> Workspace | None:
        """Update workspace configuration."""
        return self.repo.update(workspace_id, config=config)

    def get_state(self, workspace_id: str, key: str) -> Any | None:
        """Get workspace state value."""
        return self.repo.get_state(workspace_id, key)

    def set_state(self, workspace_id: str, key: str, value: Any) -> None:
        """Set workspace state value."""
        self.repo.set_state(workspace_id, key, value)

    def add_member(
        self, workspace_id: str, user_email: str, role: str = "member"
    ) -> bool:
        """Add a member to a workspace."""
        return self.repo.add_member(workspace_id, user_email, role)

    def remove_member(self, workspace_id: str, user_email: str) -> bool:
        """Remove a member from a workspace."""
        return self.repo.remove_member(workspace_id, user_email)

    def list_members(self, workspace_id: str) -> list:
        """List workspace members."""
        return self.repo.list_members(workspace_id)

    def get_member_role(self, workspace_id: str, user_email: str) -> str | None:
        """Get member's role."""
        return self.repo.get_member_role(workspace_id, user_email)

    def inject_env(self, env: dict[str, str] | None = None) -> dict[str, str]:
        """
        Inject workspace context into environment variables.

        Args:
            env: Optional base environment dict

        Returns:
            Environment dict with workspace context
        """
        result = env or os.environ.copy()

        if self._context:
            result["MEKONG_WORKSPACE_ID"] = self._context.workspace_id
            result["MEKONG_WORKSPACE_SLUG"] = self._context.workspace_slug
            result["MEKONG_TENANT_ID"] = self._context.tenant_id
            result["MEKONG_WORKSPACE_NAME"] = self._context.workspace_name

        return result

    def clear_context(self) -> None:
        """Clear active workspace context."""
        self._context = None
        self._save_context()
        logger.info("[WorkspaceManager] Cleared workspace context")
