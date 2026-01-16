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

import uuid
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RiskLevel(Enum):
    """Security risk and severity levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

    @property
    def weight(self) -> int:
        """Numeric weight for risk score calculations."""
        mapping = {
            RiskLevel.CRITICAL: 10,
            RiskLevel.HIGH: 7,
            RiskLevel.MEDIUM: 4,
            RiskLevel.LOW: 2
        }
        return mapping[self]


class SecurityDomain(Enum):
    """Security domains for classification."""
    DATA_PROTECTION = "data_protection"
    ACCESS_CONTROL = "access_control"
    NETWORK = "network"
    APPLICATION = "application"
    COMPLIANCE = "compliance"
    INCIDENT = "incident"


class IncidentStatus(Enum):
    """Security incident lifecycle status."""
    DETECTED = "detected"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    RESOLVED = "resolved"
    POST_MORTEM = "post_mortem"


@dataclass
class SecurityRisk:
    """A security risk record entity."""
    id: str
    title: str
    domain: SecurityDomain
    risk_level: RiskLevel
    description: str
    mitigation: str = ""
    status: str = "open" # open, mitigated
    identified_at: datetime = field(default_factory=datetime.now)


@dataclass
class SecurityIncident:
    """A security incident record entity."""
    id: str
    title: str
    severity: RiskLevel
    status: IncidentStatus = IncidentStatus.DETECTED
    affected_systems: List[str] = field(default_factory=list)
    detected_at: datetime = field(default_factory=datetime.now)
    resolved_at: Optional[datetime] = None


@dataclass
class ComplianceItem:
    """A compliance requirement entity."""
    id: str
    standard: str  # e.g., GDPR, SOC2, ISO27001
    requirement: str
    status: str = "pending"  # pending, compliant, non_compliant
    last_audit: Optional[datetime] = None


class CISO:
    """
    Chief Information Security Officer System.
    
    Manages agency security posture, risk register, and incident response.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.risks: Dict[str, SecurityRisk] = {}
        self.incidents: List[SecurityIncident] = []
        self.compliance: Dict[str, ComplianceItem] = {}
        logger.info(f"CISO System initialized for {agency_name}")
    
    def identify_risk(
        self,
        title: str,
        domain: SecurityDomain,
        risk_level: RiskLevel,
        description: str
    ) -> SecurityRisk:
        """Add a new risk to the register."""
        if not title:
            raise ValueError("Risk title required")

        risk = SecurityRisk(
            id=f"RSK-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            domain=domain,
            risk_level=risk_level,
            description=description
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
        self,
        title: str,
        severity: RiskLevel,
        affected_systems: Optional[List[str]] = None
    ) -> SecurityIncident:
        """Declare a security incident."""
        incident = SecurityIncident(
            id=f"INC-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            severity=severity,
            affected_systems=affected_systems or []
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
            id=f"CMP-{uuid.uuid4().hex[:6].upper()}",
            standard=standard,
            requirement=requirement
        )
        self.compliance[item.id] = item
        return item
    
    def get_security_score(self) -> int:
        """Calculate weighted security score (0-100)."""
        if not self.risks and not self.compliance:
            return 100
        
        # Risk Score (Lower is better, then inverted)
        total_risk_weight = sum(r.risk_level.weight for r in self.risks.values())
        mitigated_weight = sum(r.risk_level.weight for r in self.risks.values() if r.status == "mitigated")
        
        risk_score = (mitigated_weight / total_risk_weight * 50) if total_risk_weight > 0 else 50
        
        # Compliance Score
        compliant_count = sum(1 for c in self.compliance.values() if c.status == "compliant")
        compliance_score = (compliant_count / len(self.compliance) * 50) if self.compliance else 50
        
        return int(risk_score + compliance_score)
    
    def format_dashboard(self) -> str:
        """Render CISO Dashboard."""
        score = self.get_security_score()
        open_risks = sum(1 for r in self.risks.values() if r.status == "open")
        active_incidents = sum(1 for i in self.incidents if i.status != IncidentStatus.RESOLVED)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🔒 CISO DASHBOARD{' ' * 42}║",
            f"║  Security Score: {score:>3}% │ {open_risks:>2} risks │ {active_incidents:>2} active incidents{' ' * 7}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  ⚠️ RISK REGISTER                                         ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        risk_icons = {
            RiskLevel.CRITICAL: "🔴", 
            RiskLevel.HIGH: "🟠", 
            RiskLevel.MEDIUM: "🟡", 
            RiskLevel.LOW: "🟢"
        }
        status_icons = {"open": "⚡", "mitigated": "✅"}
        
        # Show top 4 risks
        sorted_risks = sorted(self.risks.values(), key=lambda x: (x.status == "mitigated", -x.risk_level.weight))[:4]
        for r in sorted_risks:
            r_icon = risk_icons.get(r.risk_level, "⚪")
            s_icon = status_icons.get(r.status, "⚪")
            title_display = (r.title[:25] + '..') if len(r.title) > 27 else r.title
            
            lines.append(f"║  {r_icon} {s_icon} {title_display:<27} │ {r.domain.value[:12]:<12}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🚨 INCIDENT STATUS                                       ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        incident_icons = {
            IncidentStatus.DETECTED: "🆕", 
            IncidentStatus.INVESTIGATING: "🔍", 
            IncidentStatus.CONTAINED: "🛡️", 
            IncidentStatus.RESOLVED: "✅", 
            IncidentStatus.POST_MORTEM: "📋"
        }
        
        active_inc = [i for i in self.incidents if i.status != IncidentStatus.RESOLVED][:3]
        if not active_inc:
            lines.append("║    ✅ No active security incidents detected               ║")
        else:
            for inc in active_inc:
                r_icon = risk_icons.get(inc.severity, "⚪")
                s_icon = incident_icons.get(inc.status, "⚪")
                title_display = (inc.title[:25] + '..') if len(inc.title) > 27 else inc.title
                lines.append(f"║  {r_icon} {s_icon} {title_display:<27} │ {len(inc.affected_systems):>2} systems  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 COMPLIANCE STATUS                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for c in list(self.compliance.values())[:3]:
            c_status = "✅" if c.status == "compliant" else "⚠️" if c.status == "pending" else "❌"
            req_display = (c.requirement[:28] + '..') if len(c.requirement) > 30 else c.requirement
            lines.append(f"║  {c_status} {c.standard:<12} │ {req_display:<30} ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🔍 Audit]  [📊 Report]  [🔐 Policies]                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Security!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🔒 Initializing CISO System...")
    print("=" * 60)
    
    try:
        ciso = CISO("Saigon Digital Hub")
        
        # Identify risks
        r1 = ciso.identify_risk("Weak password policy", SecurityDomain.ACCESS_CONTROL, RiskLevel.HIGH, "Users have weak passwords")
        r2 = ciso.identify_risk("Unpatched servers", SecurityDomain.NETWORK, RiskLevel.CRITICAL, "3 servers need updates")
        r3 = ciso.identify_risk("No backup encryption", SecurityDomain.DATA_PROTECTION, RiskLevel.MEDIUM, "Backups not encrypted")
        
        ciso.mitigate_risk(r1.id, "Implemented password policy")
        
        # Report incident
        inc = ciso.report_incident("Phishing attempt detected", RiskLevel.HIGH, ["Email Server", "Workstations"])
        ciso.update_incident(inc.id, IncidentStatus.INVESTIGATING)
        
        # Add compliance
        ciso.add_compliance("GDPR", "Data protection requirements")
        ciso.add_compliance("SOC2", "Security controls audit")
        
        print("\n" + ciso.format_dashboard())
        
    except Exception as e:
        logger.error(f"Runtime Error: {e}")
