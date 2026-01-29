"""
Webhook Schemas and Data Models.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, Json


class WebhookProvider(str, Enum):
    STRIPE = "stripe"
    PAYPAL = "paypal"
    GITHUB = "github"
    GUMROAD = "gumroad"
    CUSTOM = "custom"


class WebhookStatus(str, Enum):
    PENDING = "pending"
    PROCESSED = "processed"
    FAILED = "failed"
    IGNORED = "ignored"


class DeliveryStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"


# Incoming Event Model
class WebhookEventCreate(BaseModel):
    provider: WebhookProvider
    event_id: str
    event_type: str
    payload: Dict[str, Any]
    headers: Optional[Dict[str, Any]] = None


class WebhookEvent(WebhookEventCreate):
    id: UUID
    status: WebhookStatus
    error_message: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Outgoing Endpoint Model
class WebhookEndpointCreate(BaseModel):
    url: str
    description: Optional[str] = None
    secret: str
    event_types: List[str] = ["*"]


class WebhookEndpoint(WebhookEndpointCreate):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Outgoing Delivery Model
class WebhookDelivery(BaseModel):
    id: UUID
    endpoint_id: UUID = Field(..., alias="webhook_config_id")
    event_type: str
    payload: Dict[str, Any]
    status: DeliveryStatus
    response_status: Optional[int] = None
    response_body: Optional[str] = None
    attempt_count: int
    next_retry_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# Gumroad Legacy Support
class GumroadPurchase(BaseModel):
    """Gumroad purchase payload."""

    email: str
    product_id: str
    product_name: str
    price: float
    currency: str
    sale_id: str
    license_key: Optional[str] = None
    purchaser_id: Optional[str] = None
    custom_fields: Optional[dict] = None


class AffiliateReferral(BaseModel):
    """Affiliate referral record."""

    id: str
    affiliate_code: str
    sale_id: str
    customer_email: str
    product_id: str
    product_name: str
    purchase_amount: float
    commission_rate: float
    commission_amount: float
    status: str
    created_at: str
    paid_at: Optional[str] = None
