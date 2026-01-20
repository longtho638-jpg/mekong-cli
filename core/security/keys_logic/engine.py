"""
API Keys Manager logic and configuration.
"""
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from .models import APIKey, IntegrationType, KeyStatus

logger = logging.getLogger(__name__)

class KeysEngine:
    # Popular integrations configuration
    INTEGRATIONS = {
        "stripe": {"name": "Stripe", "type": IntegrationType.PAYMENT, "icon": "💳"},
        "mailchimp": {"name": "Mailchimp", "type": IntegrationType.EMAIL, "icon": "📧"},
        "google_analytics": {"name": "Google Analytics", "type": IntegrationType.ANALYTICS, "icon": "📊"},
        "hubspot": {"name": "HubSpot", "type": IntegrationType.CRM, "icon": "🔶"},
    }

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.keys: Dict[str, APIKey] = {}

    def _mask_key(self, key: str) -> str:
        if not key: return "****"
        if len(key) <= 8: return "****" + key[-4:]
        return key[:4] + "****" + key[-4:]

    def add_key(self, service: str, api_key: str, expires_days: int = 365) -> APIKey:
        if not api_key: raise ValueError("API key cannot be empty")
        integration = self.INTEGRATIONS.get(service, {"name": service.capitalize(), "type": IntegrationType.CRM, "icon": "🔑"})
        key_entry = APIKey(
            id=f"KEY-{uuid.uuid4().hex[:6].upper()}", name=integration["name"], service=service,
            type=integration["type"], key_masked=self._mask_key(api_key), status=KeyStatus.ACTIVE,
            expires_at=datetime.now() + timedelta(days=expires_days),
        )
        self.keys[key_entry.id] = key_entry
        return key_entry

    def use_key(self, key_id: str) -> bool:
        key = self.keys.get(key_id)
        if key and key.status == KeyStatus.ACTIVE:
            key.last_used = datetime.now()
            key.usage_count += 1
            return True
        return False
