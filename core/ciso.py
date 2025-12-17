"""
🔒 Chief Information Security Officer (CISO)
==============================================

Lead information security strategy.
Protect the digital fortress!

Roles:
- Security policies
- Risk assessment
- Compliance management
- Incident response
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class RiskLevel(Enum):
    """Security risk levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class SecurityDomain(Enum):
    """Security domains."""
    DATA_PROTECTION = "data_protection"
    ACCESS_CONTROL = "access_control"
    NETWORK = "network"
    APPLICATION = "application"
    COMPLIANCE = "compliance"
    INCIDENT = "incident"


class IncidentStatus(Enum):
    """Security incident status."""
    DETECTED = "detected"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    RESOLVED = "resolved"
    POST_MORTEM = "post_mortem"


@dataclass
class SecurityRisk:
    """A security risk."""
    id: str
    title: str
    domain: SecurityDomain
    risk_level: RiskLevel
    description: str
    mitigation: str = ""
    status: str = "open"
    identified_at: datetime = field(default_factory=datetime.now)


@dataclass
class SecurityIncident:
    """A security incident."""
    id: str
    title: str
    severity: RiskLevel
    status: IncidentStatus = IncidentStatus.DETECTED
    affected_systems: List[str] = field(default_factory=list)
    detected_at: datetime = field(default_factory=datetime.now)
    resolved_at: Optional[datetime] = None


@dataclass
class ComplianceItem:
    """A compliance requirement."""
    id: str
    standard: str  # GDPR, SOC2, ISO27001, etc.
    requirement: str
    status: str = "pending"  # pending, compliant, non_compliant
    last_audit: Optional[datetime] = None


class CISO:
    """
    Chief Information Security Officer.
    
    Lead security strategy.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.risks: Dict[str, SecurityRisk] = {}
        self.incidents: List[SecurityIncident] = []
        self.compliance: Dict[str, ComplianceItem] = {}
    
    def identify_risk(
        self,
        title: str,
        domain: SecurityDomain,
        risk_level: RiskLevel,
        description: str
    ) -> SecurityRisk:
        """Identify a security risk."""
        risk = SecurityRisk(
            id=f"RSK-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            domain=domain,
            risk_level=risk_level,
            description=description
        )
        self.risks[risk.id] = risk
        return risk
    
    def mitigate_risk(self, risk: SecurityRisk, mitigation: str):
        """Add mitigation to risk."""
        risk.mitigation = mitigation
        risk.status = "mitigated"
    
    def report_incident(
        self,
        title: str,
        severity: RiskLevel,
        affected_systems: List[str] = None
    ) -> SecurityIncident:
        """Report a security incident."""
        incident = SecurityIncident(
            id=f"INC-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            severity=severity,
            affected_systems=affected_systems or []
        )
        self.incidents.append(incident)
        return incident
    
    def update_incident(self, incident: SecurityIncident, status: IncidentStatus):
        """Update incident status."""
        incident.status = status
        if status == IncidentStatus.RESOLVED:
            incident.resolved_at = datetime.now()
    
    def add_compliance(self, standard: str, requirement: str) -> ComplianceItem:
        """Add compliance requirement."""
        item = ComplianceItem(
            id=f"CMP-{uuid.uuid4().hex[:6].upper()}",
            standard=standard,
            requirement=requirement
        )
        self.compliance[item.id] = item
        return item
    
    def get_security_score(self) -> int:
        """Calculate security score (0-100)."""
        # Based on mitigated risks and compliance
        if not self.risks and not self.compliance:
            return 100
        
        mitigated = sum(1 for r in self.risks.values() if r.status == "mitigated")
        compliant = sum(1 for c in self.compliance.values() if c.status == "compliant")
        
        risk_score = (mitigated / len(self.risks) * 50) if self.risks else 50
        compliance_score = (compliant / len(self.compliance) * 50) if self.compliance else 50
        
        return int(risk_score + compliance_score)
    
    def format_dashboard(self) -> str:
        """Format CISO dashboard."""
        score = self.get_security_score()
        open_risks = sum(1 for r in self.risks.values() if r.status == "open")
        active_incidents = sum(1 for i in self.incidents if i.status != IncidentStatus.RESOLVED)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🔒 CISO DASHBOARD                                        ║",
            f"║  Security Score: {score}% │ {open_risks} risks │ {active_incidents} incidents    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  ⚠️ RISK REGISTER                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        risk_icons = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}
        status_icons = {"open": "⚡", "mitigated": "✅"}
        
        for risk in list(self.risks.values())[:4]:
            r_icon = risk_icons.get(risk.risk_level.value, "⚪")
            s_icon = status_icons.get(risk.status, "⚪")
            
            lines.append(f"║  {r_icon} {s_icon} {risk.title[:25]:<25} │ {risk.domain.value[:12]:<12}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🚨 ACTIVE INCIDENTS                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        incident_status = {"detected": "🆕", "investigating": "🔍", "contained": "🛡️", 
                         "resolved": "✅", "post_mortem": "📋"}
        
        for inc in [i for i in self.incidents if i.status != IncidentStatus.RESOLVED][:3]:
            r_icon = risk_icons.get(inc.severity.value, "⚪")
            s_icon = incident_status.get(inc.status.value, "⚪")
            
            lines.append(f"║  {r_icon} {s_icon} {inc.title[:25]:<25} │ {len(inc.affected_systems)} systems  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 COMPLIANCE STATUS                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for comp in list(self.compliance.values())[:3]:
            status = "✅" if comp.status == "compliant" else "⚠️" if comp.status == "pending" else "❌"
            lines.append(f"║  {status} {comp.standard:<12} │ {comp.requirement[:28]:<28}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🔍 Audit]  [📊 Report]  [🔐 Policies]                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Security first!                  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ciso = CISO("Saigon Digital Hub")
    
    print("🔒 CISO Dashboard")
    print("=" * 60)
    print()
    
    # Identify risks
    r1 = ciso.identify_risk("Weak password policy", SecurityDomain.ACCESS_CONTROL, RiskLevel.HIGH, "Users have weak passwords")
    r2 = ciso.identify_risk("Unpatched servers", SecurityDomain.NETWORK, RiskLevel.CRITICAL, "3 servers need updates")
    r3 = ciso.identify_risk("No backup encryption", SecurityDomain.DATA_PROTECTION, RiskLevel.MEDIUM, "Backups not encrypted")
    
    ciso.mitigate_risk(r1, "Implemented password policy")
    
    # Report incident
    inc = ciso.report_incident("Phishing attempt detected", RiskLevel.HIGH, ["Email Server", "User Workstations"])
    ciso.update_incident(inc, IncidentStatus.INVESTIGATING)
    
    # Add compliance
    ciso.add_compliance("GDPR", "Data protection requirements")
    ciso.add_compliance("SOC2", "Security controls audit")
    
    print(ciso.format_dashboard())
