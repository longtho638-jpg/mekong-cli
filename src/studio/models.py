"""
Pydantic models for VC Studio Platform entities.
All studio data persisted as JSON in .mekong/studio/
"""

from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
import uuid


# === ENUMS ===

class DealStage(str, Enum):
    SOURCED = "sourced"
    SCREENING = "screening"
    FIRST_MEETING = "first_meeting"
    DILIGENCE = "diligence"
    TERM_SHEET = "term_sheet"
    NEGOTIATION = "negotiation"
    CLOSING = "closing"
    CLOSED = "closed"
    PASSED = "passed"


class CompanyStage(str, Enum):
    IDEA = "idea"
    VALIDATION = "validation"
    MVP = "mvp"
    SEED = "seed"
    SERIES_A = "series_a"
    GROWTH = "growth"
    EXIT = "exit"


class PartyRole(str, Enum):
    VC = "vc"
    EXPERT = "expert"
    FOUNDER = "founder"


class TerrainType(str, Enum):
    """Sun Tzu 6 terrain types for market analysis"""
    ACCESSIBLE = "accessible"
    ENTANGLING = "entangling"
    TEMPORIZING = "temporizing"
    NARROW_PASS = "narrow_pass"
    PRECIPITOUS = "precipitous"
    DISTANT = "distant"


class MomentumLevel(str, Enum):
    SURGING = "surging"
    BUILDING = "building"
    STEADY = "steady"
    FADING = "fading"
    STALLED = "stalled"


# === CORE ENTITIES ===

class StudioConfig(BaseModel):
    """Top-level studio configuration"""
    name: str
    thesis_file: str = "thesis.yaml"
    default_equity_pct: float = 30.0
    max_portfolio_size: int = 20
    target_check_size_usd: float = 100000
    currency: str = "USD"
    regions: list[str] = ["global"]
    languages: list[str] = ["en", "vi", "zh"]
    openclaw_model: str = "anthropic/claude-sonnet-4"
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class InvestmentThesis(BaseModel):
    """Investment thesis — filters all deal flow"""
    version: str = "1.0"
    focus_sectors: list[str]
    stage_preference: list[CompanyStage]
    geo_focus: list[str]
    check_size: dict = {"min": 25000, "max": 500000, "sweet_spot": 100000}
    target_ownership_pct: dict = {"min": 15, "max": 40, "target": 30}
    anti_thesis: list[str] = []
    evaluation_weights: dict = {
        "dao": 0.20,
        "thien": 0.25,
        "dia": 0.20,
        "tuong": 0.20,
        "phap": 0.15,
    }
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class PortfolioCompany(BaseModel):
    """A company in the studio portfolio"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    slug: str
    name: str
    stage: CompanyStage
    sector: str
    one_liner: str
    founder_id: Optional[str] = None
    founder_name: Optional[str] = None
    equity_pct: float = 30.0
    invested_usd: float = 0
    valuation_usd: Optional[float] = None
    mrr: float = 0
    arr: float = 0
    burn_rate: float = 0
    runway_months: Optional[float] = None
    team_size: int = 1
    openclaw_active: bool = True
    experts_assigned: list[str] = []
    health_score: float = 50.0
    momentum: MomentumLevel = MomentumLevel.STEADY
    five_factor_scores: dict = {}
    tags: list[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class Deal(BaseModel):
    """Deal in the pipeline"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    company_name: str
    sector: str
    stage: DealStage = DealStage.SOURCED
    source: str
    one_liner: str
    founder_name: Optional[str] = None
    founder_email: Optional[str] = None
    ask_usd: Optional[float] = None
    valuation_usd: Optional[float] = None
    thesis_fit_score: Optional[float] = None
    five_factor_scores: dict = {}
    terrain_type: Optional[TerrainType] = None
    momentum: Optional[MomentumLevel] = None
    notes: list[dict] = []
    next_action: Optional[str] = None
    next_action_date: Optional[str] = None
    pass_reason: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class Expert(BaseModel):
    """Expert in the pool"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    email: str
    specialties: list[str]
    regions: list[str] = ["global"]
    languages: list[str] = ["en"]
    hourly_rate_usd: Optional[float] = None
    equity_open: bool = True
    availability: str = "available"
    rating: float = 0
    engagement_count: int = 0
    bio: str = ""
    portfolio_companies: list[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class Founder(BaseModel):
    """Founder in the pool"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    email: str
    background: str
    skills: list[str]
    sectors_interested: list[str]
    stage_preference: list[CompanyStage] = []
    regions: list[str] = ["global"]
    languages: list[str] = ["en"]
    tuong_score: Optional[dict] = None
    matched_company_id: Optional[str] = None
    status: str = "available"
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class ExpertEngagement(BaseModel):
    """Active expert engagement with a portfolio company"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    expert_id: str
    company_id: str
    scope: str
    type: str = "advisory"
    compensation: str = "equity"
    equity_pct: Optional[float] = None
    start_date: str = Field(default_factory=lambda: datetime.now().isoformat())
    end_date: Optional[str] = None
    status: str = "active"
    rating: Optional[float] = None


class FiveFactorEvaluation(BaseModel):
    """道天地將法 — Complete evaluation for a deal or company"""
    target_name: str
    evaluated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    dao: dict = {}
    thien: dict = {}
    dia: dict = {}
    tuong: dict = {}
    phap: dict = {}
    composite_score: float = 0
    recommendation: str = ""
    confidence: float = 0


class CrossPortfolioInsight(BaseModel):
    """Intelligence derived from cross-portfolio patterns"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    type: str
    description: str
    source_companies: list[str]
    applicable_to: list[str]
    confidence: float = 0.5
    status: str = "proposed"
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class StudioDashboard(BaseModel):
    """Studio-wide dashboard data"""
    total_portfolio_companies: int = 0
    active_companies: int = 0
    total_invested_usd: float = 0
    portfolio_value_usd: float = 0
    total_mrr: float = 0
    avg_health_score: float = 0
    deals_in_pipeline: int = 0
    experts_active: int = 0
    founders_available: int = 0
    top_momentum: list[dict] = []
    alerts: list[dict] = []
    cross_portfolio_insights: int = 0
