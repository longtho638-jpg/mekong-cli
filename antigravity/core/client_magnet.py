"""
🧲 ClientMagnet - Lead Generation & CRM Engine
==============================================

The primary lead acquisition and conversion system for Agency OS.
Manages the end-to-end sales lifecycle from initial contact to
client onboarding and lifetime value tracking.

Features:
- Multi-channel ingestion (Zalo, FB, Web).
- Heuristic scoring for lead qualification.
- Pipeline value estimation.
- Conversion analytics.

Binh Pháp: 🧲 Địa (Terrain) - Understanding and capturing the market space.

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.client_magnet package.
"""

from antigravity.core.client_magnet import (
    Client,
    ClientMagnet,
    Lead,
    LeadSource,
    LeadStatus,
    client_magnet,
)

__all__ = [
    "ClientMagnet",
    "Lead",
    "Client",
    "LeadSource",
    "LeadStatus",
    "client_magnet",
]
