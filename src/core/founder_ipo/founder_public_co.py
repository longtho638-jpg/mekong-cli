"""Founder Public Co — public company operations engine.

Earnings calendar, guidance modeling, quarterly metrics, material events.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from datetime import date, timedelta
from pathlib import Path

logger = logging.getLogger(__name__)

# ── Data Models ──────────────────────────────────────────────────────

@dataclass
class EarningsCalendar:
    quarter: str
    earnings_date: str
    filing_deadline: str
    quiet_period_start: str

@dataclass
class GuidanceModel:
    revenue_low: float
    revenue_high: float
    growth_pct: float
    confidence_level: float = 0.92

@dataclass
class QuarterlyMetrics:
    quarter: str
    revenue: float
    arr: float
    gross_margin_pct: float
    nrr_pct: float
    customers: int
    fcf: float
    guidance_beat_pct: float = 0.0

@dataclass
class MaterialEvent:
    event_type: str
    description: str
    filing_required: str
    deadline_days: int = 4

@dataclass
class PublicCoPackage:
    earnings_calendar: list[EarningsCalendar]
    current_metrics: QuarterlyMetrics | None = None
    guidance: GuidanceModel | None = None
    material_events: list[MaterialEvent] = field(default_factory=list)

# ── Constants ─────────────────────────────────────────────────────────

# (event_type, description, filing_required) — all deadline_days=4 (SEC 8-K rule)
_MATERIAL_EVENT_DATA = (
    ("Major Acquisition", "Acquisition/disposition >10% total assets", "8-K Item 1.01/2.01"),
    ("CEO / CFO Departure", "Principal officer departure, appointment, or pay change", "8-K Item 5.02"),
    ("Cybersecurity Incident", "Material breach per SEC Rule 13a-15 (eff. Dec 2023)", "8-K Item 1.05"),
    ("Bankruptcy / Receivership", "Filing for or material risk of bankruptcy/insolvency", "8-K Item 1.03"),
    ("Amendment to Articles / Bylaws", "Change to certificate of incorporation or bylaws", "8-K Item 5.03"),
    ("New Material Definitive Agreement", "Entry into or termination of material agreement", "8-K Item 1.01"),
    ("Unregistered Equity Sale", "Private placement or unregistered equity sale", "8-K Item 3.02"),
    ("Financial Restatement", "Prior financials should no longer be relied upon", "8-K Item 4.02"),
)

MATERIAL_EVENT_TYPES: list[dict] = [
    {"event_type": e, "description": d, "filing_required": f, "deadline_days": 4}
    for e, d, f in _MATERIAL_EVENT_DATA
]

# 57-min earnings call: Safe Harbor(2) + CEO(8) + CFO+Guidance(15) + Q&A(30) + Close(2)
EARNINGS_CALL_STRUCTURE: dict = {
    "sections": [
        {"name": "Safe Harbor", "duration_min": 2, "speaker": "IR"},
        {"name": "CEO Operational Highlights", "duration_min": 8, "speaker": "CEO"},
        {"name": "CFO Financial Review + Guidance", "duration_min": 15, "speaker": "CFO"},
        {"name": "Q&A — Sell-Side Analysts", "duration_min": 30, "speaker": "CEO + CFO"},
        {"name": "Closing Remarks", "duration_min": 2, "speaker": "CEO"},
    ],
    "total_duration_min": 57,
    "pre_call_prep": [
        "Finalize press release 24h before open",
        "Brief CEO/CFO on analyst questions",
        "Distribute 8-K with press release before call",
    ],
}

# ── Core Functions ────────────────────────────────────────────────────

def build_earnings_calendar(fiscal_year_start_month: int) -> list[EarningsCalendar]:
    """Generate Q1-Q4 earnings filing calendar. 10-K: 60d; 10-Q: 45d (large accelerated)."""
    year = date.today().year
    calendar: list[EarningsCalendar] = []
    for q in range(1, 5):
        qe_month = (fiscal_year_start_month - 1 + q * 3) % 12 or 12
        qe_year = year if qe_month >= fiscal_year_start_month else year + 1
        qe = (date(qe_year, 12, 31) if qe_month == 12
              else date(qe_year, qe_month + 1, 1) - timedelta(days=1))
        earnings_dt = qe + timedelta(days=30)
        calendar.append(EarningsCalendar(
            quarter=f"Q{q}",
            earnings_date=earnings_dt.isoformat(),
            filing_deadline=(qe + timedelta(days=60 if q == 4 else 45)).isoformat(),
            quiet_period_start=(earnings_dt - timedelta(days=14)).isoformat(),
        ))
    return calendar


def calculate_guidance(
    current_revenue: float,
    growth_rate: float,
    churn_rate: float,
    signed_contracts: float,
) -> GuidanceModel:
    """Quarterly-compounded guidance with 50% pipeline credit and 5% safety margin."""
    base = current_revenue * (1 + (1 + growth_rate) ** 0.25 - 1 - (1 - (1 - churn_rate) ** 0.25))
    base += signed_contracts * 0.50
    mid = base * 0.95
    growth_pct = round(((mid / current_revenue) ** 4 - 1) * 100, 2) if current_revenue > 0 else 0.0
    return GuidanceModel(
        revenue_low=round(mid * 0.97, 2), revenue_high=round(mid * 1.03, 2),
        growth_pct=growth_pct, confidence_level=0.92,
    )


def build_quarterly_report(
    quarter: str, revenue: float, arr: float, gm_pct: float, nrr_pct: float,
    customers: int, fcf: float, prev_guidance_mid: float,
) -> QuarterlyMetrics:
    """Build quarterly metrics with guidance beat/miss pct."""
    beat = (round(((revenue - prev_guidance_mid) / prev_guidance_mid) * 100, 2)
            if prev_guidance_mid > 0 else 0.0)
    return QuarterlyMetrics(
        quarter=quarter, revenue=round(revenue, 2), arr=round(arr, 2),
        gross_margin_pct=round(gm_pct, 2), nrr_pct=round(nrr_pct, 2),
        customers=customers, fcf=round(fcf, 2), guidance_beat_pct=beat,
    )


def get_material_events() -> list[MaterialEvent]:
    """Return standard 8-K reportable material event types."""
    return [MaterialEvent(**e) for e in MATERIAL_EVENT_TYPES]


def build_public_co_package(
    fiscal_year_start: int, quarter: str, revenue: float, arr: float,
    gm_pct: float, nrr_pct: float, customers: int, fcf: float,
) -> PublicCoPackage:
    """Build complete public company operations package for current quarter."""
    return PublicCoPackage(
        earnings_calendar=build_earnings_calendar(fiscal_year_start),
        current_metrics=build_quarterly_report(
            quarter=quarter, revenue=revenue, arr=arr, gm_pct=gm_pct,
            nrr_pct=nrr_pct, customers=customers, fcf=fcf, prev_guidance_mid=0.0,
        ),
        guidance=calculate_guidance(
            current_revenue=revenue, growth_rate=0.25, churn_rate=0.08, signed_contracts=0.0,
        ),
        material_events=get_material_events(),
    )

# ── Save Functions ────────────────────────────────────────────────────

def save_public_co(output_dir: str, package: PublicCoPackage) -> list[str]:
    """Persist public company package to .mekong/ipo/. Returns saved paths."""
    base = Path(output_dir) / ".mekong" / "ipo"
    base.mkdir(parents=True, exist_ok=True)
    saved = []
    for filename, data in (
        ("public-co-package.json", asdict(package)),
        ("earnings-calendar.json", [asdict(e) for e in package.earnings_calendar]),
        ("material-events-8k.json", [asdict(e) for e in package.material_events]),
    ):
        p = base / filename
        p.write_text(json.dumps(data, indent=2, default=str))
        saved.append(str(p))
    if package.guidance is not None:
        p = base / "guidance-model.json"
        p.write_text(json.dumps(asdict(package.guidance), indent=2, default=str))
        saved.append(str(p))
    return saved
