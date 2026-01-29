"""
Tenant context management.
"""

from contextvars import ContextVar
from typing import Optional

_tenant_context: ContextVar[Optional[str]] = ContextVar("tenant_id", default=None)


def set_tenant_id(tenant_id: str):
    _tenant_context.set(tenant_id)


def get_tenant_id() -> Optional[str]:
    return _tenant_context.get()
