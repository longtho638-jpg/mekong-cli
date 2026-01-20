"""
🧲 Client Magnet Module
=======================

The primary lead acquisition and conversion system for Agency OS.
"""

from .engine import ClientMagnet, get_client_magnet
from .models import Client, Lead, LeadSource, LeadStatus

# Create global instance for backward compatibility
client_magnet = get_client_magnet()

__all__ = [
    "ClientMagnet",
    "Lead",
    "Client",
    "LeadSource",
    "LeadStatus",
    "client_magnet",
    "get_client_magnet",
]
