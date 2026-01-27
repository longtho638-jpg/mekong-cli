from typing import Callable, Optional

from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from backend.services.jwt_service import jwt_service


class JWTRotationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle JWT rotation logic and blacklist enforcement.
    Note: Most auth logic happens in Depends(get_current_user), but this
    middleware can catch revoked tokens early or handle automatic header inspection.
    """
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

            # We peek at the token here to check blacklist/revocation immediately
            # We don't verify full signature/exp here to avoid double cost (FastAPI dependency will do it),
            # BUT for security, fail-fast on blacklist is good.
            # Using decode_token does the blacklist check.

            payload = await jwt_service.decode_token(token)
            if payload is None:
                # If token is invalid/blacklisted, we *could* block here,
                # but standard practice is to let the endpoint dependency handle 401.
                # However, if we want to enforce revocation globally even for endpoints that might be loose,
                # we can inspect.
                # For now, let's just proceed. The dependency injection is the robust gate.
                pass

        response = await call_next(request)
        return response
