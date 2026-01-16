"""
🔔 Webhook Manager - Real-time Events
=======================================

Manage webhooks for real-time integrations.
Connect everything in real-time!

Features:
- Webhook registration
- Event dispatch
- Retry logic
- Webhook logs
"""

from typing import Dict, List, Any
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class WebhookEvent(Enum):
    """Webhook event types."""
    CLIENT_CREATED = "client.created"
    CLIENT_UPDATED = "client.updated"
    PROJECT_CREATED = "project.created"
    PROJECT_COMPLETED = "project.completed"
    INVOICE_CREATED = "invoice.created"
    INVOICE_PAID = "invoice.paid"
    PAYMENT_RECEIVED = "payment.received"
    MEETING_SCHEDULED = "meeting.scheduled"


@dataclass
class Webhook:
    """A webhook endpoint."""
    id: str
    url: str
    events: List[WebhookEvent]
    active: bool = True
    secret: str = ""
    deliveries: int = 0
    failures: int = 0
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class WebhookDelivery:
    """A webhook delivery attempt."""
    id: str
    webhook_id: str
    event: WebhookEvent
    payload: Dict[str, Any]
    status_code: int
    success: bool
    timestamp: datetime = field(default_factory=datetime.now)


class WebhookManager:
    """
    Webhook Manager.
    
    Manage real-time event webhooks.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.webhooks: Dict[str, Webhook] = {}
        self.deliveries: List[WebhookDelivery] = []
    
    def register(
        self,
        url: str,
        events: List[WebhookEvent],
        secret: str = ""
    ) -> Webhook:
        """Register a new webhook."""
        webhook = Webhook(
            id=f"WH-{uuid.uuid4().hex[:6].upper()}",
            url=url,
            events=events,
            secret=secret or f"whsec_{uuid.uuid4().hex[:16]}"
        )
        
        self.webhooks[webhook.id] = webhook
        return webhook
    
    def dispatch(self, event: WebhookEvent, payload: Dict[str, Any]) -> List[WebhookDelivery]:
        """Dispatch event to all subscribed webhooks."""
        deliveries = []
        
        for webhook in self.webhooks.values():
            if not webhook.active or event not in webhook.events:
                continue
            
            # Simulate delivery (in real app, would make HTTP POST)
            success = True  # Simulate success
            status_code = 200
            
            delivery = WebhookDelivery(
                id=f"DEL-{uuid.uuid4().hex[:6].upper()}",
                webhook_id=webhook.id,
                event=event,
                payload=payload,
                status_code=status_code,
                success=success
            )
            
            self.deliveries.append(delivery)
            webhook.deliveries += 1
            
            if not success:
                webhook.failures += 1
            
            deliveries.append(delivery)
        
        return deliveries
    
    def format_dashboard(self) -> str:
        """Format webhook dashboard."""
        active = sum(1 for w in self.webhooks.values() if w.active)
        total_deliveries = sum(w.deliveries for w in self.webhooks.values())
        sum(w.failures for w in self.webhooks.values())
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🔔 WEBHOOK MANAGER                                       ║",
            f"║  {len(self.webhooks)} webhooks │ {active} active │ {total_deliveries} deliveries          ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📡 REGISTERED WEBHOOKS                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for webhook in list(self.webhooks.values())[:5]:
            status = "🟢" if webhook.active else "🔴"
            url = webhook.url[:35]
            events = len(webhook.events)
            
            lines.append(f"║  {status} {url:<35} ({events} events)  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 AVAILABLE EVENTS                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for event in list(WebhookEvent)[:6]:
            lines.append(f"║    • {event.value:<50}  ║")
        
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Real-time everything!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    manager = WebhookManager("Saigon Digital Hub")
    
    print("🔔 Webhook Manager")
    print("=" * 60)
    print()
    
    # Register webhooks
    manager.register(
        "https://app.example.com/webhooks/stripe",
        [WebhookEvent.INVOICE_PAID, WebhookEvent.PAYMENT_RECEIVED]
    )
    manager.register(
        "https://slack.com/api/incoming-webhook",
        [WebhookEvent.CLIENT_CREATED, WebhookEvent.PROJECT_COMPLETED]
    )
    
    # Dispatch event
    manager.dispatch(WebhookEvent.CLIENT_CREATED, {"client": "Test Corp", "email": "test@corp.com"})
    
    print(manager.format_dashboard())
