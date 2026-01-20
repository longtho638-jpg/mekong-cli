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
