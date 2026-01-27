from typing import Optional

from pydantic import BaseModel


class Agency(BaseModel):
    id: str
    user_id: str
    subscription_tier: str  # 'free' | 'pro' | 'enterprise'
    stripe_customer_id: str
    mrr: float
    settings: dict
    # DNA configuration fields
    tone: Optional[str] = None
    capabilities: Optional[list] = None
    services: Optional[list] = None
