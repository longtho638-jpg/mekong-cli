"""
Tenant resolution logic.
"""
from fastapi import HTTPException, Request


def resolve_tenant_id(request: Request) -> str:
    # Try header
    tenant_id = request.headers.get("X-Tenant-ID")
    if tenant_id: return tenant_id

    # Try query param
    tenant_id = request.query_params.get("tenant_id")
    if tenant_id: return tenant_id

    # Fallback to default for dev
    return "default"
