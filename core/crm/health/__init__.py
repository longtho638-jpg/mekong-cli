"""
Client Health System Facade.
"""
import logging

from .dashboard import HealthDashboard
from .models import ClientHealth, HealthLevel, RiskFactor

logger = logging.getLogger(__name__)

class ClientHealthScore(HealthDashboard):
    """
    Client Health Score System.
    Predicts churn by monitoring engagement, payment, results, and communication.
    """
    def __init__(self, agency_name: str):
        super().__init__(agency_name)
        logger.info(f"Client Health System initialized for {agency_name}")

    def add_client(
        self,
        name: str,
        engagement: int = 80,
        payment: int = 100,
        results: int = 70,
        communication: int = 85,
    ) -> ClientHealth:
        client = self.calculate_health(name, engagement, payment, results, communication)
        self.clients[client.id] = client
        logger.info(f"Client health tracked: {name} (Score: {client.overall_score})")
        return client
