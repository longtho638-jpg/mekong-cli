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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class ComplianceArea(Enum):
    """Compliance areas."""
    GDPR = "gdpr"
    CCPA = "ccpa"
    HIPAA = "hipaa"
    SOC2 = "soc2"
    PCI_DSS = "pci_dss"


class ComplianceStatus(Enum):
    """Compliance status."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    NEEDS_REVIEW = "needs_review"


class DocumentType(Enum):
    """Compliance document types."""
    PRIVACY_POLICY = "privacy_policy"
    TERMS_OF_SERVICE = "terms_of_service"
    DPA = "dpa"  # Data Processing Agreement
    COOKIE_POLICY = "cookie_policy"
    CONSENT_FORM = "consent_form"


@dataclass
class ComplianceChecklist:
    """A compliance checklist."""
    id: str
    area: ComplianceArea
    items: Dict[str, bool] = field(default_factory=dict)
    status: ComplianceStatus = ComplianceStatus.NOT_STARTED
    last_audit: Optional[datetime] = None
    score: int = 0  # 0-100


@dataclass
class ComplianceDocument:
    """A compliance document."""
    id: str
    name: str
    doc_type: DocumentType
    version: str = "1.0"
    effective_date: datetime = field(default_factory=datetime.now)
    last_reviewed: Optional[datetime] = None
    needs_update: bool = False


@dataclass
class AuditLog:
    """An audit log entry."""
    id: str
    action: str
    user: str
    details: str
    timestamp: datetime = field(default_factory=datetime.now)


class ComplianceOfficer:
    """
    Compliance Officer.
    
    Regulatory compliance management.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.checklists: Dict[str, ComplianceChecklist] = {}
        self.documents: Dict[str, ComplianceDocument] = {}
        self.audit_logs: List[AuditLog] = []
        
        self._init_demo_data()
    
    def _get_gdpr_items(self) -> Dict[str, bool]:
        """Get GDPR checklist items."""
        return {
            "Privacy policy updated": True,
            "Cookie consent implemented": True,
            "Data processing register": True,
            "DPA with vendors": False,
            "Right to erasure process": True,
            "Data breach procedure": True,
            "DPO appointed": False,
            "Staff training complete": True,
        }
    
    def _init_demo_data(self):
        """Initialize demo data."""
        # GDPR checklist
        gdpr = self.create_checklist(ComplianceArea.GDPR)
        gdpr.items = self._get_gdpr_items()
        gdpr.status = ComplianceStatus.IN_PROGRESS
        self._calculate_score(gdpr)
        
        # Documents
        docs = [
            ("Privacy Policy", DocumentType.PRIVACY_POLICY, "2.1"),
            ("Terms of Service", DocumentType.TERMS_OF_SERVICE, "1.5"),
            ("Cookie Policy", DocumentType.COOKIE_POLICY, "1.2"),
            ("Data Processing Agreement", DocumentType.DPA, "1.0"),
        ]
        
        for name, dtype, version in docs:
            self.add_document(name, dtype, version)
    
    def create_checklist(self, area: ComplianceArea) -> ComplianceChecklist:
        """Create a compliance checklist."""
        checklist = ComplianceChecklist(
            id=f"CMP-{uuid.uuid4().hex[:6].upper()}",
            area=area
        )
        self.checklists[checklist.id] = checklist
        return checklist
    
    def update_checklist_item(self, checklist: ComplianceChecklist, item: str, completed: bool):
        """Update a checklist item."""
        if item in checklist.items:
            checklist.items[item] = completed
            self._calculate_score(checklist)
            self._log_action(f"Updated {item}", f"Set to {completed}")
    
    def _calculate_score(self, checklist: ComplianceChecklist):
        """Calculate compliance score."""
        if not checklist.items:
            checklist.score = 0
        else:
            completed = sum(checklist.items.values())
            total = len(checklist.items)
            checklist.score = int((completed / total) * 100)
            
            if checklist.score == 100:
                checklist.status = ComplianceStatus.COMPLIANT
            elif checklist.score >= 70:
                checklist.status = ComplianceStatus.IN_PROGRESS
            else:
                checklist.status = ComplianceStatus.NON_COMPLIANT
    
    def add_document(
        self,
        name: str,
        doc_type: DocumentType,
        version: str = "1.0"
    ) -> ComplianceDocument:
        """Add a compliance document."""
        doc = ComplianceDocument(
            id=f"DOC-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            doc_type=doc_type,
            version=version,
            last_reviewed=datetime.now()
        )
        self.documents[doc.id] = doc
        return doc
    
    def _log_action(self, action: str, details: str, user: str = "System"):
        """Log an audit action."""
        log = AuditLog(
            id=f"LOG-{uuid.uuid4().hex[:6].upper()}",
            action=action,
            user=user,
            details=details
        )
        self.audit_logs.append(log)
    
    def get_overall_score(self) -> float:
        """Get overall compliance score."""
        if not self.checklists:
            return 0
        return sum(c.score for c in self.checklists.values()) / len(self.checklists)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get compliance statistics."""
        compliant = sum(1 for c in self.checklists.values() 
                       if c.status == ComplianceStatus.COMPLIANT)
        
        return {
            "checklists": len(self.checklists),
            "documents": len(self.documents),
            "overall_score": self.get_overall_score(),
            "compliant_areas": compliant,
            "audit_entries": len(self.audit_logs)
        }
    
    def format_dashboard(self) -> str:
        """Format compliance officer dashboard."""
        stats = self.get_stats()
        
        score = stats['overall_score']
        score_icon = "🟢" if score >= 80 else "🟡" if score >= 60 else "🔴"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🔒 COMPLIANCE OFFICER                                    ║",
            f"║  {score_icon} {score:.0f}% compliant │ {stats['documents']} docs │ {stats['audit_entries']} audits  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 COMPLIANCE CHECKLISTS                                 ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        area_icons = {"gdpr": "🇪🇺", "ccpa": "🇺🇸", "hipaa": "🏥",
                     "soc2": "🔐", "pci_dss": "💳"}
        status_icons = {"not_started": "⚪", "in_progress": "🟡",
                       "compliant": "🟢", "non_compliant": "🔴", "needs_review": "🟠"}
        
        for checklist in self.checklists.values():
            a_icon = area_icons.get(checklist.area.value, "📋")
            s_icon = status_icons.get(checklist.status.value, "⚪")
            bar = "█" * (checklist.score // 10) + "░" * (10 - checklist.score // 10)
            lines.append(f"║    {a_icon} {s_icon} {checklist.area.value.upper():<8} │ {bar} │ {checklist.score:>3}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 GDPR CHECKLIST                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        gdpr = next((c for c in self.checklists.values() if c.area == ComplianceArea.GDPR), None)
        if gdpr:
            for item, done in list(gdpr.items.items())[:5]:
                icon = "✅" if done else "❌"
                lines.append(f"║    {icon} {item[:45]:<45}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📄 COMPLIANCE DOCUMENTS                                  ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        doc_icons = {"privacy_policy": "🔒", "terms_of_service": "📜",
                    "dpa": "📋", "cookie_policy": "🍪", "consent_form": "✍️"}
        
        for doc in list(self.documents.values())[:4]:
            icon = doc_icons.get(doc.doc_type.value, "📄")
            lines.append(f"║    {icon} {doc.name:<28} │ v{doc.version:<6}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 COMPLIANCE SUMMARY                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📋 Compliance Areas:   {stats['checklists']:>12}              ║",
            f"║    📄 Documents:          {stats['documents']:>12}              ║",
            f"║    {score_icon} Overall Score:       {score:>12.0f}%              ║",
            "║                                                           ║",
            "║  [📋 Checklists]  [📄 Documents]  [📊 Audit]              ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Stay compliant!                  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    co = ComplianceOfficer("Saigon Digital Hub")
    
    print("🔒 Compliance Officer")
    print("=" * 60)
    print()
    
    print(co.format_dashboard())
