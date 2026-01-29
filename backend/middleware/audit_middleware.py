"""
Audit Middleware
================

Automatically captures and logs all API requests to the audit trail.
Extracts user context, session info, and request details.
"""

import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from backend.db.session import SessionLocal
from backend.services.audit_service import audit_service


class AuditMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate Request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        start_time = time.time()

        # Proceed with request
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            status_code = 500
            raise e
        finally:
            process_time = time.time() - start_time

            # Skip auditing for health checks and read-only GET requests if desired
            # But requirement says "User Action Audit Logging" including reads
            # We will log everything for now, or filter by path

            if request.url.path in ["/health", "/metrics", "/docs", "/openapi.json"]:
                return response

            # Extract User Context
            user = getattr(request.state, "user", None)
            user_id = str(user.id) if user else None

            # Determine Action
            method = request.method
            path = request.url.path
            action = f"api.{method.lower()}"

            # Determine Resource
            # Simple heuristic mapping
            resource_type = "api_endpoint"
            parts = path.strip("/").split("/")
            if len(parts) > 1:
                resource_type = parts[1]  # e.g. /api/users -> users

            # Extract Metadata
            metadata = {
                "method": method,
                "path": path,
                "status_code": status_code,
                "process_time_ms": round(process_time * 1000, 2),
                "query_params": str(request.query_params),
            }

            # Async fire-and-forget logging to avoid blocking response?
            # Ideally yes, but here we do synchronous DB write for safety/consistency in this scope
            # In high-throughput, push to queue (Kafka/Redis)

            try:
                db = SessionLocal()
                await audit_service.create_audit_log(
                    db=db,
                    action=action,
                    user_id=user_id,
                    resource_type=resource_type,
                    resource_id=None,  # Hard to extract generic ID from path without router context
                    ip_address=request.client.host,
                    user_agent=request.headers.get("user-agent"),
                    session_id=None,  # Add logic if session tracking exists
                    request_id=request_id,
                    metadata=metadata,
                )
                db.close()
            except Exception as e:
                # Fallback logging if DB fails
                print(f"Failed to write audit log: {e}")

        return response
