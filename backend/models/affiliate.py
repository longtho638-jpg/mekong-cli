from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from .enums import AffiliateStatus, PayoutStatus, ConversionStatus

class Affiliate(BaseModel):
    id: str = Field(..., description="UUID")
    user_id: str
    agency_id: str
    code: str
    commission_rate: Decimal
    payment_email: Optional[EmailStr] = None
    tax_id: Optional[str] = None
    status: AffiliateStatus
    settings: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

class AffiliateLink(BaseModel):
    id: str = Field(..., description="UUID")
    affiliate_id: str
    slug: Optional[str] = None
    destination_url: str
    clicks: int = 0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

class Conversion(BaseModel):
    id: str = Field(..., description="UUID")
    affiliate_id: Optional[str] = None
    external_id: Optional[str] = None
    payout_id: Optional[str] = None
    amount: Decimal
    currency: str
    commission_amount: Decimal
    status: ConversionStatus
    metadata: Dict[str, Any] = {}
    occurred_at: datetime
    created_at: datetime
    updated_at: datetime

class Payout(BaseModel):
    id: str = Field(..., description="UUID")
    affiliate_id: str
    amount: Decimal
    currency: str
    tax_amount: Decimal = Decimal(0)
    tax_rate: Decimal = Decimal(0)
    status: PayoutStatus
    method: Optional[str] = None
    reference_id: Optional[str] = None
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    created_at: datetime
    updated_at: datetime
