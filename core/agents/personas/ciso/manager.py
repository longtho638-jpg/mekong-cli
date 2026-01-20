"""
CISO Risk Management and Incident Response Logic.
"""
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from .models import (
    ComplianceItem,
    IncidentStatus,
    RiskLevel,
    SecurityDomain,
    SecurityIncident,
    SecurityRisk,
)

logger = logging.getLogger(__name__)

class SecurityManager:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.risks: Dict[str, SecurityRisk] = {}
        self.incidents: List[SecurityIncident] = []
        self.compliance: Dict[str, ComplianceItem] = {}

    def identify_risk(
        self, title: str, domain: SecurityDomain, risk_level: RiskLevel, description: str
    ) -> SecurityRisk:
        """Add a new risk to the register."""
        if not title:
            raise ValueError("Risk title required")

        risk = SecurityRisk(
            id=f"RSK-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            domain=domain,
            risk_level=risk_level,
            description=description,
        )
        self.risks[risk.id] = risk
        logger.warning(f"SECURITY RISK IDENTIFIED: {title} ({risk_level.value})")
        return risk

    def mitigate_risk(self, risk_id: str, mitigation: str) -> bool:
        """Apply mitigation to an identified risk."""
        if risk_id not in self.risks:
            return False

        risk = self.risks[risk_id]
        risk.mitigation = mitigation
        risk.status = "mitigated"
        logger.info(f"Risk mitigated: {risk.title}")
        return True

    def report_incident(
        self, title: str, severity: RiskLevel, affected_systems: Optional[List[str]] = None
    ) -> SecurityIncident:
        """Declare a security incident."""
        incident = SecurityIncident(
            id=f"INC-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            severity=severity,
            affected_systems=affected_systems or [],
        )
        self.incidents.append(incident)
        logger.critical(f"INCIDENT REPORTED: {title} ({severity.value})")
        return incident

    def update_incident(self, incident_id: str, status: IncidentStatus) -> bool:
        """Move incident through lifecycle."""
        for inc in self.incidents:
            if inc.id == incident_id:
                inc.status = status
                if status == IncidentStatus.RESOLVED:
                    inc.resolved_at = datetime.now()
                logger.info(f"Incident {inc.title} status updated to {status.value}")
                return True
        return False

    def add_compliance(self, standard: str, requirement: str) -> ComplianceItem:
        """Register a compliance standard requirement."""
        item = ComplianceItem(
            id=f"CMP-{uuid.uuid4().hex[:6].upper()}", standard=standard, requirement=requirement
        )
        self.compliance[item.id] = item
        return item
