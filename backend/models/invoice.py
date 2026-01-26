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

    def get_amount_vnd(self) -> int:
        """Calculates value in VND based on current projected rates."""
        VND_RATE = 25000.0
        if self.currency.upper() == "VND":
            return int(self.amount)
        return int(self.amount * VND_RATE)

    def is_overdue(self) -> bool:
        """Returns True if current time exceeds due date without payment."""
        if self.status == InvoiceStatus.PAID:
            return False
        if self.due_date:
            return datetime.now() > self.due_date
        return False

    def to_dict(self) -> Dict[str, Any]:
        """Provides a serializable representation (Legacy Support)."""
        return {
            "id": self.id,
            "client": self.client_name or "",
            "amount": self.amount,
            "currency": self.currency,
            "status": self.status.value,
            "dates": {
                "due": self.due_date.isoformat() if self.due_date else None,
                "paid": self.paid_at.isoformat() if self.paid_at else None,
                "created": self.created_at.isoformat() if self.created_at else None,
            },
            "amount_vnd": self.get_amount_vnd(),
            "service_type": self.service_type or "",
        }
