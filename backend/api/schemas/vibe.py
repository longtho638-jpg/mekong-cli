"""
Vibe-related Pydantic Schemas
==============================

SINGLE SOURCE OF TRUTH for Vibe request/response models.

Consolidates:
- backend/api/schemas.py (VibeRequest)
- backend/models/vibe.py (VibeRequest/VibeResponse)
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing_extensions import TypedDict


class VibeConfigDict(TypedDict):
    """Configuration for a specific vibe"""
    tone: str
    style: str
    local_words: List[str]


class VibeRequest(BaseModel):
    """Request to configure vibe settings."""

    region: str = Field(..., min_length=1, max_length=100, description="Region identifier")
    location: Optional[str] = Field(default=None, max_length=200, description="Location name")

    @field_validator("region")
    @classmethod
    def sanitize_region(cls, v: str) -> str:
        """Sanitize region input."""
        return v.strip()

    @field_validator("location")
    @classmethod
    def sanitize_location(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize location input."""
        if v:
            return v.strip()
        return v


class VibeResponse(BaseModel):
    """Response from vibe configuration."""

    vibe: Optional[str] = Field(default=None, description="Vibe name")
    location: Optional[str] = Field(default=None, description="Location name")
    detected_vibe: Optional[str] = Field(default=None, description="Auto-detected vibe")
    config: VibeConfigDict = Field(..., description="Vibe configuration")

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()}
    )
