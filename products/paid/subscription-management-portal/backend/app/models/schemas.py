from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# Shared properties
class SubscriptionBase(BaseModel):
    plan_id: str

# Request models
class SubscriptionUpgradeRequest(SubscriptionBase):
    pass

class SubscriptionDowngradeRequest(SubscriptionBase):
    pass

class PaymentMethodRequest(BaseModel):
    payment_method_id: str

# Response models
class SubscriptionResponse(BaseModel):
    id: UUID
    stripe_subscription_id: str
    plan_id: str
    status: str
    current_period_end: datetime
    cancel_at_period_end: bool
    amount: Optional[int] = None
    currency: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: UUID
    stripe_invoice_id: str
    amount_paid: int
    currency: str
    status: str
    date: datetime
    pdf_url: Optional[str]

class PaymentMethodResponse(BaseModel):
    id: UUID
    stripe_payment_method_id: str
    brand: str
    last4: str
    exp_month: int
    exp_year: int
    is_default: bool

class MessageResponse(BaseModel):
    message: str
