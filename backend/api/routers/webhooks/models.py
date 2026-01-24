"""
Gumroad Webhook Schemas and Data Models.
"""
from typing import Optional

from pydantic import BaseModel


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
    id: str  # Unique referral ID
    affiliate_code: str  # Affiliate identifier
    sale_id: str  # Linked to purchase
    customer_email: str
    product_id: str
    product_name: str
    purchase_amount: float
    commission_rate: float  # 0.20 for 20%
    commission_amount: float
    status: str  # "pending", "paid", "cancelled"
    created_at: str  # ISO timestamp
    paid_at: Optional[str] = None
