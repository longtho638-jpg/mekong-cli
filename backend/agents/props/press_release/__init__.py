"""
Press Release Agent Facade.
"""

from typing import Dict

from .engine import PREngine
from .models import PressRelease, ReleaseStatus, ReleaseType


class PressReleaseAgent(PREngine):
    """Refactored Press Release Agent."""

    def __init__(self):
        super().__init__()
        self.name = "Press Release"
        self.status = "ready"

    def get_stats(self) -> Dict:
        return {"total_releases": len(self.releases)}


__all__ = ["PressReleaseAgent", "ReleaseType", "ReleaseStatus", "PressRelease"]
