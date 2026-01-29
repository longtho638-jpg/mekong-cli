from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field, HttpUrl

from backend.models.enums import AffiliateStatus, ConversionStatus, PayoutStatus

# --- Affiliate Schemas ---


class AffiliateCreate(BaseModel):
    payment_email: EmailStr
    tax_id: Optional[str] = None
    settings: Optional[Dict[str, Any]] = {}


class AffiliateUpdate(BaseModel):
    payment_email: Optional[EmailStr] = None
    tax_id: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    commission_rate: Optional[float] = None  # Admin only
    status: Optional[AffiliateStatus] = None  # Admin only


class AffiliateResponse(BaseModel):
    id: str
    user_id: str
    agency_id: str
    code: str
    commission_rate: float
    payment_email: Optional[EmailStr]
    tax_id: Optional[str]
    status: AffiliateStatus
    settings: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Link Schemas ---


class LinkCreate(BaseModel):
    destination_url: HttpUrl
    slug: Optional[str] = None


class LinkResponse(BaseModel):
    id: str
    affiliate_id: str
    slug: Optional[str]
    destination_url: str
    clicks: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Payout Schemas ---


class PayoutResponse(BaseModel):
    id: str
    affiliate_id: str
    amount: float
    currency: str
    tax_amount: float
    tax_rate: float
    status: PayoutStatus
    period_start: Optional[date]
    period_end: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Stats Schema ---


class AffiliateStats(BaseModel):
    clicks: int
    conversions: int
    total_sales: float
    total_earnings: float
    pending_payout: float
