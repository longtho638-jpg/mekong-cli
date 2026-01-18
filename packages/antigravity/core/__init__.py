"""Core AntigravityKit modules for $1M 2026."""

from .agency_dna import AgencyDNA
from .client_magnet import ClientMagnet, Lead, LeadSource, LeadStatus
from .content_factory import ContentFactory
from .revenue_engine import ARR_TARGET_2026, Currency, Invoice, RevenueEngine
from .sales_pipeline import DealStage, DealTier, SalesPipeline, StartupDeal

__all__ = [
    "AgencyDNA",
    "ClientMagnet",
    "Lead",
    "LeadSource",
    "LeadStatus",
    "ContentFactory",
    "RevenueEngine",
    "Invoice",
    "Currency",
    "ARR_TARGET_2026",
    "SalesPipeline",
    "StartupDeal",
    "DealTier",
    "DealStage",
]
