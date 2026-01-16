"""
🔐 API Keys Manager - Manage Integrations
===========================================

Manage API keys and integrations securely.
Connect your agency tools safely!

Features:
- Secure key storage (masked)
- Integration status
- Usage tracking
- Key rotation reminders
"""

import uuid
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class IntegrationType(Enum):
    """Integration types."""
    PAYMENT = "payment"
    EMAIL = "email"
    ANALYTICS = "analytics"
    CRM = "crm"
    SOCIAL = "social"
    STORAGE = "storage"


class KeyStatus(Enum):
    """API key status."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"
    REVOKED = "revoked"


@dataclass
class APIKey:
    """An API key entry entity."""
    id: str
    name: str
    service: str
    type: IntegrationType
    key_masked: str
    status: KeyStatus
    last_used: Optional[datetime] = None
    usage_count: int = 0
    expires_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)


class APIKeysManager:
    """
    API Keys Manager System.
    
    Securely tracks API keys (metadata only) and usage.
    """

    # Popular integrations configuration
    INTEGRATIONS = {
        "stripe": {"name": "Stripe", "type": IntegrationType.PAYMENT, "icon": "💳"},
        "paypal": {"name": "PayPal", "type": IntegrationType.PAYMENT, "icon": "💰"},
        "mailchimp": {"name": "Mailchimp", "type": IntegrationType.EMAIL, "icon": "📧"},
        "sendgrid": {"name": "SendGrid", "type": IntegrationType.EMAIL, "icon": "✉️"},
        "google_analytics": {"name": "Google Analytics", "type": IntegrationType.ANALYTICS, "icon": "📊"},
        "hubspot": {"name": "HubSpot", "type": IntegrationType.CRM, "icon": "🔶"},
        "facebook": {"name": "Facebook", "type": IntegrationType.SOCIAL, "icon": "📘"},
        "twitter": {"name": "Twitter/X", "type": IntegrationType.SOCIAL, "icon": "🐦"},
        "aws_s3": {"name": "AWS S3", "type": IntegrationType.STORAGE, "icon": "☁️"},
        "google_drive": {"name": "Google Drive", "type": IntegrationType.STORAGE, "icon": "📁"},
    }

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.keys: Dict[str, APIKey] = {}
        logger.info(f"API Keys Manager initialized for {agency_name}")

    def _mask_key(self, key: str) -> str:
        """Mask an API key for display."""
        if not key:
            return "****"
        if len(key) <= 8:
            return "****" + key[-4:]
        return key[:4] + "****" + key[-4:]

    def add_key(
        self,
        service: str,
        api_key: str,
        expires_days: int = 365
    ) -> APIKey:
        """
        Add an API key entry.
        Note: Ideally, only the masked version or hash should be stored here.
        """
        if not api_key:
            raise ValueError("API key cannot be empty")

        integration = self.INTEGRATIONS.get(service, {
            "name": service.capitalize(),
            "type": IntegrationType.CRM,
            "icon": "🔑"
        })

        key_entry = APIKey(
            id=f"KEY-{uuid.uuid4().hex[:6].upper()}",
            name=integration["name"],
            service=service,
            type=integration["type"],
            key_masked=self._mask_key(api_key),
            status=KeyStatus.ACTIVE,
            expires_at=datetime.now() + timedelta(days=expires_days)
        )

        self.keys[key_entry.id] = key_entry
        logger.info(f"API key added for service: {service}")
        return key_entry

    def use_key(self, key_id: str) -> bool:
        """Record key usage stats."""
        key = self.keys.get(key_id)
        if key and key.status == KeyStatus.ACTIVE:
            key.last_used = datetime.now()
            key.usage_count += 1
            return True
        return False

    def get_expiring_soon(self, days: int = 30) -> List[APIKey]:
        """Get keys expiring within N days."""
        threshold = datetime.now() + timedelta(days=days)
        return [
            k for k in self.keys.values()
            if k.expires_at and k.expires_at <= threshold and k.status == KeyStatus.ACTIVE
        ]

    def format_dashboard(self) -> str:
        """Render API Keys Dashboard."""
        active_count = sum(1 for k in self.keys.values() if k.status == KeyStatus.ACTIVE)
        expiring_count = len(self.get_expiring_soon(30))

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🔐 API KEYS MANAGER{' ' * 42}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Total Keys: {len(self.keys):<5} │ Active: {active_count:<4} │ Expiring: {expiring_count:<4}      ║",
            "║                                                           ║",
            "║  🔑 INTEGRATIONS                                          ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║  Service       │ Key           │ Status  │ Uses │ Days  ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        status_icons = {
            KeyStatus.ACTIVE: "🟢",
            KeyStatus.INACTIVE: "🟡",
            KeyStatus.EXPIRED: "🔴",
            KeyStatus.REVOKED: "⛔"
        }

        for key in list(self.keys.values())[:8]:
            icon = self.INTEGRATIONS.get(key.service, {}).get("icon", "🔑")
            name = f"{icon} {key.name[:10]}"
            masked = key.key_masked[:13]
            status = f"{status_icons[key.status]} {key.status.value[:3]}"
            uses = str(key.usage_count)

            days_left = "∞"
            if key.expires_at:
                 days = (key.expires_at - datetime.now()).days
                 days_left = str(days)

            lines.append(
                f"║  {name:<13} │ {masked:<13} │ {status:<7} │ {uses:>4} │ {days_left:>5} ║"
            )

        lines.extend([
            "║                                                           ║",
            "║  ⚠️ Security Tips:                                        ║",
            "║    • Rotate keys every 90 days                            ║",
            "║    • Never share keys in plain text                       ║",
            "║    • Use environment variables                            ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Secure!               ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🔐 Initializing API Keys Manager...")
    print("=" * 60)

    try:
        manager = APIKeysManager("Saigon Digital Hub")

        # Add sample keys
        manager.add_key("stripe", "sk_live_abcd1234efgh5678", 90)
        manager.add_key("mailchimp", "mc_api_xyz123abc456", 365)
        manager.add_key("google_analytics", "GA-1234567890", 365)
        manager.add_key("hubspot", "hub_api_key_sample123", 180)
        manager.add_key("facebook", "fb_access_token_789", 60)

        # Record some usage
        for key_id in list(manager.keys.keys())[:3]:
            for _ in range(5):
                manager.use_key(key_id)

        print("\n" + manager.format_dashboard())

    except Exception as e:
        logger.error(f"Runtime Error: {e}")
