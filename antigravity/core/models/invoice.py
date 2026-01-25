"""
💰 Invoice Models - Revenue Tracking
====================================

Defines the data entities for financial transactions and forecasting.
Enables multi-currency billing and revenue performance analysis.

Hierarchy:
- InvoiceStatus: Payment lifecycle states.
- Invoice: Transaction record.
- Forecast: Revenue projection.

Binh Pháp: 💰 Tài (Wealth) - Securing the harvest.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, Optional

from typing_extensions import TypedDict

# Standard 2026 Rate
VND_RATE = 25000.0


class InvoiceDatesDict(TypedDict):
    due: str
    paid: Optional[str]
    created: str


class InvoiceDict(TypedDict):
    """Dictionary representation of an invoice"""
    id: Optional[int]
    client: str
    amount: float
    currency: str
    status: str
    dates: InvoiceDatesDict
    amount_vnd: int
    service_type: str  # Vietnam Tax Strategy 2026


class ForecastDict(TypedDict):
    """Dictionary representation of a forecast"""
    month: str
    projected: float
    actual: float
    confidence: float
    variance: float
    variance_pct: float


class InvoiceStatus(Enum):
    """Payment lifecycle states."""

    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


@dataclass
class Invoice:
    """
    🧾 Client Invoice

    Captures a single billing event. Supports automated VND conversion
    and health monitoring (overdue status).
    """

    id: Optional[int] = None
    client_name: str = ""
    amount: float = 0.0
    currency: str = "USD"
    status: InvoiceStatus = field(default=InvoiceStatus.DRAFT)
    due_date: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=14))
    paid_date: Optional[datetime] = None
    notes: str = ""
    created_at: datetime = field(default_factory=datetime.now)

    # Vietnam Tax Strategy 2026 - Service Type for VAT 0% Evidence
    service_type: str = field(
        default="Software Subscription / Exported Software Service",
        metadata={"description": "Service type for tax compliance - VAT 0% for exported services"}
    )

    def get_amount_vnd(self) -> int:
        """Calculates value in VND based on current projected rates."""
        if self.currency.upper() == "VND":
            return int(self.amount)
        return int(self.amount * VND_RATE)

    def is_overdue(self) -> bool:
        """Returns True if current time exceeds due date without payment."""
        if self.status == InvoiceStatus.PAID:
            return False
        return datetime.now() > self.due_date

    def to_dict(self) -> InvoiceDict:
        """Provides a serializable representation."""
        return {
            "id": self.id,
            "client": self.client_name,
            "amount": self.amount,
            "currency": self.currency,
            "status": self.status.value,
            "dates": {
                "due": self.due_date.isoformat(),
                "paid": self.paid_date.isoformat() if self.paid_date else None,
                "created": self.created_at.isoformat(),
            },
            "amount_vnd": self.get_amount_vnd(),
            "service_type": self.service_type,  # Vietnam Tax Strategy 2026
        }


@dataclass
class Forecast:
    """
    📈 Revenue Forecast

    Projects future performance and tracks variance against reality.
    """

    month: str  # YYYY-MM
    projected: float
    actual: float = 0.0
    confidence: float = 0.8

    def get_variance(self) -> float:
        """Calculates absolute USD difference between reality and projection."""
        return self.actual - self.projected

    def get_variance_percent(self) -> float:
        """Calculates variance as a percentage of projection."""
        if self.projected == 0:
            return 0.0
        return (self.get_variance() / self.projected) * 100

    def to_dict(self) -> ForecastDict:
        """Provides a serializable representation."""
        return {
            "month": self.month,
            "projected": self.projected,
            "actual": self.actual,
            "confidence": self.confidence,
            "variance": round(self.get_variance(), 2),
            "variance_pct": round(self.get_variance_percent(), 1),
        }
