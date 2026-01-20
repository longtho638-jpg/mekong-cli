"""
Client LTV Data Models.
"""
from dataclasses import dataclass
from datetime import datetime
from enum import Enum


class ClientTier(Enum):
    PLATINUM = "platinum"
    GOLD = "gold"
    SILVER = "silver"
    BRONZE = "bronze"

@dataclass
class ClientLTV:
    id: str
    client_name: str
    start_date: datetime
    total_revenue: float
    avg_monthly: float
    retention_months: int
    predicted_ltv: float
    tier: ClientTier
