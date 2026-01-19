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

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class InquiryType(Enum):
    """Common categories for customer inquiries."""

    GENERAL = "general"
    BILLING = "billing"
    PRODUCT = "product"
    COMPLAINT = "complaint"
    FEEDBACK = "feedback"
    CANCELLATION = "cancellation"


class InquiryStatus(Enum):
    """Lifecycle status of an inquiry."""

    NEW = "new"
    RESPONDED = "responded"
    PENDING_CLIENT = "pending_client"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


@dataclass
class CustomerInquiry:
    """A customer inquiry entity."""

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
    Customer Service Rep System.

    Manages incoming client requests and resolution workflow.
    """

    def __init__(self, agency_name: str, rep_name: str = "Assistant"):
        self.agency_name = agency_name
        self.rep_name = rep_name
        self.inquiries: Dict[str, CustomerInquiry] = {}
        logger.info(f"CS Rep System initialized for {agency_name} (Rep: {rep_name})")

    def receive_inquiry(
        self, client: str, inquiry_type: InquiryType, message: str
    ) -> CustomerInquiry:
        """Log a new incoming client request."""
        if not client or not message:
            raise ValueError("Client and message are required")

        inquiry = CustomerInquiry(
            id=f"INQ-{uuid.uuid4().hex[:6].upper()}",
            client=client,
            inquiry_type=inquiry_type,
            message=message,
            rep=self.rep_name,
        )
        self.inquiries[inquiry.id] = inquiry
        logger.info(f"Inquiry received: {client} ({inquiry_type.value})")
        return inquiry

    def respond(self, inquiry_id: str, response: str) -> bool:
        """Attach a response to an inquiry."""
        if inquiry_id not in self.inquiries:
            return False

        inquiry = self.inquiries[inquiry_id]
        inquiry.response = response
        inquiry.status = InquiryStatus.RESPONDED
        logger.info(f"Responded to inquiry: {inquiry_id}")
        return True

    def resolve(self, inquiry_id: str) -> bool:
        """Mark an inquiry as successfully completed."""
        if inquiry_id not in self.inquiries:
            return False

        inquiry = self.inquiries[inquiry_id]
        inquiry.status = InquiryStatus.RESOLVED
        inquiry.resolved_at = datetime.now()
        logger.info(f"Inquiry resolved: {inquiry_id}")
        return True

    def format_dashboard(self) -> str:
        """Render the CS Rep Dashboard."""
        active_queue = [
            i
            for i in self.inquiries.values()
            if i.status in [InquiryStatus.NEW, InquiryStatus.PENDING_CLIENT]
        ]
        resolved_count = sum(
            1 for i in self.inquiries.values() if i.status == InquiryStatus.RESOLVED
        )

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎧 CS REP DASHBOARD{' ' * 38}║",
            f"║  {len(self.inquiries)} total │ {len(active_queue)} in queue │ {resolved_count} resolved{' ' * 14}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📥 INQUIRY QUEUE                                         ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        type_icons = {
            InquiryType.GENERAL: "❓",
            InquiryType.BILLING: "💳",
            InquiryType.PRODUCT: "📦",
            InquiryType.COMPLAINT: "😔",
            InquiryType.FEEDBACK: "💬",
        }
        status_icons = {
            InquiryStatus.NEW: "🆕",
            InquiryStatus.RESPONDED: "💬",
            InquiryStatus.PENDING_CLIENT: "⏳",
            InquiryStatus.RESOLVED: "✅",
        }

        for i in active_queue[:5]:
            t_icon = type_icons.get(i.inquiry_type, "📋")
            s_icon = status_icons.get(i.status, "⚪")
            client_disp = (i.client[:15] + "..") if len(i.client) > 17 else i.client
            msg_disp = (i.message[:22] + "..") if len(i.message) > 24 else i.message
            lines.append(f"║  {s_icon} {t_icon} {client_disp:<17} │ {msg_disp:<24}  ║")

        lines.extend(
            [
                "║                                                           ║",
                "║  [📥 View Queue]  [💬 Respond]  [⬆️ Escalate]  [✅ Resolve]║",
                "╠═══════════════════════════════════════════════════════════╣",
                f"║  🏯 {self.agency_name[:40]:<40} - Helpful!           ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎧 Initializing Customer Service Rep...")
    print("=" * 60)

    try:
        rep_system = CustomerServiceRep("Saigon Digital Hub", "Sarah")

        # Seed data
        inq1 = rep_system.receive_inquiry("Acme Corp", InquiryType.BILLING, "Invoice question")
        rep_system.receive_inquiry("CoffeeCo", InquiryType.PRODUCT, "How to update?")

        rep_system.respond(inq1.id, "Checking now.")

        print("\n" + rep_system.format_dashboard())

    except Exception as e:
        logger.error(f"Rep Error: {e}")
