"""
Webhook-related Pydantic Schemas
=================================

Schemas for webhook payloads from external services.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class GumroadPurchase(BaseModel):
    """Gumroad purchase webhook payload."""

    email: str = Field(..., description="Customer email")
    product_id: str = Field(..., description="Product ID")
    product_name: str = Field(..., description="Product name")
    price: float = Field(..., description="Purchase price")
    currency: str = Field(default="USD", description="Currency code")
    sale_id: str = Field(..., description="Gumroad sale ID")
    license_key: Optional[str] = Field(default=None, description="License key")
    purchaser_id: Optional[str] = Field(default=None, description="Gumroad purchaser ID")
    timestamp: Optional[str] = Field(default=None, description="Purchase timestamp")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Basic email validation."""
        if "@" not in v:
            raise ValueError("Invalid email format")
        return v.lower().strip()


class PolarWebhookPayload(BaseModel):
    """Polar webhook payload (for future use)."""

    event: str = Field(..., description="Webhook event type")
    data: dict = Field(..., description="Event data")
    timestamp: datetime = Field(default_factory=datetime.now, description="Event timestamp")
