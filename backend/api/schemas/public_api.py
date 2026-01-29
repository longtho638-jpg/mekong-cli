from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

# --- API Keys ---


class ApiKeyCreate(BaseModel):
    name: str = Field(..., description="User-friendly name for the API key")
    scopes: List[str] = Field(default=[], description="List of permissions")


class ApiKeyResponse(BaseModel):
    id: UUID
    user_id: UUID  # Added user_id
    name: str
    prefix: str
    scopes: List[str]
    tier: str
    status: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None

    # We only return the full key once upon creation
    key: Optional[str] = None


class ApiKeyUpdate(BaseModel):
    name: Optional[str] = None
    scopes: Optional[List[str]] = None
    status: Optional[str] = None


# --- Usage ---


class ApiUsageRecord(BaseModel):
    endpoint: str
    method: str
    status_code: int
    response_time_ms: int
    created_at: datetime


class ApiUsageStats(BaseModel):
    total_requests: int
    requests_by_endpoint: Dict[str, int]
    requests_by_status: Dict[str, int]
    average_response_time_ms: float
    chart_data: List[Dict[str, Any]] = []  # [{"date": "2023-10-01", "requests": 10, "errors": 1}]


# --- Webhooks ---


class WebhookConfigCreate(BaseModel):
    url: str
    events: List[str]


class WebhookConfigResponse(BaseModel):
    id: UUID
    url: str
    events: List[str]
    status: str
    created_at: datetime
    updated_at: datetime
    # secret is usually returned once or can be retrieved? Usually retrievable.
    secret: str


class WebhookConfigUpdate(BaseModel):
    url: Optional[str] = None
    events: Optional[List[str]] = None
    status: Optional[str] = None


class WebhookDeliveryLog(BaseModel):
    id: UUID
    event_type: str
    status: str
    response_status: Optional[int]
    attempts: int
    created_at: datetime


# --- Public API Domain Models (Subscriptions, Invoices, etc.) ---


class SubscriptionPublic(BaseModel):
    id: str
    plan_id: str
    status: str
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool


class InvoicePublic(BaseModel):
    id: str
    amount_due: float
    amount_paid: float
    status: str
    currency: str
    created_at: datetime
    hosted_invoice_url: Optional[str]
