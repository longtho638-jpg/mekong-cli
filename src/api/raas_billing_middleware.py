"""
RaaS API — MCU billing middleware: quota check before task execution.

FastAPI dependency that enforces MCU limits per tenant.
Raises 402 if quota exceeded. Records usage after task completes.
"""

from __future__ import annotations

from fastapi import Depends, HTTPException

from src.api.raas_auth_middleware import require_tenant
from src.api.raas_billing_service import DEFAULT_MCU_COST, get_billing_service
from src.raas.auth import TenantContext


def require_billing(
    tenant: TenantContext = Depends(require_tenant),
) -> TenantContext:
    """FastAPI dependency — checks MCU quota before allowing task execution.

    Chain after require_tenant so billing is only checked for authenticated
    tenants. Raises 402 Payment Required if quota is exhausted.

    Args:
        tenant: Resolved tenant from require_tenant dependency.

    Returns:
        The same TenantContext (pass-through for downstream handlers).

    Raises:
        HTTPException 402: Tenant MCU quota exhausted.
    """
    service = get_billing_service()
    if not service.check_quota(tenant.tenant_id):
        balance = service.get_balance(tenant.tenant_id)
        import time
        now = int(time.time())
        midnight = now - (now % 86400) + 86400
        raise HTTPException(
            status_code=402,
            detail=(
                f"MCU quota exceeded. Used {balance['mcu_used']} / "
                f"{balance['mcu_limit']} units. "
                "Upgrade your plan at https://polar.sh/mekong."
            ),
            headers={
                "X-RateLimit-Limit": str(balance["mcu_limit"]),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(midnight),
                "Retry-After": str(midnight - now),
            },
        )
    return tenant


def build_mcu_headers(tenant_id: str, mcu_cost: int) -> dict[str, str]:
    """Build MCU + standard rate-limit response headers.

    Args:
        tenant_id: Tenant whose balance to report.
        mcu_cost: Units consumed by the just-completed task.

    Returns:
        Dict of X-MCU-* and X-RateLimit-* headers ready to merge into response headers.
    """
    service = get_billing_service()
    remaining = service.record_usage(
        tenant_id=tenant_id,
        mcu_cost=mcu_cost,
        task_id="",
    )
    balance = service.get_balance(tenant_id)

    import time
    # Reset time: midnight UTC
    now = int(time.time())
    midnight = now - (now % 86400) + 86400

    headers = {
        "X-MCU-Cost": str(mcu_cost),
        "X-MCU-Remaining": str(remaining),
        "X-MCU-Limit": str(balance["mcu_limit"]),
        # Standard rate-limit headers (RFC 6585 / draft-ietf-httpapi-ratelimit-headers)
        "X-RateLimit-Limit": str(balance["mcu_limit"]),
        "X-RateLimit-Remaining": str(remaining),
        "X-RateLimit-Reset": str(midnight),
    }

    # Add overage headers if in overage
    if balance.get("in_overage"):
        headers["X-Overage-Credits"] = str(balance["overage_credits"])
        headers["X-Overage-Charges-USD"] = str(balance["overage_charges_usd"])

    return headers


def record_task_usage(tenant_id: str, task_id: str, mcu_cost: int = DEFAULT_MCU_COST) -> dict[str, str]:
    """Record MCU usage for a completed task and return headers.

    Args:
        tenant_id: Tenant whose ledger to update.
        task_id: Task identifier for audit trail.
        mcu_cost: Units consumed (defaults to DEFAULT_MCU_COST).

    Returns:
        Dict of X-MCU-* headers.
    """
    service = get_billing_service()
    remaining = service.record_usage(
        tenant_id=tenant_id,
        mcu_cost=mcu_cost,
        task_id=task_id,
    )
    balance = service.get_balance(tenant_id)
    return {
        "X-MCU-Cost": str(mcu_cost),
        "X-MCU-Remaining": str(remaining),
        "X-MCU-Limit": str(balance["mcu_limit"]),
    }


__all__ = ["require_billing", "build_mcu_headers", "record_task_usage"]
