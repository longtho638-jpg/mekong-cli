from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.types import ASGIApp


class LocaleMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        # Detect locale from Accept-Language header
        accept_language = request.headers.get('Accept-Language', 'en-US')
        # Simple parser: take the first language
        locale = accept_language.split(',')[0].strip().split(';')[0]

        # Store in request state
        request.state.locale = locale

        # Also check for 'X-Currency' header or default based on locale
        currency = request.headers.get('X-Currency', 'USD')
        request.state.currency = currency

        response = await call_next(request)

        # Optional: Add Content-Language header to response
        response.headers['Content-Language'] = locale

        return response
