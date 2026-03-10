"""Founder VC Term Sheet — /founder term-sheet backend.

Term sheet analyzer: extract key terms, detect traps/red flags,
simulate exit scenarios, generate negotiation brief.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Literal

logger = logging.getLogger(__name__)

ClauseRating = Literal["GREEN", "WATCH", "DANGER", "EXTREME_DANGER"]
Verdict = Literal["FOUNDER_FRIENDLY", "STANDARD", "CONCERNING", "PREDATORY"]


# ── Data Models ──────────────────────────────────────────────────────


@dataclass
class EconomicTerms:
    """Economic terms from a term sheet."""

    pre_money_valuation: float
    investment_amount: float
    liquidation_pref_multiple: float = 1.0
    participating: bool = False
    anti_dilution: str = "broad_weighted_avg"
    dividends_pct: float = 0.0
    cumulative_dividends: bool = False
    option_pool_pct: float = 10.0
    option_pool_pre_money: bool = False

    @property
    def post_money_valuation(self) -> float:
        return self.pre_money_valuation + self.investment_amount

    @property
    def investor_ownership_pct(self) -> float:
        if self.post_money_valuation <= 0:
            return 0.0
        return (self.investment_amount / self.post_money_valuation) * 100

    @property
    def effective_pre_money(self) -> float:
        if self.option_pool_pre_money:
            pool_value = (self.option_pool_pct / 100) * self.post_money_valuation
            return self.pre_money_valuation - pool_value
        return self.pre_money_valuation


@dataclass
class ControlTerms:
    """Control / governance terms."""

    founder_board_seats: int = 2
    investor_board_seats: int = 1
    independent_board_seats: int = 0
    drag_along_threshold_pct: float = 50.0
    drag_along_requires_common: bool = True
    rofr: bool = True
    co_sale: bool = True
    protective_provisions: list[str] = field(default_factory=list)


@dataclass
class FounderTerms:
    """Terms specifically affecting founders."""

    vesting_years: int = 4
    cliff_months: int = 12
    acceleration: str = "double_trigger"  # "none" | "single" | "double_trigger"
    non_compete_months: int = 12
    no_shop_days: int = 30
    vesting_credit_months: int = 0


@dataclass
class ClauseAnalysis:
    """Analysis of a single term sheet clause."""

    clause_name: str
    current_term: str
    rating: ClauseRating
    market_standard: str
    impact: str
    counter: str


@dataclass
class ExitScenario:
    """Exit payout simulation."""

    exit_value: float
    vc_payout_non_part: float
    vc_payout_part: float
    founder_payout_non_part: float
    founder_payout_part: float
    founder_delta: float


@dataclass
class TermSheetAnalysis:
    """Complete term sheet analysis result."""

    economic: EconomicTerms
    control: ControlTerms
    founder: FounderTerms
    clause_analyses: list[ClauseAnalysis] = field(default_factory=list)
    exit_scenarios: list[ExitScenario] = field(default_factory=list)
    verdict: Verdict = "STANDARD"
    danger_count: int = 0
    watch_count: int = 0
    green_count: int = 0


# ── Core Functions ───────────────────────────────────────────────────


def analyze_clause(
    name: str,
    term: str,
    rating: ClauseRating,
    standard: str,
    impact: str,
    counter: str,
) -> ClauseAnalysis:
    """Create a clause analysis."""
    return ClauseAnalysis(
        clause_name=name,
        current_term=term,
        rating=rating,
        market_standard=standard,
        impact=impact,
        counter=counter,
    )


def analyze_term_sheet(
    economic: EconomicTerms,
    control: ControlTerms | None = None,
    founder: FounderTerms | None = None,
) -> TermSheetAnalysis:
    """Analyze a complete term sheet and detect traps."""
    if control is None:
        control = ControlTerms()
    if founder is None:
        founder = FounderTerms()

    clauses: list[ClauseAnalysis] = []

    # 1. Option pool shuffle
    if economic.option_pool_pre_money:
        eff = economic.effective_pre_money
        clauses.append(analyze_clause(
            "Option Pool Shuffle",
            f"{economic.option_pool_pct}% pre-money",
            "DANGER",
            "Option pool created post-money",
            f"Effective pre-money drops to ${eff / 1e6:.1f}M",
            "Option pool to be created post-closing",
        ))
    else:
        clauses.append(analyze_clause(
            "Option Pool", f"{economic.option_pool_pct}% post-money",
            "GREEN", "Post-money is standard", "No hidden dilution",
            "Acceptable as-is",
        ))

    # 2. Liquidation preference
    if economic.participating:
        rating = "EXTREME_DANGER" if economic.liquidation_pref_multiple >= 2 else "DANGER"
        clauses.append(analyze_clause(
            "Liquidation Preference",
            f"{economic.liquidation_pref_multiple}x participating",
            rating,
            "1x non-participating preferred",
            "VC double-dips on exit proceeds",
            "Non-participating preferred, or cap at 3x",
        ))
    elif economic.liquidation_pref_multiple > 1:
        clauses.append(analyze_clause(
            "Liquidation Preference",
            f"{economic.liquidation_pref_multiple}x non-participating",
            "WATCH",
            "1x non-participating",
            f"VC gets {economic.liquidation_pref_multiple}x before common",
            "Negotiate to 1x",
        ))
    else:
        clauses.append(analyze_clause(
            "Liquidation Preference", "1x non-participating",
            "GREEN", "1x non-participating", "Standard protection",
            "Acceptable",
        ))

    # 3. Anti-dilution
    ad_ratings = {
        "full_ratchet": "EXTREME_DANGER",
        "narrow_weighted_avg": "WATCH",
        "broad_weighted_avg": "GREEN",
    }
    ad_rating = ad_ratings.get(economic.anti_dilution, "WATCH")
    clauses.append(analyze_clause(
        "Anti-Dilution", economic.anti_dilution, ad_rating,
        "Broad-based weighted average",
        "Full ratchet causes catastrophic founder dilution in down rounds"
        if ad_rating != "GREEN" else "Standard protection",
        "Broad-based weighted average anti-dilution only",
    ))

    # 4. Board control
    investor_majority = control.investor_board_seats > control.founder_board_seats
    if investor_majority:
        clauses.append(analyze_clause(
            "Board Control",
            f"{control.investor_board_seats}I-{control.founder_board_seats}F-{control.independent_board_seats}Ind",
            "DANGER",
            "Founder majority at seed, balanced at Series A",
            "Investor can fire founder, block M&A",
            "Equal board until Series B",
        ))
    else:
        clauses.append(analyze_clause(
            "Board Control",
            f"{control.founder_board_seats}F-{control.investor_board_seats}I-{control.independent_board_seats}Ind",
            "GREEN", "Founder majority is standard at seed",
            "Founder retains control", "Acceptable",
        ))

    # 5. Drag-along
    if not control.drag_along_requires_common:
        clauses.append(analyze_clause(
            "Drag-Along", "Majority of preferred only",
            "DANGER", "Requires majority of common AND preferred",
            "VC can force sale without founder consent",
            "Drag-along requires majority of common shareholders",
        ))
    else:
        clauses.append(analyze_clause(
            "Drag-Along", "Requires common majority", "GREEN",
            "Both common and preferred must agree", "Founder has veto",
            "Acceptable",
        ))

    # 6. Founder vesting
    if founder.vesting_credit_months == 0 and founder.vesting_years == 4:
        clauses.append(analyze_clause(
            "Founder Vesting", "4yr re-vest from closing, no credit",
            "WATCH", "Credit for time already worked",
            "Founder loses credit for prior work",
            "Founders credit for prior months of service",
        ))
    else:
        clauses.append(analyze_clause(
            "Founder Vesting",
            f"{founder.vesting_years}yr, {founder.vesting_credit_months}mo credit",
            "GREEN", "Credit for time worked", "Fair vesting", "Acceptable",
        ))

    # 7. No-shop
    if founder.no_shop_days > 30:
        clauses.append(analyze_clause(
            "No-Shop", f"{founder.no_shop_days} days",
            "WATCH", "30 days maximum",
            "VC strings you along, kills other deals",
            "30 days maximum with good faith milestones",
        ))
    else:
        clauses.append(analyze_clause(
            "No-Shop", f"{founder.no_shop_days} days",
            "GREEN", "30 days is standard",
            "Reasonable exclusivity", "Acceptable",
        ))

    # 8. Non-compete
    if founder.non_compete_months > 12:
        clauses.append(analyze_clause(
            "Non-Compete", f"{founder.non_compete_months} months",
            "WATCH", "12 months, narrowly defined",
            "Founder trapped for extended period",
            "1 year, limited to direct competitive products",
        ))
    else:
        clauses.append(analyze_clause(
            "Non-Compete", f"{founder.non_compete_months} months",
            "GREEN", "12 months or less", "Reasonable scope",
            "Acceptable",
        ))

    # Tally ratings
    danger = sum(1 for c in clauses if c.rating in ("DANGER", "EXTREME_DANGER"))
    watch = sum(1 for c in clauses if c.rating == "WATCH")
    green = sum(1 for c in clauses if c.rating == "GREEN")

    if danger >= 3:
        verdict: Verdict = "PREDATORY"
    elif danger >= 2:
        verdict = "CONCERNING"
    elif danger >= 1 or watch >= 3:
        verdict = "STANDARD"
    else:
        verdict = "FOUNDER_FRIENDLY"

    return TermSheetAnalysis(
        economic=economic,
        control=control,
        founder=founder,
        clause_analyses=clauses,
        verdict=verdict,
        danger_count=danger,
        watch_count=watch,
        green_count=green,
    )


def simulate_exit(
    investment: float,
    investor_pct: float,
    liq_pref_multiple: float,
    exit_values: list[float] | None = None,
) -> list[ExitScenario]:
    """Simulate exit payouts at various valuations."""
    if exit_values is None:
        exit_values = [5e6, 20e6, 50e6, 100e6]

    scenarios = []
    pref_amount = investment * liq_pref_multiple
    frac = investor_pct / 100

    for ev in exit_values:
        # Non-participating: max(pref, ownership share)
        non_part_vc = max(pref_amount, ev * frac)
        non_part_founder = ev - non_part_vc

        # Participating: pref + share of remainder
        remainder = max(0, ev - pref_amount)
        part_vc = pref_amount + remainder * frac
        part_founder = ev - part_vc

        scenarios.append(ExitScenario(
            exit_value=ev,
            vc_payout_non_part=round(non_part_vc, 2),
            vc_payout_part=round(part_vc, 2),
            founder_payout_non_part=round(non_part_founder, 2),
            founder_payout_part=round(part_founder, 2),
            founder_delta=round(non_part_founder - part_founder, 2),
        ))

    return scenarios


# ── Save Functions ───────────────────────────────────────────────────


def save_term_sheet_analysis(
    output_dir: str,
    analysis: TermSheetAnalysis,
) -> list[str]:
    """Save term sheet analysis files."""
    base = Path(output_dir) / ".mekong" / "raise"
    base.mkdir(parents=True, exist_ok=True)
    saved = []

    # Main analysis
    path = base / "term-sheet-analysis.json"
    path.write_text(json.dumps(asdict(analysis), indent=2, default=str))
    saved.append(str(path))

    # Negotiation brief
    must_fix = [c for c in analysis.clause_analyses if c.rating in ("DANGER", "EXTREME_DANGER")]
    should_fix = [c for c in analysis.clause_analyses if c.rating == "WATCH"]
    brief = {
        "verdict": analysis.verdict,
        "must_fix": [asdict(c) for c in must_fix],
        "should_fix": [asdict(c) for c in should_fix],
    }
    neg_path = base / "term-sheet-negotiation.json"
    neg_path.write_text(json.dumps(brief, indent=2))
    saved.append(str(neg_path))

    return saved
