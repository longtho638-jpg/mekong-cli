from pydantic import BaseModel, Field
from typing import Optional
from .enums import InvoiceStatus

class Invoice(BaseModel):
    id: str = Field(description="UUID")
    invoice_number: str
    amount: float
    tax: float
    total: float
    currency: str
    status: InvoiceStatus
    service_type: Optional[str] = None  # Vietnam Tax Strategy
    stripe_invoice_id: Optional[str] = None
