"""
🏗️ AntigravityKit Core Module
=============================

Provides the foundational building blocks for the Agency OS ecosystem.
Orchestrates identity, lead generation, content production, revenue tracking,
and the VIBE IDE suite.

"Không đánh mà thắng" - Win Without Fighting 🏯
"""

# 1. Base Infrastructure
from .base import BaseEngine, BaseModel

# 3. Global Configuration
from .config import (
    ARR_TARGET_2026,
    DEFAULT_GROWTH_RATE,
    EXCHANGE_RATES,
    MAX_FILE_LINES,
    TIER_PRICING,
    Currency,
    DealTier,
)

# 2. Error Governance
from .errors import (
    AntigravityError,
    ConfigError,
    PersistenceError,
    ValidationError,
    WinWinWinError,
    WorkflowError,
)

# 4. Data Persistence (Updated names)
from .persistence import JSONStore, get_persistence_store, persist_load, persist_save

# Alias for backward compatibility if needed, but preferred to use new names
save_data = persist_save
load_data = persist_load

# 5. Core Operational Engines
from .agency_dna import AgencyDNA, PricingTier, Service, Tone
from .client_magnet import Client, ClientMagnet, Lead, LeadSource, LeadStatus
from .content_factory import ContentFactory, ContentIdea, ContentPiece, ContentType
from .revenue_engine import RevenueEngine
from .sales_pipeline import SalesPipeline
from .vibe_ide import VIBEIDE
from .vibe_orchestrator import VIBEOrchestrator

# 6. VIBE IDE (Developer Experience)
from .vibe_workflow import VIBEWorkflow

# 7. Domain Models
# NOTE: Using try-except if models dir structure is still being refactored
try:
    from .models import (
        AgentTask,
        AgentType,
        ChainResult,
        CodeReviewResult,
        DealStage,
        ExecutionMode,
        Forecast,
        Invoice,
        InvoiceStatus,
        Plan,
        StartupDeal,
        Task,
        TaskStatus,
        TodoItem,
        WinCheck,
        WinType,
        WorkflowStep,
    )
except ImportError:
    # Fallback placeholders for models if not yet available
    pass

__all__ = [
    # Infrastructure
    "BaseModel",
    "BaseEngine",
    "AntigravityError",
    "ValidationError",
    "PersistenceError",
    "WinWinWinError",
    "WorkflowError",
    "ConfigError",
    # Configuration
    "Currency",
    "EXCHANGE_RATES",
    "ARR_TARGET_2026",
    "DealTier",
    "TIER_PRICING",
    "MAX_FILE_LINES",
    "DEFAULT_GROWTH_RATE",
    # Persistence
    "JSONStore",
    "get_persistence_store",
    "persist_save",
    "persist_load",
    "save_data",
    "load_data",
    # Operations
    "AgencyDNA",
    "Tone",
    "PricingTier",
    "Service",
    "ClientMagnet",
    "Lead",
    "Client",
    "LeadSource",
    "LeadStatus",
    "ContentFactory",
    "ContentIdea",
    "ContentPiece",
    "ContentType",
    "RevenueEngine",
    "SalesPipeline",
    # DX / VIBE
    "VIBEWorkflow",
    "VIBEIDE",
    "VIBEOrchestrator",
]
