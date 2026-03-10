"""Founder IPO Day — IPO day execution engine.

Pricing scenarios, timeline, week-one checklist, founder milestone.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass
from pathlib import Path

logger = logging.getLogger(__name__)


# ── Data Models ──────────────────────────────────────────────────────


@dataclass
class PricingScenario:
    price: float
    shares_offered: int
    gross_proceeds: float
    market_cap: float
    first_day_pop_pct: float


@dataclass
class IPOTimeline:
    time: str
    event: str
    responsible: str


@dataclass
class WeekOneTask:
    task: str
    deadline: str
    completed: bool = False


@dataclass
class IPODayPlan:
    pricing_scenarios: list[PricingScenario]
    timeline: list[IPOTimeline]
    week_one_checklist: list[WeekOneTask]
    speech_template: str
    founder_milestone: dict


# ── Constants ─────────────────────────────────────────────────────────

# (time, event, responsible)
_TIMELINE_DATA = (
    ("05:00", "Wake up, media prep, review final pricing memo", "Founder/CEO"),
    ("06:30", "Final pricing call with bankers — confirm offer price", "CEO + CFO + Bankers"),
    ("07:00", "Pre-open TV interviews (CNBC, Bloomberg)", "CEO + IR"),
    ("08:00", "Travel to NYSE/Nasdaq, team photo on trading floor", "Founding team"),
    ("09:00", "Breakfast with lead underwriter, final Q&A prep", "CEO + CFO + Bankers"),
    ("09:30", "Opening bell ceremony — ring the bell", "CEO + Board"),
    ("09:31", "Trading begins — first print on screen", "Exchange"),
    ("10:00", "Monitor trading, track first-day pop, media availability", "CEO + IR"),
    ("12:00", "Team lunch — celebrate with employees and investors", "All hands"),
    ("13:00", "Analyst briefing calls (post-quiet period scheduled)", "CFO + IR"),
    ("15:30", "Closing bell ceremony", "CEO + Board"),
    ("16:00", "Market close — announce final first-day price and market cap", "CEO + PR"),
    ("18:00", "IPO day celebration dinner with board and lead investors", "Full team"),
)

IPO_DAY_TIMELINE: list[IPOTimeline] = [IPOTimeline(*row) for row in _TIMELINE_DATA]

# (task, deadline)
_CHECKLIST_DATA = (
    ("File S-1 final prospectus with SEC (424B4)", "IPO Day +1"),
    ("Distribute lock-up agreement reminders to all insiders", "IPO Day +1"),
    ("Implement insider trading policy and pre-clearance procedures", "IPO Day +2"),
    ("Hold all-hands employee meeting — explain share access & trading windows", "IPO Day +2"),
    ("Brief board on first-day trading, volume, analyst coverage lined up", "IPO Day +3"),
    ("Engage IR firm for ongoing investor relations support", "IPO Day +3"),
    ("Set up quiet period calendar — 25 days post-IPO no analyst guidance", "IPO Day +3"),
    ("Schedule analyst initiation coverage kickoffs (post quiet period)", "IPO Day +5"),
    ("Configure Edgar filing calendar — 10-Q due 45 days post quarter end", "IPO Day +5"),
    ("Review Reg FD policy with legal — no material non-public info to select investors", "IPO Day +7"),
    ("Establish earnings call cadence and first earnings date", "IPO Day +7"),
    ("Set up stock admin platform (Carta/Shareworks) for employee equity", "IPO Day +7"),
)

WEEK_ONE_CHECKLIST: list[WeekOneTask] = [WeekOneTask(*row) for row in _CHECKLIST_DATA]

SPEECH_TEMPLATE: str = (
    "Today is a milestone — not the finish line, but a launchpad.\n\n"
    "When we started {company_name}, we believed {mission}.\n"
    "{years} years ago, we had nothing but conviction and a few laptops.\n\n"
    "To our customers: you made this possible.\n"
    "To our employees: you built this. Every line of code, every late night.\n"
    "To our early investors: you saw what others couldn't. We will not forget that.\n\n"
    "Today, {company_name} joins the public markets. Our obligation just got bigger.\n"
    "That trust is sacred. We will earn it every quarter.\n\n"
    "The best is ahead of us. Let's get back to work.\n\n"
    "— {ceo_name}, {date}"
)


# ── Core Functions ────────────────────────────────────────────────────


def model_pricing(
    valuation: float,
    shares_outstanding: int,
    shares_offered_pct: float,
    price_range_low: float,
    price_range_high: float,
) -> list[PricingScenario]:
    """Generate low/mid/high pricing scenarios with 15%/10%/5% first-day pop estimates."""
    price_mid = (price_range_low + price_range_high) / 2.0
    scenarios = []
    for price, pop in zip(
        [price_range_low, price_mid, price_range_high],
        [0.15, 0.10, 0.05],
    ):
        shares_offered = int(shares_outstanding * (shares_offered_pct / 100))
        scenarios.append(PricingScenario(
            price=round(price, 2),
            shares_offered=shares_offered,
            gross_proceeds=round(price * shares_offered, 2),
            market_cap=round(price * shares_outstanding, 2),
            first_day_pop_pct=pop,
        ))
    return scenarios


def calculate_founder_milestone(
    ipo_price: float,
    founder_shares: int,
    years_building: int,
) -> dict:
    """Return founder wealth metrics at IPO pricing."""
    founder_value = round(ipo_price * founder_shares, 2)
    return {
        "ipo_price": ipo_price,
        "founder_shares": founder_shares,
        "founder_value": founder_value,
        "years_building": years_building,
        "paper_gain_per_year": round(founder_value / max(years_building, 1), 2),
        "lock_up_expiry_days": 180,
    }


def build_ipo_day_plan(
    company_name: str,
    valuation: float,
    shares_outstanding: int,
    shares_offered_pct: float,
    price_range: tuple[float, float],
) -> IPODayPlan:
    """Build a complete IPO day plan from pricing inputs."""
    scenarios = model_pricing(
        valuation=valuation,
        shares_outstanding=shares_outstanding,
        shares_offered_pct=shares_offered_pct,
        price_range_low=price_range[0],
        price_range_high=price_range[1],
    )
    mid_price = round((price_range[0] + price_range[1]) / 2.0, 2)
    milestone = calculate_founder_milestone(
        ipo_price=mid_price,
        founder_shares=int(shares_outstanding * 0.15),
        years_building=5,
    )
    speech = SPEECH_TEMPLATE.replace("{company_name}", company_name)
    return IPODayPlan(
        pricing_scenarios=scenarios,
        timeline=list(IPO_DAY_TIMELINE),
        week_one_checklist=[WeekOneTask(t.task, t.deadline) for t in WEEK_ONE_CHECKLIST],
        speech_template=speech,
        founder_milestone=milestone,
    )


# ── Save Functions ────────────────────────────────────────────────────


def save_ipo_day_plan(output_dir: str, plan: IPODayPlan) -> list[str]:
    """Persist IPO day plan to .mekong/ipo/ directory. Returns saved paths."""
    base = Path(output_dir) / ".mekong" / "ipo"
    base.mkdir(parents=True, exist_ok=True)
    files = {
        "ipo-day-plan.json": asdict(plan),
        "ipo-pricing-scenarios.json": [asdict(s) for s in plan.pricing_scenarios],
        "ipo-week-one-checklist.json": [asdict(t) for t in plan.week_one_checklist],
    }
    saved = []
    for name, data in files.items():
        p = base / name
        p.write_text(json.dumps(data, indent=2, default=str))
        saved.append(str(p))
    return saved
