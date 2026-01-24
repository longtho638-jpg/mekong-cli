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
from backend.core.security.audit import audit_logger

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
                user = verify_token(token, None)
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
                    await audit_logger.log(
                        actor_id=actor_id,
                        actor_type=actor_type,
                        action=f"{request.method}:{request.url.path}",
                        resource="api_endpoint",
                        status="success" if response.status_code < 400 else "failed",
                        ip_address=request.client.host,
                        user_agent=request.headers.get("user-agent"),
                        metadata={
                            "status_code": response.status_code,
                            "query_params": str(request.query_params)
                        }
                    )

            return response

        except Exception as e:
            # Audit unexpected failures
            actor_id = getattr(user, "username", "anonymous") if user else "anonymous"
            await audit_logger.log(
                actor_id=actor_id,
                actor_type="user" if user else "unknown",
                action=f"{request.method}:{request.url.path}",
                resource="api_endpoint",
                status="failed",
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
                metadata={"error": str(e)}
            )
            raise e
