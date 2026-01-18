"""
Vibe-related Pydantic models
"""

from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class VibeRequest(BaseModel):
    """Request to set vibe"""

    region: str = Field(..., description="Region identifier")
    location: Optional[str] = Field(default=None, description="Location name")


class VibeResponse(BaseModel):
    """Response from vibe configuration"""

    vibe: Optional[str] = Field(default=None, description="Vibe name")
    location: Optional[str] = Field(default=None, description="Location name")
    detected_vibe: Optional[str] = Field(default=None, description="Auto-detected vibe")
    config: Dict[str, Any] = Field(..., description="Vibe configuration")
