"""
API Keys Manager Facade.
"""
import logging
from datetime import datetime, timedelta
from typing import List

from .engine import KeysEngine
from .models import APIKey, IntegrationType, KeyStatus

logger = logging.getLogger(__name__)

class APIKeysManager(KeysEngine):
    """API Keys Manager System."""
    def __init__(self, agency_name: str):
        super().__init__(agency_name)

    def get_expiring_soon(self, days: int = 30) -> List[APIKey]:
        threshold = datetime.now() + timedelta(days=days)
        return [k for k in self.keys.values() if k.expires_at and k.expires_at <= threshold and k.status == KeyStatus.ACTIVE]

    def format_dashboard(self) -> str:
        active = sum(1 for k in self.keys.values() if k.status == KeyStatus.ACTIVE)
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🔐 API KEYS MANAGER - {self.agency_name.upper()[:25]:<25} ║",
            f"║  Total Keys: {len(self.keys):<5} │ Active: {active:<4} │ Agency OS Secure  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        return "\n".join(lines)

__all__ = ['APIKeysManager', 'IntegrationType', 'KeyStatus', 'APIKey']
