"""Founder VC Bootstrap — /founder bootstrap backend.

Bootstrapping strategy engine: ramen profitability calculator,
$1M ARR path modeling, alternative funding sources, raise-readiness check.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from pathlib import Path

logger = logging.getLogger(__name__)


# ── Data Models ──────────────────────────────────────────────────────


@dataclass
class RamenCalculation:
    """Ramen profitability target."""

    personal_expenses: float
    business_expenses: float
    founder_salary: float
    buffer_pct: float = 20.0

    @property
    def ramen_target(self) -> float:
        base = self.personal_expenses + self.business_expenses + self.founder_salary
        return base * (1 + self.buffer_pct / 100)

    def users_needed(self, avg_price: float) -> int:
        if avg_price <= 0:
            return 0
        return max(1, int(self.ramen_target / avg_price) + 1)

    def weeks_to_ramen(self, current_mrr: float, weekly_growth_pct: float) -> int:
        if weekly_growth_pct <= 0 or current_mrr >= self.ramen_target:
            return 0 if current_mrr >= self.ramen_target else -1
        mrr = current_mrr
        weeks = 0
        while mrr < self.ramen_target and weeks < 520:
            mrr *= 1 + weekly_growth_pct / 100
            weeks += 1
        return weeks


@dataclass
class MilestoneTarget:
    """Monthly MRR milestone on path to $1M ARR."""

    month: int
    mrr_target: float
    users_target: int
    focus: str


@dataclass
class BootstrapPlan:
    """Full bootstrap path to $1M ARR."""

    company_name: str
    ramen: RamenCalculation
    avg_price: float
    current_mrr: float
    milestones: list[MilestoneTarget] = field(default_factory=list)
    strategies: list[str] = field(default_factory=list)


@dataclass
class AlternativeFunding:
    """Non-VC funding source."""

    name: str
    type: str  # "revenue_based" | "grant" | "accelerator" | "strategic"
    amount_range: str
    dilution: str
    requirements: str
    url: str = ""


@dataclass
class RaiseReadiness:
    """Should the founder raise VC?"""

    should_raise: bool
    score: int  # 0-6 criteria met
    criteria_met: list[str] = field(default_factory=list)
    criteria_failed: list[str] = field(default_factory=list)
    verdict: str = ""


# ── Constants ────────────────────────────────────────────────────────

BOOTSTRAP_STRATEGIES = [
    "Charge from day 1 — even $1 validates willingness to pay",
    "Annual plans early — 17% discount + upfront cash flow",
    "Services bridge — sell consulting using your tool at $2K/mo",
    "Lifetime deals — AppSumo $89-249, 1-3K buyers typical",
    "Content compounding — SEO + blog ranks → free users → MRR",
    "Niche then expand — dominate one segment before broadening",
]

BOOTSTRAP_MILESTONES = [
    MilestoneTarget(1, 1_000, 20, "product + 1 channel"),
    MilestoneTarget(3, 5_000, 100, "retention + 1 growth channel"),
    MilestoneTarget(6, 15_000, 300, "word of mouth kicks in"),
    MilestoneTarget(9, 35_000, 700, "sales + content compound"),
    MilestoneTarget(12, 83_000, 1_700, "$1M ARR achieved"),
]

RAISE_CRITERIA = [
    ("MRR > $25K", lambda mrr, growth: mrr > 25_000),
    ("Growth > 15% MoM", lambda mrr, growth: growth > 15),
    ("Specific use for capital", lambda mrr, growth: mrr > 10_000),
    ("Valuation > $10M pre", lambda mrr, growth: mrr > 20_000),
    ("Hit organic growth ceiling", lambda mrr, growth: mrr > 50_000),
    ("Have BATNA", lambda mrr, growth: mrr > 15_000),
]

ALTERNATIVE_FUNDING_DB: list[dict] = [
    {
        "name": "Capchase",
        "type": "revenue_based",
        "amount_range": "$50K-$5M",
        "dilution": "0% — fee 6-8%",
        "requirements": "$50K+ ARR, positive growth",
        "url": "capchase.com",
    },
    {
        "name": "Clearco",
        "type": "revenue_based",
        "amount_range": "$10K-$10M",
        "dilution": "0% — revenue share",
        "requirements": "Revenue-generating SaaS/e-commerce",
        "url": "clearco.com",
    },
    {
        "name": "Pipe",
        "type": "revenue_based",
        "amount_range": "$1K-$5M",
        "dilution": "0% — trade annual contracts",
        "requirements": "Annual subscription contracts",
        "url": "pipe.com",
    },
    {
        "name": "YC",
        "type": "accelerator",
        "amount_range": "$125K-$500K",
        "dilution": "7%",
        "requirements": "Strong founding team + idea",
        "url": "ycombinator.com/apply",
    },
    {
        "name": "Pioneer",
        "type": "accelerator",
        "amount_range": "$8K-$50K",
        "dilution": "1-2%",
        "requirements": "Solo founder friendly, global",
        "url": "pioneer.app",
    },
    {
        "name": "Google for Startups Cloud",
        "type": "grant",
        "amount_range": "$100K credits",
        "dilution": "0%",
        "requirements": "Tech startup, apply online",
        "url": "cloud.google.com/startup",
    },
    {
        "name": "AWS Activate",
        "type": "grant",
        "amount_range": "$100K credits",
        "dilution": "0%",
        "requirements": "Early-stage startup",
        "url": "aws.amazon.com/activate",
    },
    {
        "name": "SBIR/STTR (US)",
        "type": "grant",
        "amount_range": "up to $1.5M",
        "dilution": "0%",
        "requirements": "US C-Corp, research-based tech",
        "url": "sbir.gov",
    },
]


# ── Core Functions ───────────────────────────────────────────────────


def calculate_ramen(
    personal: float,
    business: float,
    salary: float,
    buffer_pct: float = 20.0,
) -> RamenCalculation:
    """Calculate ramen profitability target."""
    return RamenCalculation(
        personal_expenses=personal,
        business_expenses=business,
        founder_salary=salary,
        buffer_pct=buffer_pct,
    )


def build_bootstrap_plan(
    company_name: str,
    current_mrr: float,
    avg_price: float = 49.0,
    personal: float = 2000.0,
    business: float = 65.0,
    salary: float = 1500.0,
) -> BootstrapPlan:
    """Build complete bootstrap path to $1M ARR."""
    ramen = calculate_ramen(personal, business, salary)
    milestones = []
    for m in BOOTSTRAP_MILESTONES:
        users = max(1, int(m.mrr_target / avg_price)) if avg_price > 0 else 0
        milestones.append(
            MilestoneTarget(m.month, m.mrr_target, users, m.focus)
        )
    return BootstrapPlan(
        company_name=company_name,
        ramen=ramen,
        avg_price=avg_price,
        current_mrr=current_mrr,
        milestones=milestones,
        strategies=list(BOOTSTRAP_STRATEGIES),
    )


def get_alternative_funding(
    funding_type: str | None = None,
) -> list[AlternativeFunding]:
    """Get alternative (non-VC) funding sources, optionally filtered by type."""
    sources = []
    for src in ALTERNATIVE_FUNDING_DB:
        if funding_type and src["type"] != funding_type:
            continue
        sources.append(
            AlternativeFunding(
                name=src["name"],
                type=src["type"],
                amount_range=src["amount_range"],
                dilution=src["dilution"],
                requirements=src["requirements"],
                url=src.get("url", ""),
            )
        )
    return sources


def check_raise_readiness(
    current_mrr: float,
    mom_growth_pct: float,
) -> RaiseReadiness:
    """Check if founder should raise VC based on 6 criteria."""
    met = []
    failed = []
    for label, check_fn in RAISE_CRITERIA:
        if check_fn(current_mrr, mom_growth_pct):
            met.append(label)
        else:
            failed.append(label)

    score = len(met)
    should_raise = score >= 4

    if score >= 5:
        verdict = "RAISE — strong position, negotiate from strength"
    elif score >= 4:
        verdict = "CONSIDER — acceptable but build more BATNA first"
    elif score >= 2:
        verdict = "WAIT — bootstrap more, raise readiness insufficient"
    else:
        verdict = "DO NOT RAISE — focus on product and revenue"

    return RaiseReadiness(
        should_raise=should_raise,
        score=score,
        criteria_met=met,
        criteria_failed=failed,
        verdict=verdict,
    )


# ── Save Functions ───────────────────────────────────────────────────


def save_bootstrap_plan(output_dir: str, plan: BootstrapPlan) -> str:
    """Save bootstrap plan to JSON."""
    base = Path(output_dir) / ".mekong" / "founder"
    base.mkdir(parents=True, exist_ok=True)
    path = base / "bootstrap-plan.json"
    data = asdict(plan)
    data["ramen_target"] = plan.ramen.ramen_target
    data["users_needed"] = plan.ramen.users_needed(plan.avg_price)
    path.write_text(json.dumps(data, indent=2, default=str))
    return str(path)


def save_alternatives(output_dir: str) -> str:
    """Save alternative funding sources to JSON."""
    base = Path(output_dir) / ".mekong" / "founder"
    base.mkdir(parents=True, exist_ok=True)
    path = base / "alternatives.json"
    sources = get_alternative_funding()
    path.write_text(json.dumps([asdict(s) for s in sources], indent=2))
    return str(path)
