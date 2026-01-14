"""
🔒 Compliance Officer - GDPR & Privacy
=========================================

Manage regulatory compliance.
Stay compliant, stay safe!

Features:
- GDPR compliance checklist
- Privacy policy management
- Data processing agreements
- Audit trail
"""

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ComplianceArea(Enum):
    """Compliance areas."""
    GDPR = "gdpr"
    CCPA = "ccpa"
    HIPAA = "hipaa"
    SOC2 = "soc2"
    PCI_DSS = "pci_dss"


class ComplianceStatus(Enum):
    """Compliance status levels."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    NEEDS_REVIEW = "needs_review"


class DocumentType(Enum):
    """Compliance document categories."""
    PRIVACY_POLICY = "privacy_policy"
    TERMS_OF_SERVICE = "terms_of_service"
    DPA = "dpa"  # Data Processing Agreement
    COOKIE_POLICY = "cookie_policy"
    CONSENT_FORM = "consent_form"


@dataclass
class ComplianceChecklist:
    """A compliance checklist entity."""
    id: str
    area: ComplianceArea
    items: Dict[str, bool] = field(default_factory=dict)
    status: ComplianceStatus = ComplianceStatus.NOT_STARTED
    last_audit: Optional[datetime] = None
    score: int = 0  # 0-100


@dataclass
class ComplianceDocument:
    """A compliance document record."""
    id: str
    name: str
    doc_type: DocumentType
    version: str = "1.0"
    effective_date: datetime = field(default_factory=datetime.now)
    last_reviewed: Optional[datetime] = None
    needs_update: bool = False

    def __post_init__(self):
        if not self.name:
            raise ValueError("Document name required")


@dataclass
class AuditLog:
    """An audit log entry entity."""
    id: str
    action: str
    user: str
    details: str
    timestamp: datetime = field(default_factory=datetime.now)


class ComplianceOfficer:
    """
    Compliance Officer System.
    
    Tracks regulatory adherence, document versioning, and internal audits.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.checklists: Dict[str, ComplianceChecklist] = {}
        self.documents: Dict[str, ComplianceDocument] = {}
        self.audit_logs: List[AuditLog] = []
        
        logger.info(f"Compliance Officer initialized for {agency_name}")
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Setup initial compliance state for demonstration."""
        # GDPR
        gdpr = self.create_checklist(ComplianceArea.GDPR)
        gdpr.items = {
            "Privacy policy updated": True,
            "Cookie consent active": True,
            "Data register created": True,
            "DPO appointed": False,
            "Breach procedure ready": True
        }
        self.recalculate_checklist_score(gdpr.id)
        
        # Standard Docs
        self.add_document("Privacy Policy", DocumentType.PRIVACY_POLICY, "2.1")
        self.add_document("Terms of Service", DocumentType.TERMS_OF_SERVICE, "1.5")
    
    def create_checklist(self, area: ComplianceArea) -> ComplianceChecklist:
        """Initialize a new compliance area checklist."""
        checklist = ComplianceChecklist(
            id=f"CMP-{uuid.uuid4().hex[:6].upper()}",
            area=area
        )
        self.checklists[checklist.id] = checklist
        logger.info(f"Compliance checklist created: {area.value.upper()}")
        return checklist
    
    def update_item(self, checklist_id: str, item_key: str, completed: bool):
        """Update a specific checklist item status."""
        if checklist_id not in self.checklists:
            return
            
        checklist = self.checklists[checklist_id]
        checklist.items[item_key] = completed
        self.recalculate_checklist_score(checklist_id)
        self.log_audit("Update Item", f"{item_key} -> {completed}")
    
    def recalculate_checklist_score(self, checklist_id: str):
        """Calculate score based on completed items."""
        if checklist_id not in self.checklists: return
        
        c = self.checklists[checklist_id]
        if not c.items:
            c.score = 0
        else:
            done = sum(1 for val in c.items.values() if val)
            total = len(c.items)
            c.score = int((done / total) * 100)
            
            if c.score == 100: c.status = ComplianceStatus.COMPLIANT
            elif c.score >= 70: c.status = ComplianceStatus.IN_PROGRESS
            else: c.status = ComplianceStatus.NON_COMPLIANT
            
        c.last_audit = datetime.now()
    
    def add_document(self, name: str, doc_type: DocumentType, version: str = "1.0") -> ComplianceDocument:
        """Register a compliance document version."""
        doc = ComplianceDocument(
            id=f"DOC-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            doc_type=doc_type,
            version=version,
            last_reviewed=datetime.now()
        )
        self.documents[doc.id] = doc
        logger.info(f"Compliance document added: {name} v{version}")
        return doc
    
    def log_audit(self, action: str, details: str, user: str = "System"):
        """Record an action in the immutable audit trail."""
        log = AuditLog(
            id=f"LOG-{uuid.uuid4().hex[:6].upper()}",
            action=action,
            user=user,
            details=details
        )
        self.audit_logs.append(log)
        logger.debug(f"Audit: {action} - {details}")
    
    def get_overall_compliance_score(self) -> int:
        """Average score across all checklists."""
        if not self.checklists: return 100
        return int(sum(c.score for c in self.checklists.values()) / len(self.checklists))
    
    def get_stats(self) -> Dict[str, Any]:
        """Aggregate high-level compliance performance metrics."""
        return {
            "overall_score": self.get_overall_compliance_score(),
            "checklist_count": len(self.checklists),
            "document_count": len(self.documents),
            "audit_log_count": len(self.audit_logs)
        }
    
    def format_dashboard(self) -> str:
        """Render Compliance Dashboard."""
        overall = self.get_overall_compliance_score()
        score_icon = "🟢" if overall >= 80 else "🟡" if overall >= 60 else "🔴"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🔒 COMPLIANCE OFFICER{' ' * 41}║",
            f"║  {score_icon} {overall:>3}% Compliant │ {len(self.documents)} docs │ {len(self.audit_logs)} audit logs {' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 ACTIVE CHECKLISTS                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        area_icons = {"gdpr": "🇪🇺", "ccpa": "🇺🇸", "hipaa": "🏥", "soc2": "🔐", "pci_dss": "💳"}
        status_icons = {
            ComplianceStatus.NOT_STARTED: "⚪", 
            ComplianceStatus.IN_PROGRESS: "🟡",
            ComplianceStatus.COMPLIANT: "🟢", 
            ComplianceStatus.NON_COMPLIANT: "🔴"
        }
        
        for c in self.checklists.values():
            a_icon = area_icons.get(c.area.value, "📋")
            s_icon = status_icons.get(c.status, "⚪")
            # 10-segment bar
            bar = "█" * (c.score // 10) + "░" * (10 - c.score // 10)
            lines.append(f"║    {a_icon} {s_icon} {c.area.value.upper():<8} │ {bar} │ {c.score:>3}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📄 DOCUMENT REPOSITORY                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        doc_icons = {"privacy_policy": "🔒", "terms_of_service": "📜", "dpa": "📋", "cookie_policy": "🍪"}
        for d in list(self.documents.values())[:4]:
            d_icon = doc_icons.get(d.doc_type.value, "📄")
            lines.append(f"║    {d_icon} {d.name:<28} │ v{d.version:<6}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📋 Checklists]  [📄 Documents]  [📊 Audit Trail]        ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Be Compliant!      ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🔒 Initializing Compliance System...")
    print("=" * 60)
    
    try:
        officer = ComplianceOfficer("Saigon Digital Hub")
        print("\n" + officer.format_dashboard())
    except Exception as e:
        logger.error(f"System Error: {e}")
