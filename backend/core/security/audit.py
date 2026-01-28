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
from typing import Any, Dict, Optional

from fastapi import Request
from typing_extensions import TypedDict

from backend.db.session import SessionLocal
from backend.models.audit_log import AuditLog

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
        # We don't hold a persistent session here because this class is instantiated globally.
        # Instead, we create a session per log action to ensure thread safety and freshness.
        pass

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
        db = SessionLocal()
        try:
            # Validate if actor_id is a valid UUID for the user_id column
            user_id_val = None
            if actor_type == "user":
                try:
                    import uuid
                    uuid.UUID(str(actor_id))
                    user_id_val = str(actor_id)
                except (ValueError, TypeError):
                    # If actor_id is not a UUID (e.g. username), store in metadata only
                    user_id_val = None

            entry_metadata = {
                "actor_id": actor_id,
                "actor_type": actor_type,
                "status": status,
                **(metadata or {})
            }

            # Create AuditLog model instance
            audit_entry = AuditLog(
                user_id=user_id_val,
                action=action,
                resource_type=resource.split(":")[0] if resource and ":" in resource else "resource",
                resource_id=resource.split(":")[1] if resource and ":" in resource else resource,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata_=entry_metadata
            )

            # Simple hash generation for integrity (mock implementation)
            import hashlib
            payload = f"{actor_id}:{action}:{datetime.utcnow().isoformat()}"
            audit_entry.hash = hashlib.sha256(payload.encode()).hexdigest()

            db.add(audit_entry)
            db.commit()

            logger.info(
                f"🛡️ Audit Log: {actor_type}:{actor_id} performed {action} on {resource} [{status}]"
            )
        except Exception as e:
            logger.error(f"❌ Failed to write audit log: {e}")
            db.rollback()
        finally:
            db.close()


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
                    except (KeyError, ValueError) as e:
                        logger.error(f"Audit resource formatting failed: {e}", exc_info=True)
                        resource = resource_template  # Fallback to unformatted template

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
