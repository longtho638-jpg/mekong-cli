"""
Client LTV calculation engine logic.
"""
import uuid
from datetime import datetime, timedelta
from typing import Dict

from .models import ClientLTV, ClientTier


class LTVEngine:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.clients: Dict[str, ClientLTV] = {}

    def calculate_ltv(self, avg_monthly: float, months: int = 24, churn_rate: float = 0.05) -> float:
        safe_churn = max(0.01, min(1.0, churn_rate))
        return avg_monthly * min(1 / safe_churn, 36.0)

    def determine_tier(self, ltv: float) -> ClientTier:
        if ltv >= 100000: return ClientTier.PLATINUM
        if ltv >= 60000: return ClientTier.GOLD
        if ltv >= 30000: return ClientTier.SILVER
        return ClientTier.BRONZE
