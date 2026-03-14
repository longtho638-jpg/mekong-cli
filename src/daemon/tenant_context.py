"""Tenant context propagation for daemon isolation."""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

MEKONG_DIR = Path.home() / ".mekong"
CONTEXT_FILE = MEKONG_DIR / "tenant_context.json"


@dataclass
class TenantContext:
    """Tenant and workspace context for daemon operations."""

    tenant_id: str
    workspace_id: str
    workspace_slug: str
    api_key: str = ""
    user_email: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_env(self) -> dict[str, str]:
        """Convert context to environment variables."""
        return {
            "MEKONG_TENANT_ID": self.tenant_id,
            "MEKONG_WORKSPACE_ID": self.workspace_id,
            "MEKONG_WORKSPACE_SLUG": self.workspace_slug,
            "MEKONG_API_KEY": self.api_key,
            "MEKONG_USER_EMAIL": self.user_email,
        }

    @classmethod
    def from_env(cls) -> TenantContext | None:
        """Load context from environment variables."""
        tenant_id = os.environ.get("MEKONG_TENANT_ID")
        if not tenant_id:
            return None

        return cls(
            tenant_id=tenant_id,
            workspace_id=os.environ.get("MEKONG_WORKSPACE_ID", ""),
            workspace_slug=os.environ.get("MEKONG_WORKSPACE_SLUG", ""),
            api_key=os.environ.get("MEKONG_API_KEY", ""),
            user_email=os.environ.get("MEKONG_USER_EMAIL", ""),
        )


class TenantContextManager:
    """
    Manages tenant context for daemon operations.

    Usage:
        ctx_manager = TenantContextManager()
        ctx = ctx_manager.get_context()
        env = ctx.to_env()  # Inject into worker process
    """

    def __init__(self) -> None:
        self._context: TenantContext | None = None
        MEKONG_DIR.mkdir(parents=True, exist_ok=True)
        self._load()

    def _load(self) -> None:
        """Load context from disk."""
        import json

        if CONTEXT_FILE.exists():
            try:
                data = json.loads(CONTEXT_FILE.read_text())
                self._context = TenantContext(
                    tenant_id=data.get("tenant_id", ""),
                    workspace_id=data.get("workspace_id", ""),
                    workspace_slug=data.get("workspace_slug", ""),
                    api_key=data.get("api_key", ""),
                    user_email=data.get("user_email", ""),
                    metadata=data.get("metadata", {}),
                )
                logger.info(f"[TenantContext] Loaded context for tenant {self._context.tenant_id}")
            except (json.JSONDecodeError, KeyError) as e:
                logger.warning(f"[TenantContext] Failed to load context: {e}")

    def _save(self) -> None:
        """Save context to disk."""
        import json

        if not self._context:
            if CONTEXT_FILE.exists():
                CONTEXT_FILE.unlink()
            return

        data = {
            "tenant_id": self._context.tenant_id,
            "workspace_id": self._context.workspace_id,
            "workspace_slug": self._context.workspace_slug,
            "api_key": self._context.api_key,
            "user_email": self._context.user_email,
            "metadata": self._context.metadata,
        }
        CONTEXT_FILE.write_text(json.dumps(data, indent=2))

    def set_context(
        self,
        tenant_id: str,
        workspace_id: str,
        workspace_slug: str,
        api_key: str = "",
        user_email: str = "",
        metadata: dict[str, Any] | None = None,
    ) -> TenantContext:
        """Set active tenant context."""
        self._context = TenantContext(
            tenant_id=tenant_id,
            workspace_id=workspace_id,
            workspace_slug=workspace_slug,
            api_key=api_key,
            user_email=user_email,
            metadata=metadata or {},
        )
        self._save()
        logger.info(f"[TenantContext] Set context: {workspace_slug}")
        return self._context

    def get_context(self) -> TenantContext | None:
        """Get current tenant context."""
        return self._context

    def clear_context(self) -> None:
        """Clear tenant context."""
        self._context = None
        self._save()
        logger.info("[TenantContext] Cleared context")

    def inject_to_env(self, context: TenantContext | None = None) -> dict[str, str]:
        """
        Inject tenant context into environment.

        Args:
            context: Optional context to inject (uses current if None)

        Returns:
            Environment dict with tenant context
        """
        ctx = context or self._context
        if not ctx:
            return os.environ.copy()

        env = os.environ.copy()
        env.update(ctx.to_env())
        return env


# Global context manager instance
_context_manager: TenantContextManager | None = None


def get_context_manager() -> TenantContextManager:
    """Get global tenant context manager."""
    global _context_manager
    if _context_manager is None:
        _context_manager = TenantContextManager()
    return _context_manager


def get_current_context() -> TenantContext | None:
    """Get current tenant context."""
    return get_context_manager().get_context()


def set_current_context(
    tenant_id: str,
    workspace_id: str,
    workspace_slug: str,
    api_key: str = "",
    user_email: str = "",
) -> TenantContext:
    """Set current tenant context."""
    return get_context_manager().set_context(
        tenant_id=tenant_id,
        workspace_id=workspace_id,
        workspace_slug=workspace_slug,
        api_key=api_key,
        user_email=user_email,
    )
