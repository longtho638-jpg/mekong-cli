"""Core AntigravityKit modules for $1M 2026."""

from .agency_dna import AgencyDNA
from .client_magnet import ClientMagnet, Lead, LeadSource, LeadStatus
from .content_factory import ContentFactory
from .revenue_engine import RevenueEngine, Invoice, Currency, ARR_TARGET_2026
from .sales_pipeline import SalesPipeline, StartupDeal, DealTier, DealStage

__all__ = [
    "AgencyDNA",
    "ClientMagnet", "Lead", "LeadSource", "LeadStatus",
    "ContentFactory",
    "RevenueEngine", "Invoice", "Currency", "ARR_TARGET_2026",
    "SalesPipeline", "StartupDeal", "DealTier", "DealStage",
]
