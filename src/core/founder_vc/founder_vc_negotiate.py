"""Founder VC Negotiate — /founder negotiate backend.

Negotiation strategy engine: BATNA assessment, walk-away lines,
counter-term scripts, pressure tactic responses.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from pathlib import Path

logger = logging.getLogger(__name__)


# ── Data Models ──────────────────────────────────────────────────────


@dataclass
class BATNAFactor:
    """A single factor in BATNA strength assessment."""

    label: str
    met: bool
    weight: int = 1


@dataclass
class BATNAAssessment:
    """Best Alternative To Negotiated Agreement score."""

    factors: list[BATNAFactor] = field(default_factory=list)

    @property
    def score(self) -> int:
        return sum(f.weight for f in self.factors if f.met)

    @property
    def max_score(self) -> int:
        return sum(f.weight for f in self.factors)

    @property
    def strength(self) -> str:
        pct = (self.score / self.max_score * 100) if self.max_score > 0 else 0
        if pct >= 80:
            return "STRONG"
        if pct >= 50:
            return "MODERATE"
        return "WEAK"

    @property
    def strategy(self) -> str:
        s = self.strength
        if s == "STRONG":
            return "AGGRESSIVE — negotiate every term, can walk away"
        if s == "MODERATE":
            return "BALANCED — negotiate key terms, compromise on minor"
        return "CAREFUL — build more traction before negotiating"


@dataclass
class WalkAwayLine:
    """A specific boundary the founder won't cross."""

    term: str
    floor_value: str
    rationale: str


@dataclass
class CounterScript:
    """A negotiation script for a specific term."""

    term_name: str
    their_position: str
    your_counter: str
    script: str
    fallback: str


@dataclass
class PressureTactic:
    """How to handle a specific VC pressure tactic."""

    tactic: str
    reality: str
    response: str


@dataclass
class NegotiationPrep:
    """Complete negotiation preparation package."""

    batna: BATNAAssessment
    walk_away_lines: list[WalkAwayLine] = field(default_factory=list)
    counter_scripts: list[CounterScript] = field(default_factory=list)
    pressure_responses: list[PressureTactic] = field(default_factory=list)
    closing_checklist: list[str] = field(default_factory=list)


# ── Constants ────────────────────────────────────────────────────────

PRESSURE_TACTICS = [
    PressureTactic(
        tactic="We need an answer by Friday",
        reality="Artificial urgency is almost always fake",
        response=(
            "We want to work with you but we make considered decisions. "
            "We'll have our answer by [your date, 3-5 days later]."
        ),
    ),
    PressureTactic(
        tactic="We have 2 other companies we're looking at",
        reality="May be true, may not be — counter with your own FOMO",
        response=(
            "That's fine — we're talking to a few investors ourselves. "
            "Let's focus on whether we're the right fit for each other."
        ),
    ),
    PressureTactic(
        tactic="This is our standard term sheet",
        reality="Every term sheet is negotiable",
        response=(
            "We respect your standard — but [clause] doesn't work for our "
            "situation. Can we find a creative structure?"
        ),
    ),
    PressureTactic(
        tactic="All our portfolio companies have these terms",
        reality="You are not their other portfolio companies",
        response=(
            "Different situations at different stages. [Clause] would "
            "misalign incentives in our case because [reason]."
        ),
    ),
    PressureTactic(
        tactic="You're early for this valuation",
        reality="Growth trajectory justifies forward pricing",
        response=(
            "We're growing at [pct]% monthly. In 6 months we'll clearly "
            "justify this valuation at a higher price."
        ),
    ),
]

CLOSING_CHECKLIST = [
    "All MUST FIX issues resolved",
    "Lawyer has reviewed final documents",
    "Cap table modeled post-close",
    "Can execute on milestone this round funds",
    "Genuinely trust this partner",
    "Wire instructions verified (fraud risk)",
    "Cap table updated",
    "First board meeting scheduled",
]

WALK_AWAY_SIGNALS = [
    "Participating liquidation preference they won't remove",
    "Board majority for investor post-seed",
    "Full ratchet anti-dilution",
    "Feeling pressured to sign without full understanding",
    "BATNA is better than this deal",
]


# ── Core Functions ───────────────────────────────────────────────────


def assess_batna(
    current_mrr: float,
    mom_growth_pct: float,
    competing_terms: int = 0,
    runway_months: float = 0,
    revenue_financing_approved: bool = False,
    profitable: bool = False,
) -> BATNAAssessment:
    """Assess founder's BATNA strength."""
    factors = [
        BATNAFactor("MRR > $25K growing > 15%/mo", current_mrr > 25_000 and mom_growth_pct > 15, 2),
        BATNAFactor("2+ competing term sheets", competing_terms >= 2, 2),
        BATNAFactor("18+ months runway", runway_months >= 18, 1),
        BATNAFactor("Revenue-based financing approved", revenue_financing_approved, 1),
        BATNAFactor("Profitable or clear path", profitable, 2),
        BATNAFactor("MoM growth > 15%", mom_growth_pct > 15, 1),
        BATNAFactor("MRR > $10K", current_mrr > 10_000, 1),
    ]
    return BATNAAssessment(factors=factors)


