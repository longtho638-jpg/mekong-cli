"""
CISO Persona Facade.
"""
import logging

from .dashboard import CISODashboard
from .models import (
    ComplianceItem,
    IncidentStatus,
    RiskLevel,
    SecurityDomain,
    SecurityIncident,
    SecurityRisk,
)

logger = logging.getLogger(__name__)

class CISO(CISODashboard):
    """
    Chief Information Security Officer System.
    Manages agency security posture, risk register, and incident response.
    """
    def __init__(self, agency_name: str):
        super().__init__(agency_name)
        logger.info(f"CISO System initialized for {agency_name}")

__all__ = ['CISO', 'RiskLevel', 'SecurityDomain', 'IncidentStatus', 'SecurityRisk', 'SecurityIncident', 'ComplianceItem']
