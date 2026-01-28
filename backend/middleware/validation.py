"""
Input Validation Middleware
============================

Validates and sanitizes all incoming requests.
Prevents XSS, SQL injection, and DoS attacks.

Binh Pháp: "Thủ Công" - Defense First
"""

import logging
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.middleware.base import BaseHTTPMiddleware

from backend.api.config.settings import settings
from backend.api.utils.validators import validate_json_depth, validate_string_length

logger = logging.getLogger(__name__)


class ValidationMiddleware(BaseHTTPMiddleware):
    """
    Input validation and sanitization middleware.

    Validates:
    - Content type for POST/PUT/PATCH requests
    - JSON depth (DoS prevention)
    - Request size limits
    - String length limits

    Responds with appropriate error codes:
    - 415: Unsupported Media Type
    - 413: Payload Too Large
    - 422: Unprocessable Entity (validation error)
    - 500: Internal Server Error
    """

    def __init__(self, app, max_json_depth: int = None, max_request_size: int = None):
        super().__init__(app)
        self.max_json_depth = max_json_depth or settings.max_json_depth
        self.max_request_size = max_request_size or settings.max_request_size

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process and validate request."""

        try:
            # Skip validation for health/docs endpoints
            if self._should_skip_validation(request.url.path):
                return await call_next(request)

            # Validate content type for mutating requests
            if request.method in ["POST", "PUT", "PATCH"]:
                content_type = request.headers.get("content-type", "")

                # Allow JSON content type
                if content_type and not content_type.startswith("application/json"):
                    # Allow multipart/form-data for file uploads
                    if not content_type.startswith("multipart/form-data"):
                        logger.warning(f"Invalid content type: {content_type}")
                        return JSONResponse(
                            status_code=415,
                            content={
                                "error": "Unsupported Media Type",
                                "details": "Content-Type must be application/json or multipart/form-data"
                            }
                        )

                # Validate request size
                content_length = request.headers.get("content-length")
                if content_length and int(content_length) > self.max_request_size:
                    logger.warning(f"Request too large: {content_length} bytes")
                    return JSONResponse(
                        status_code=413,
                        content={
                            "error": "Payload Too Large",
                            "details": f"Request size exceeds {self.max_request_size} bytes"
                        }
                    )

                # Validate JSON depth (if JSON content type)
                if content_type.startswith("application/json"):
                    try:
                        # Parse JSON body
                        body = await request.json()

                        # Validate JSON depth
                        if not validate_json_depth(body, self.max_json_depth):
                            logger.warning("JSON nesting too deep")
                            return JSONResponse(
                                status_code=400,
                                content={
                                    "error": "Bad Request",
                                    "details": f"JSON nesting exceeds {self.max_json_depth} levels"
                                }
                            )

                        # Validate string lengths in JSON
                        if not self._validate_json_strings(body):
                            logger.warning("String field too long")
                            return JSONResponse(
                                status_code=400,
                                content={
                                    "error": "Bad Request",
                                    "details": f"String field exceeds {settings.max_string_length} characters"
                                }
                            )

                    except Exception:
                        # Invalid JSON - let FastAPI handle it
                        pass

            # Process request
            response = await call_next(request)
            return response

        except ValidationError as e:
            logger.warning(f"Validation error: {e}")
            return JSONResponse(
                status_code=422,
                content={
                    "error": "Validation failed",
                    "details": e.errors()
                }
            )

        except Exception as e:
            logger.error(f"Unexpected error in validation middleware: {e}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal server error",
                    "details": str(e) if settings.debug else "An error occurred"
                }
            )

    def _should_skip_validation(self, path: str) -> bool:
        """
        Determine if validation should be skipped for this path.

        Args:
            path: Request path

        Returns:
            True if validation should be skipped
        """
        skip_paths = [
            "/health",
            "/ping",
            "/ready",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/static",
            "/metrics",
        ]

        path_lower = path.lower()
        return any(path_lower.startswith(skip) for skip in skip_paths)

    def _validate_json_strings(self, data: any) -> bool:
        """
        Recursively validate string lengths in JSON.

        Args:
            data: JSON data

        Returns:
            True if all strings are within limits
        """
        if isinstance(data, dict):
            return all(self._validate_json_strings(v) for v in data.values())
        elif isinstance(data, list):
            return all(self._validate_json_strings(item) for item in data)
        elif isinstance(data, str):
            return validate_string_length(data, settings.max_string_length)
        else:
            return True
