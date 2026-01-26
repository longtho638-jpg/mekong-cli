from typing import List, Optional, Dict, Any
from pydantic import BaseModel, HttpUrl
from datetime import datetime

# Shared properties
class WebhookEndpointBase(BaseModel):
    url: HttpUrl
    description: Optional[str] = None
    event_types: List[str]
    is_active: bool = True

# Properties to receive on creation
class WebhookEndpointCreate(WebhookEndpointBase):
    pass

# Properties to receive on update
class WebhookEndpointUpdate(WebhookEndpointBase):
    url: Optional[HttpUrl] = None
    event_types: Optional[List[str]] = None
    is_active: Optional[bool] = None

# Properties shared by models stored in DB
class WebhookEndpointInDBBase(WebhookEndpointBase):
    id: int
    secret: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Properties to return to client
class WebhookEndpoint(WebhookEndpointInDBBase):
    pass

# Webhook Event
class WebhookEventBase(BaseModel):
    event_type: str
    payload: Dict[str, Any]

class WebhookEventCreate(WebhookEventBase):
    pass

class WebhookEvent(WebhookEventBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Webhook Delivery
class WebhookDeliveryBase(BaseModel):
    endpoint_id: int
    event_id: Optional[int] = None
    url: str
    request_headers: Optional[Dict[str, Any]] = None
    request_body: Optional[Dict[str, Any]] = None
    response_status_code: Optional[int] = None
    response_body: Optional[str] = None
    duration_ms: Optional[int] = None
    success: bool
    attempt: int
    error_message: Optional[str] = None

class WebhookDelivery(WebhookDeliveryBase):
    id: int
    created_at: datetime
    next_retry_at: Optional[datetime] = None

    class Config:
        from_attributes = True
