"""
🛡️ Immutable Audit Logging Service
==================================
Provides a tamper-proof record of all sensitive operations performed by users or agents.
Integrates with Supabase RLS for persistence and immutability.
"""

import asyncio
import functools
import inspect
import logging
import time
from datetime import datetime
from typing import Any, Dict, Optional, TypedDict

from backend.database.supabase import get_db
from fastapi import Request

logger = logging.getLogger(__name__)


class AuditLogMetadataDict(TypedDict, total=False):
    type: str
    error: str
    params: Dict[str, Any]


class AuditLogEntryDict(TypedDict):
    actor_id: str
    actor_type: str
    action: str
    resource: Optional[str]
    status: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    metadata: AuditLogMetadataDict
    created_at: str


class AuditLogger:
    """
    Service for recording immutable audit trails.
    """

    def __init__(self):
        self.db = get_db()

    async def log(
        self,
        actor_id: str,
        actor_type: str,
        action: str,
        resource: Optional[str] = None,
        status: str = "success",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[AuditLogMetadataDict] = None,
    ):
        """Records an entry in the audit log."""
        if not self.db:
            logger.warning(
                f"Audit log skipped: DB not available. Actor: {actor_id}, Action: {action}"
            )
            return

        try:
            entry: AuditLogEntryDict = {
                "actor_id": actor_id,
                "actor_type": actor_type,
                "action": action,
                "resource": resource,
                "status": status,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "metadata": metadata or {},
                "created_at": datetime.utcnow().isoformat(),
            }

            # Insert into Supabase (Append-only enforced by RLS)
            self.db.table("audit_logs").insert(entry).execute()  # type: ignore
            logger.info(
                f"🛡️ Audit Log: {actor_type}:{actor_id} performed {action} on {resource} [{status}]"
            )
        except Exception as e:
            logger.error(f"❌ Failed to write audit log: {e}")


# Global Instance
audit_logger = AuditLogger()


def audit_action(action: str, resource_template: Optional[str] = None):
    """
    Decorator for auditing FastAPI endpoints or core functions.
    Expects 'request' to be present in args for endpoints, or explicit actor info.
    """

    def decorator(func):
        if hasattr(func, "__call__"):  # Ensure it's a function

            @functools.wraps(func)
            async def async_wrapper(*args, **kwargs):
                # Try to extract actor info from FastAPI Request or TokenData
                actor_id = "system"
                actor_type = "agent"
                ip_address = None
                user_agent = None

                # Search for request in args/kwargs
                request: Optional[Request] = None
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
                if not request:
                    request = kwargs.get("request")

                if request:
                    ip_address = request.client.host
                    user_agent = request.headers.get("user-agent")
                    # Try to get user from request state (populated by RBAC/Auth middleware)
                    user = getattr(request.state, "user", None)
                    if user:
                        actor_id = getattr(user, "username", str(user))
                        actor_type = "user"

                resource = resource_template
                if resource and "{" in resource:
                    try:
                        resource = resource.format(**kwargs)
                    except:
                        pass

                try:
                    if inspect.iscoroutinefunction(func):
                        result = await func(*args, **kwargs)
                    else:
                        result = func(*args, **kwargs)

                    await audit_logger.log(
                        actor_id=actor_id,
                        actor_type=actor_type,
                        action=action,
                        resource=resource,
                        status="success",
                        ip_address=ip_address,
                        user_agent=user_agent,
                        metadata={"type": "auto_audit"},
                    )
                    return result
                except Exception as e:
                    await audit_logger.log(
                        actor_id=actor_id,
                        actor_type=actor_type,
                        action=action,
                        resource=resource,
                        status="failed",
                        ip_address=ip_address,
                        user_agent=user_agent,
                        metadata={"error": str(e), "type": "auto_audit"},
                    )
                    raise e

            return async_wrapper
        return func

    return decorator
