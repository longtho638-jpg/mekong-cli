import logging
import time
from typing import List, Optional

from fastapi import Depends, HTTPException, Request, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from backend.services.api_key_service import ApiKeyService
from backend.services.api_usage_tracker import usage_tracker

logger = logging.getLogger(__name__)

security = HTTPBearer()


class ApiAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware for Public API Authentication.
    Verifies Bearer token (API Key) and tracks usage.
    """

    def __init__(self, app, api_key_service: ApiKeyService):
        super().__init__(app)
        self.api_key_service = api_key_service

    async def dispatch(self, request: Request, call_next):
        # Only apply to /api/v1/* routes
        if not request.url.path.startswith("/api/v1"):
            return await call_next(request)

        # Skip docs and openapi.json
        if request.url.path in ["/api/v1/docs", "/api/v1/openapi.json"]:
            return await call_next(request)

        start_time = time.time()
        api_key_record = None

        try:
            # 1. Extract Token
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return JSONResponse(
                    status_code=401, content={"error": "Missing or invalid Authorization header"}
                )

            token = auth_header.split(" ")[1]

            # 2. Verify Token
            # This is a synchronous DB call, might be better to make verify_api_key async or run in threadpool
            # For now, assuming low latency or acceptable overhead
            api_key_record = self.api_key_service.verify_api_key(token)

            if not api_key_record:
                return JSONResponse(status_code=401, content={"error": "Invalid API Key"})

            # 3. Attach User/Key info to Request state
            request.state.api_key = api_key_record
            request.state.user_id = api_key_record["user_id"]
            request.state.scopes = api_key_record["scopes"]

            # 4. Process Request
            response = await call_next(request)

            # 5. Track Usage (Background Task)
            process_time = (time.time() - start_time) * 1000

            # We need to manually add background task because Middleware dispatch doesn't expose BackgroundTasks easily
            # However, we can use the tracking service directly since it's fire-and-forget DB insert
            # Ideally this should be truly async/background
            usage_tracker.track_request(
                api_key_id=api_key_record["id"],
                endpoint=request.url.path,
                method=request.method,
                status_code=response.status_code,
                response_time_ms=int(process_time),
                ip_address=request.client.host,
                user_agent=request.headers.get("User-Agent"),
            )

            return response

        except Exception as e:
            logger.error(f"API Auth Middleware Error: {e}")
            return JSONResponse(status_code=500, content={"error": "Internal Server Error"})


# Dependency for route protection (if needed per-route)
def require_scope(scope: str):
    def dependency(request: Request):
        if not hasattr(request.state, "scopes"):
            raise HTTPException(status_code=401, detail="Authentication required")
        if scope not in request.state.scopes:
            raise HTTPException(status_code=403, detail=f"Missing required scope: {scope}")
        return True

    return dependency


def get_current_api_key(request: Request):
    if not hasattr(request.state, "api_key"):
        raise HTTPException(status_code=401, detail="Authentication required")
    return request.state.api_key
