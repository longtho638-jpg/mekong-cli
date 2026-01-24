"""
Common API Schemas
==================

Shared schemas used across multiple endpoints.
"""

from typing import Any, Dict, Optional, Union

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standard error response format."""

    error: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Additional error details")
    code: Optional[str] = Field(default=None, description="Error code")


class SuccessResponse(BaseModel):
    """Standard success response format."""

    success: bool = Field(default=True, description="Operation success status")
    message: Optional[str] = Field(default=None, description="Success message")
    data: Optional[Union[Dict[str, Any], Any]] = Field(default=None, description="Response data")


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(default="healthy", description="Health status")
    version: str = Field(..., description="API version")
    environment: str = Field(..., description="Environment name")
