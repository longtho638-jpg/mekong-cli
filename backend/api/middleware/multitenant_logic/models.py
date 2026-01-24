"""
Tenant models and store.
"""
import os
from typing import Any, Dict, List, Optional

from typing_extensions import TypedDict


class TenantSettingsDict(TypedDict, total=False):
    """Structured settings for a tenant"""
    status: str
    plan: str
    features: List[str]


class TenantContext:
    """Tenant context data."""

    def __init__(
        self, tenant_id: str, tenant_name: str, database_url: str, settings: Optional[TenantSettingsDict] = None
    ):
        self.tenant_id = tenant_id
        self.tenant_name = tenant_name
        self.database_url = database_url
        self.settings = settings or {}

    @property
    def is_active(self) -> bool:
        """Check if tenant is active."""
        return self.settings.get("status", "active") == "active"

    @property
    def plan(self) -> str:
        """Get tenant plan (free, pro, enterprise)."""
        return self.settings.get("plan", "free")


# In-memory tenant store (replace with database in production)
TENANT_STORE = {
    "default": TenantContext(
        tenant_id="default",
        tenant_name="Default Instance",
        database_url=os.getenv("DATABASE_URL", "sqlite:///./default.db"),
        settings={"status": "active", "plan": "free", "features": ["basic"]},
    ),
    "agencyos": TenantContext(
        tenant_id="agencyos",
        tenant_name="Agency OS Production",
        database_url=os.getenv("AGENCYOS_DB_URL", "sqlite:///./agencyos.db"),
        settings={"status": "active", "plan": "enterprise", "features": ["all"]},
    ),
    "mekong": TenantContext(
        tenant_id="mekong",
        tenant_name="Mekong CLI",
        database_url=os.getenv("MEKONG_DB_URL", "sqlite:///./mekong.db"),
        settings={"status": "active", "plan": "pro", "features": ["cli", "automation"]},
    ),
}
