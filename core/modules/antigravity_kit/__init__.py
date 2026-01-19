"""
Antigravity Kit - Main Export
"""

from .agency_dna import AgencyDNA, IdentityService
from .client_magnet import ClientMagnet
from .revenue_engine import RevenueEngine


class AntigravityKit:
    """The Unified SDK."""

    def __init__(self):
        self.identity = IdentityService()
        self.magnet = ClientMagnet()
        self.revenue = RevenueEngine()

    def status(self) -> str:
        return "🌌 Antigravity Kit: ONLINE"
