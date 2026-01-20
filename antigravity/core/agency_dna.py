"""
🧬 AgencyDNA - Your Agency's Unique Identity
===========================================

Defines the core essence of the agency, determining its market position,
voice, and operational parameters.

Binh Pháp: ☸️ Đạo (Way) - Alignment of purpose and vision.

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.agency_dna package.
"""

from antigravity.core.agency_dna import (
    AgencyDNA,
    PricingTier,
    Service,
    Tone,
    create_starter_dna,
)

__all__ = [
    "Tone",
    "PricingTier",
    "Service",
    "AgencyDNA",
    "create_starter_dna",
]
