"""
🎧 Customer Service Rep - Frontline Support
=============================================

Handle customer inquiries and issues.
First point of contact!

Roles:
- Inquiry handling
- Issue resolution
- Customer communication
- Ticket management
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class InquiryType(Enum):
    """Inquiry types."""
    GENERAL = "general"
    BILLING = "billing"
    PRODUCT = "product"
    COMPLAINT = "complaint"
    FEEDBACK = "feedback"
    CANCELLATION = "cancellation"


class InquiryStatus(Enum):
    """Inquiry status."""
    NEW = "new"
    RESPONDED = "responded"
    PENDING_CLIENT = "pending_client"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


@dataclass
class CustomerInquiry:
    """A customer inquiry."""
    id: str
    client: str
    inquiry_type: InquiryType
    message: str
    status: InquiryStatus = InquiryStatus.NEW
    rep: str = ""
    response: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    resolved_at: Optional[datetime] = None


class CustomerServiceRep:
    """
    Customer Service Rep.
    
    Frontline support.
    """
    
    def __init__(self, agency_name: str, rep_name: str = ""):
        self.agency_name = agency_name
        self.rep_name = rep_name
        self.inquiries: Dict[str, CustomerInquiry] = {}
    
    def receive_inquiry(
        self,
        client: str,
        inquiry_type: InquiryType,
        message: str
    ) -> CustomerInquiry:
        """Receive a customer inquiry."""
        inquiry = CustomerInquiry(
            id=f"INQ-{uuid.uuid4().hex[:6].upper()}",
            client=client,
            inquiry_type=inquiry_type,
            message=message,
            rep=self.rep_name
        )
        self.inquiries[inquiry.id] = inquiry
        return inquiry
    
    def respond(self, inquiry: CustomerInquiry, response: str):
        """Respond to inquiry."""
        inquiry.response = response
        inquiry.status = InquiryStatus.RESPONDED
    
    def resolve(self, inquiry: CustomerInquiry):
        """Resolve inquiry."""
        inquiry.status = InquiryStatus.RESOLVED
        inquiry.resolved_at = datetime.now()
    
    def escalate(self, inquiry: CustomerInquiry):
        """Escalate inquiry."""
        inquiry.status = InquiryStatus.ESCALATED
    
    def get_queue(self) -> List[CustomerInquiry]:
        """Get inquiry queue."""
        return [i for i in self.inquiries.values() if i.status in [InquiryStatus.NEW, InquiryStatus.PENDING_CLIENT]]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get rep statistics."""
        resolved = sum(1 for i in self.inquiries.values() if i.status == InquiryStatus.RESOLVED)
        return {
            "total": len(self.inquiries),
            "queue": len(self.get_queue()),
            "resolved": resolved,
            "escalated": sum(1 for i in self.inquiries.values() if i.status == InquiryStatus.ESCALATED)
        }
    
    def format_dashboard(self) -> str:
        """Format CSR dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎧 CUSTOMER SERVICE REP                                  ║",
            f"║  {stats['total']} total │ {stats['queue']} in queue │ {stats['resolved']} resolved       ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📥 INQUIRY QUEUE                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"general": "❓", "billing": "💳", "product": "📦", "complaint": "😔", "feedback": "💬", "cancellation": "❌"}
        status_icons = {"new": "🆕", "responded": "💬", "pending_client": "⏳", "resolved": "✅", "escalated": "⬆️"}
        
        for inquiry in list(self.get_queue())[:5]:
            t_icon = type_icons.get(inquiry.inquiry_type.value, "📋")
            s_icon = status_icons.get(inquiry.status.value, "⚪")
            
            lines.append(f"║  {s_icon} {t_icon} {inquiry.client[:15]:<15} │ {inquiry.message[:22]:<22}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY TYPE                                               ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for itype in list(InquiryType)[:4]:
            count = sum(1 for i in self.inquiries.values() if i.inquiry_type == itype)
            icon = type_icons.get(itype.value, "📋")
            lines.append(f"║    {icon} {itype.value.capitalize():<15} │ {count:>2} inquiries             ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📥 View Queue]  [💬 Respond]  [⬆️ Escalate]             ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Always helpful!                  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    csr = CustomerServiceRep("Saigon Digital Hub", "Sarah")
    
    print("🎧 Customer Service Rep")
    print("=" * 60)
    print()
    
    i1 = csr.receive_inquiry("Sunrise Realty", InquiryType.BILLING, "Question about invoice")
    i2 = csr.receive_inquiry("Coffee Lab", InquiryType.PRODUCT, "How to update website?")
    i3 = csr.receive_inquiry("Tech Startup", InquiryType.COMPLAINT, "Project delayed")
    i4 = csr.receive_inquiry("Fashion Brand", InquiryType.GENERAL, "Contract renewal info")
    
    # Handle some inquiries
    csr.respond(i1, "Invoice breakdown sent via email")
    csr.resolve(i1)
    csr.escalate(i3)
    
    print(csr.format_dashboard())
