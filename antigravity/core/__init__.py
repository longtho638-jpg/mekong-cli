"""
AntigravityKit Core Module

Provides all core functionality for agency management:
- Agency identity (AgencyDNA)
- Lead generation (ClientMagnet)
- Content creation (ContentFactory)
- Revenue tracking (RevenueEngine)
- Sales pipeline (SalesPipeline)
- VIBE IDE (VIBEWorkflow, VIBEIDE, VIBEOrchestrator)

🏯 "Không đánh mà thắng" - Win Without Fighting
"""

# Base classes
from .base import BaseModel, BaseEngine

# Errors
from .errors import (
    AntigravityError,
    ValidationError,
    PersistenceError,
    WinWinWinError,
    WorkflowError,
    ConfigError
)

# Configuration
from .config import (
    Currency,
    EXCHANGE_RATES,
    ARR_TARGET_2026,
    DealTier,
    TIER_PRICING,
    MAX_FILE_LINES,
    DEFAULT_GROWTH_RATE
)

# Persistence
from .persistence import JSONStore, save_data, load_data

# Core modules
from .agency_dna import AgencyDNA, Tone, PricingTier, Service
from .client_magnet import ClientMagnet, Lead, Client, LeadSource, LeadStatus
from .content_factory import ContentFactory, ContentIdea, ContentPiece, ContentType
from .revenue_engine import RevenueEngine
from .sales_pipeline import SalesPipeline

# VIBE IDE
from .vibe_workflow import VIBEWorkflow
from .vibe_ide import VIBEIDE
from .vibe_orchestrator import VIBEOrchestrator

# Models
from .models import (
    Invoice, InvoiceStatus, Forecast,
    StartupDeal, DealStage,
    WinCheck, WinType,
    Task, TaskStatus, WorkflowStep, CodeReviewResult,
    Plan, TodoItem,
    AgentTask, AgentType, ChainResult, ExecutionMode
)

__all__ = [
    # Base
    'BaseModel', 'BaseEngine',
    # Errors
    'AntigravityError', 'ValidationError', 'PersistenceError',
    'WinWinWinError', 'WorkflowError', 'ConfigError',
    # Config
    'Currency', 'EXCHANGE_RATES', 'ARR_TARGET_2026',
    'DealTier', 'TIER_PRICING', 'MAX_FILE_LINES', 'DEFAULT_GROWTH_RATE',
    # Persistence
    'JSONStore', 'save_data', 'load_data',
    # Core
    'AgencyDNA', 'Tone', 'PricingTier', 'Service',
    'ClientMagnet', 'Lead', 'Client', 'LeadSource', 'LeadStatus',
    'ContentFactory', 'ContentIdea', 'ContentPiece', 'ContentType',
    'RevenueEngine', 'SalesPipeline',
    # VIBE
    'VIBEWorkflow', 'VIBEIDE', 'VIBEOrchestrator',
    # Models
    'Invoice', 'InvoiceStatus', 'Forecast',
    'StartupDeal', 'DealStage',
    'WinCheck', 'WinType',
    'Task', 'TaskStatus', 'WorkflowStep', 'CodeReviewResult',
    'Plan', 'TodoItem',
    'AgentTask', 'AgentType', 'ChainResult', 'ExecutionMode',
]
