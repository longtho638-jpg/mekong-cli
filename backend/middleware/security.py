"""
🛡️ Security Middleware
=======================
Handles user identification, RBAC context population, and automated request auditing.
"""

import logging

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from backend.api.auth.utils import TokenData, verify_token
from backend.core.audit_logger import audit_logger
from backend.db.session import SessionLocal

logger = logging.getLogger(__name__)


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle security context and auditing.
    """

    async def dispatch(self, request: Request, call_next):
        # 1. Identify User from Bearer Token
        auth_header = request.headers.get("Authorization")
        user = None

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
            try:
                # We use the existing verify_token logic
                user = await verify_token(token, None)
                request.state.user = user
            except Exception:
                # Invalid token, but we let it pass to allow public routes
                # RBAC dependencies will block if a role is required
                pass

        # 2. Process Request
        try:
            response = await call_next(request)

            # 3. Automated Auditing for sensitive methods (POST, PUT, DELETE, PATCH)
            if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
                # We don't audit auth/token requests to avoid logging passwords (even if sanitized)
                if "/token" not in request.url.path:
                    actor_id = getattr(user, "username", "anonymous") if user else "anonymous"
                    actor_type = "user" if user else "unknown"

                    # Record in background
                    # Use a fresh session for the audit log
                    db = SessionLocal()
                    try:
                        await audit_logger.log_event(
                            db=db,
                            action=f"{request.method}:{request.url.path}",
                            user_id=actor_id,
                            resource_type="api_endpoint",
                            metadata={
                                "status_code": response.status_code,
                                "query_params": str(request.query_params),
                                "actor_type": actor_type,
                            },
                            ip_address=request.client.host,
                            user_agent=request.headers.get("user-agent"),
                        )
                    except Exception as log_error:
                        logger.error(f"Audit logging failed: {log_error}")
                    finally:
                        db.close()

            return response

        except Exception as e:
            # Audit unexpected failures
            actor_id = getattr(user, "username", "anonymous") if user else "anonymous"

            db = SessionLocal()
            try:
                await audit_logger.log_event(
                    db=db,
                    action=f"{request.method}:{request.url.path}",
                    user_id=actor_id,
                    resource_type="api_endpoint",
                    metadata={
                        "error": str(e),
                        "status": "failed",
                        "actor_type": "user" if user else "unknown",
                    },
                    ip_address=request.client.host,
                    user_agent=request.headers.get("user-agent"),
                )
            except Exception as log_error:
                logger.error(f"Audit logging failed: {log_error}")
            finally:
                db.close()

            raise e
