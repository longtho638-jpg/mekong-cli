from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from .enums import InvoiceStatus

class Invoice(BaseModel):
    id: str = Field(description="UUID")
    invoice_number: str
    amount: float
    tax: float = 0.0
    total: float
    currency: str
    status: InvoiceStatus
    service_type: Optional[str] = None  # Vietnam Tax Strategy
    stripe_invoice_id: Optional[str] = None

    # Legacy fields support
    client_name: Optional[str] = None
    deal_id: Optional[str] = None
    items: List[Dict[str, Any]] = []
    payment_method: Optional[str] = None
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    payment_url: Optional[str] = None
    created_at: Optional[datetime] = None
    notes: Optional[str] = None
    paid_date: Optional[datetime] = None  # Alias/Legacy for paid_at
