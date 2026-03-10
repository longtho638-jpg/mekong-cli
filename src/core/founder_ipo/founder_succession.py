"""Founder IPO Succession — succession planning, buyback, and M&A engine.

Buyback modeling, succession scenarios, emergency plans, and post-IPO strategy.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from pathlib import Path

logger = logging.getLogger(__name__)


# ── Data Models ──────────────────────────────────────────────────────


@dataclass
class BuybackModel:
    """Share buyback financial model."""

    shares_outstanding: int
    buyback_amount: float
    share_price: float
    shares_repurchased: int
    new_shares_outstanding: int
    eps_before: float
    eps_after: float
    eps_accretion_pct: float


@dataclass
class MAScreenCriteria:
    """M&A screening criteria for acquisition targets."""

    max_size_pct: float = 30.0
    max_revenue_multiple: float = 0.0
    strategic_fit: list[str] = field(default_factory=list)
    integration_risk: str = "medium"


@dataclass
class SuccessionScenario:
    """Founder succession path scenario."""

    name: str
    description: str
    founder_role_after: str
    key_actions: list[str]


@dataclass
class EmergencyPlan:
    """Emergency succession plan (sudden founder departure)."""

    successor_name: str
    successor_title: str
    scope: str
    duration_days: int = 90
    limitations: list[str] = field(default_factory=list)


@dataclass
class PostIPOStrategy:
    """Complete post-IPO strategic roadmap."""

    buyback: BuybackModel | None = None
    succession_scenarios: list[SuccessionScenario] = field(default_factory=list)
    emergency_plan: EmergencyPlan | None = None


# ── Constants ────────────────────────────────────────────────────────


SUCCESSION_SCENARIOS: list[dict] = [
    {
        "name": "Founder Stays CEO",
        "description": "Founder continues as CEO with professional management layer added",
        "founder_role_after": "CEO",
        "key_actions": [
            "Hire CFO, COO, and functional VPs to scale operations",
            "Establish board governance with independent directors",
            "Build executive team capable of running day-to-day operations",
            "Focus founder energy on vision, product, and key relationships",
        ],
    },
    {
        "name": "Founder to Executive Chairman",
        "description": "Hire professional CEO; founder transitions to Executive Chairman",
        "founder_role_after": "Executive Chairman",
        "key_actions": [
            "Conduct CEO search 12-18 months before transition",
            "Define clear handoff timeline and responsibility transfer",
            "Retain board chairmanship and strategic influence",
            "Mentor incoming CEO with minimum 6-month overlap period",
        ],
    },
    {
        "name": "Full Transition",
        "description": "Complete exit from operating role; founder becomes board member or advisor",
        "founder_role_after": "Board Member / Advisor",
        "key_actions": [
            "Identify and groom internal successor over 18-24 months",
            "Document institutional knowledge and founder relationships",
            "Negotiate vesting acceleration and lock-up provisions",
            "Establish advisory agreement with clear scope and compensation",
        ],
    },
]

LEGACY_PATHS: list[str] = [
    "Philanthropy — endow foundation, fund public goods aligned with company mission",
    "Angel Investing — leverage domain expertise to back next-generation founders",
    "Next Company — apply learnings to build second venture in adjacent space",
    "Knowledge Transfer — write, teach, advise to compound founder wisdom at scale",
]


# ── Core Functions ───────────────────────────────────────────────────


def model_buyback(
    shares_outstanding: int,
    earnings: float,
    buyback_amount: float,
    share_price: float,
) -> BuybackModel:
    """Model share buyback impact on EPS.

    Calculates shares repurchased, new share count, EPS before/after, accretion %.
    """
    if share_price <= 0:
        share_price = 1.0

    shares_repurchased = int(buyback_amount / share_price)
    new_shares_outstanding = max(1, shares_outstanding - shares_repurchased)

    eps_before = earnings / max(1, shares_outstanding)
    eps_after = earnings / new_shares_outstanding
    eps_accretion_pct = ((eps_after - eps_before) / max(abs(eps_before), 1e-9)) * 100

    return BuybackModel(
        shares_outstanding=shares_outstanding,
        buyback_amount=buyback_amount,
        share_price=share_price,
        shares_repurchased=shares_repurchased,
        new_shares_outstanding=new_shares_outstanding,
        eps_before=round(eps_before, 4),
        eps_after=round(eps_after, 4),
        eps_accretion_pct=round(eps_accretion_pct, 2),
    )


def build_succession_scenarios() -> list[SuccessionScenario]:
    """Build the 3 standard succession scenarios."""
    return [
        SuccessionScenario(
            name=s["name"],
            description=s["description"],
            founder_role_after=s["founder_role_after"],
            key_actions=list(s["key_actions"]),
        )
        for s in SUCCESSION_SCENARIOS
    ]


def create_emergency_plan(
    successor_name: str,
    successor_title: str,
) -> EmergencyPlan:
    """Create emergency succession plan with standard scope and limitations."""
    limitations = [
        "No major acquisitions or divestitures without full board approval",
        "No changes to executive compensation or equity plans",
        "No material changes to company strategy or business model",
        "Capital expenditures above $500K require board committee sign-off",
        "Interim authority expires after 90 days unless board extends",
    ]
    return EmergencyPlan(
        successor_name=successor_name,
        successor_title=successor_title,
        scope="Full operational authority excluding major strategic decisions",
        duration_days=90,
        limitations=limitations,
    )


def build_post_ipo_strategy(
    shares_outstanding: int,
    earnings: float,
    buyback_amount: float,
    share_price: float,
    successor_name: str,
    successor_title: str,
) -> PostIPOStrategy:
    """Build complete post-IPO strategy with buyback model, succession, and emergency plan."""
    buyback = model_buyback(shares_outstanding, earnings, buyback_amount, share_price)
    scenarios = build_succession_scenarios()
    emergency = create_emergency_plan(successor_name, successor_title)

    return PostIPOStrategy(
        buyback=buyback,
        succession_scenarios=scenarios,
        emergency_plan=emergency,
    )


# ── Save Functions ───────────────────────────────────────────────────


def save_post_ipo_strategy(output_dir: str, strategy: PostIPOStrategy) -> list[str]:
    """Save post-IPO strategy components to JSON files. Returns list of saved paths."""
    base = Path(output_dir) / ".mekong" / "founder" / "ipo"
    base.mkdir(parents=True, exist_ok=True)

    saved: list[str] = []

    if strategy.buyback:
        buyback_path = base / "buyback-model.json"
        buyback_path.write_text(json.dumps(asdict(strategy.buyback), indent=2))
        saved.append(str(buyback_path))

    scenarios_path = base / "succession-scenarios.json"
    scenarios_data = {
        "scenarios": [asdict(s) for s in strategy.succession_scenarios],
        "legacy_paths": LEGACY_PATHS,
    }
    scenarios_path.write_text(json.dumps(scenarios_data, indent=2))
    saved.append(str(scenarios_path))

    if strategy.emergency_plan:
        emergency_path = base / "emergency-plan.json"
        emergency_path.write_text(
            json.dumps(asdict(strategy.emergency_plan), indent=2)
        )
        saved.append(str(emergency_path))

    strategy_path = base / "post-ipo-strategy.json"
    strategy_path.write_text(json.dumps(asdict(strategy), indent=2, default=str))
    saved.append(str(strategy_path))

    return saved
