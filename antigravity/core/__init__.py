"""
AntigravityKit Core Module
Provides the foundational building blocks for the Agency OS ecosystem.
"""

from .agency_dna import AgencyDNA, PricingTier, Service, Tone
from .base import BaseEngine, BaseModel
from .client_magnet import Client, ClientMagnet, Lead, LeadSource, LeadStatus
from .config import (
    ARR_TARGET_2026,
    DEFAULT_GROWTH_RATE,
    EXCHANGE_RATES,
    MAX_FILE_LINES,
    TIER_PRICING,
    Currency,
    DealTier,
)
from .content_factory import ContentFactory, ContentIdea, ContentPiece, ContentType
from .errors import (
    AntigravityError,
    ConfigError,
    PersistenceError,
    ValidationError,
    WinWinWinError,
    WorkflowError,
)
from .persistence import JSONStore, get_persistence_store, persist_load, persist_save
from .revenue_engine import RevenueEngine
from .sales_pipeline import SalesPipeline
from .vibe_ide import VIBEIDE
from .vibe_orchestrator import VIBEOrchestrator
from .vibe_workflow import VIBEWorkflow

try:
    from .models import (
        AgentTask, AgentType, ChainResult, CodeReviewResult,
        DealStage, ExecutionMode, Forecast, Invoice, InvoiceStatus,
        Plan, StartupDeal, Task, TaskStatus, TodoItem,
        WinCheck, WinType, WorkflowStep,
    )
except ImportError:
    pass

save_data = persist_save
load_data = persist_load

__all__ = [
    "BaseModel", "BaseEngine", "AntigravityError", "ValidationError",
    "PersistenceError", "WinWinWinError", "WorkflowError", "ConfigError",
    "Currency", "EXCHANGE_RATES", "ARR_TARGET_2026", "DealTier",
    "TIER_PRICING", "MAX_FILE_LINES", "DEFAULT_GROWTH_RATE",
    "JSONStore", "get_persistence_store", "persist_save", "persist_load",
    "save_data", "load_data", "AgencyDNA", "Tone", "PricingTier", "Service",
    "ClientMagnet", "Lead", "Client", "LeadSource", "LeadStatus",
    "ContentFactory", "ContentIdea", "ContentPiece", "ContentType",
    "RevenueEngine", "SalesPipeline", "VIBEWorkflow", "VIBEIDE", "VIBEOrchestrator",
]