def build_walk_away_lines(
    min_valuation: float,
    max_dilution_pct: float,
    min_founder_board_seats: int = 2,
) -> list[WalkAwayLine]:
    """Define walk-away boundaries."""
    return [
        WalkAwayLine(
            "Valuation floor",
            f"${min_valuation / 1e6:.1f}M pre-money",
            "Below this = giving away too much equity for stage",
        ),
        WalkAwayLine(
            "Max dilution",
            f"{max_dilution_pct}%",
            "Above this = founder loses meaningful control",
        ),
        WalkAwayLine(
            "Board composition",
            f"Minimum {min_founder_board_seats} founder seats",
            "Founder must retain board influence",
        ),
        WalkAwayLine(
            "Liquidation preference",
            "Non-participating only",
            "Participating preferred misaligns incentives",
        ),
        WalkAwayLine(
            "Option pool timing",
            "Post-money only",
            "Pre-money pool is hidden valuation cut",
        ),
    ]


def generate_counter_scripts(
    their_valuation: float,
    your_valuation: float,
    current_mrr: float,
    mom_growth_pct: float,
) -> list[CounterScript]:
    """Generate negotiation counter-scripts for key terms."""
    scripts = [
        CounterScript(
            "Valuation",
            f"${their_valuation / 1e6:.0f}M pre-money",
            f"${your_valuation / 1e6:.0f}M pre-money",
            (
                f"Based on our current metrics — ${current_mrr:,.0f} MRR growing "
                f"{mom_growth_pct:.0f}% monthly — we believe "
                f"${your_valuation / 1e6:.0f}M pre is more appropriate."
            ),
            "Help me understand your valuation model — I want a number that works for both.",
        ),
        CounterScript(
            "Liquidation Preference",
            "1x participating preferred",
            "1x non-participating",
            (
                "Participating preferred misaligns incentives. At a $30M exit, "
                "we'd have less incentive to optimize. Non-participating keeps us aligned."
            ),
            "If participation matters, can we add a 3x cap?",
        ),
        CounterScript(
            "Board Control",
            "2 investor, 1 founder, 1 independent",
            "2 founder, 1 investor, 1 independent",
            (
                "At seed stage, we're still learning what works. "
                "We'd like 2 founder seats and 1 investor seat."
            ),
            "2 founders, 2 investors, 1 independent selected by mutual consent.",
        ),
        CounterScript(
            "Option Pool",
            "15% pre-money",
            "10% post-money",
            (
                "Pre-money option pool is an implicit valuation cut. "
                "Post-money 10% is standard for our stage."
            ),
            "Show cap table model impact both ways.",
        ),
        CounterScript(
            "No-Shop",
            "45-day exclusivity",
            "21 days",
            (
                "45 days is a long no-shop. Can we agree on 21 days with "
                "good-faith milestone extension?"
            ),
            "30 days absolute maximum.",
        ),
    ]
    return scripts


def build_negotiation_prep(
    current_mrr: float,
    mom_growth_pct: float,
    their_valuation: float,
    your_valuation: float,
    min_valuation: float | None = None,
    max_dilution_pct: float = 25.0,
    competing_terms: int = 0,
    runway_months: float = 12.0,
) -> NegotiationPrep:
    """Build complete negotiation preparation package."""
    batna = assess_batna(
        current_mrr, mom_growth_pct,
        competing_terms=competing_terms,
        runway_months=runway_months,
    )

    if min_valuation is None:
        min_valuation = their_valuation * 0.85

    walk_lines = build_walk_away_lines(min_valuation, max_dilution_pct)
    counters = generate_counter_scripts(
        their_valuation, your_valuation, current_mrr, mom_growth_pct,
    )

    return NegotiationPrep(
        batna=batna,
        walk_away_lines=walk_lines,
        counter_scripts=counters,
        pressure_responses=list(PRESSURE_TACTICS),
        closing_checklist=list(CLOSING_CHECKLIST),
    )


# ── Save Functions ───────────────────────────────────────────────────


def save_negotiation_prep(output_dir: str, prep: NegotiationPrep) -> list[str]:
    """Save negotiation preparation files."""
    base = Path(output_dir) / ".mekong" / "raise"
    base.mkdir(parents=True, exist_ok=True)
    saved = []

    path = base / "negotiation-prep.json"
    path.write_text(json.dumps(asdict(prep), indent=2, default=str))
    saved.append(str(path))

    walk_path = base / "walk-away-lines.json"
    walk_path.write_text(json.dumps(
        [asdict(w) for w in prep.walk_away_lines], indent=2,
    ))
    saved.append(str(walk_path))

    scripts_path = base / "counter-scripts.json"
    scripts_path.write_text(json.dumps(
        [asdict(s) for s in prep.counter_scripts], indent=2,
    ))
    saved.append(str(scripts_path))

    return saved
