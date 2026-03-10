"""Founder IPO Pre-IPO — IPO readiness audit engine.

Scores readiness across 5 categories, recommends exchanges,
and generates a phased timeline to IPO day.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from pathlib import Path

from .founder_pre_ipo_data import EXCHANGE_OPTIONS, IPO_TIMELINE, ExchangeOption, TimelinePhase

logger = logging.getLogger(__name__)


# ── Data Models ──────────────────────────────────────────────────────


@dataclass
class ReadinessItem:
    """Single scored readiness check."""

    label: str
    max_points: int
    score: int
    notes: str = ""


@dataclass
class ReadinessCategory:
    """Category grouping readiness items."""

    name: str
    max_points: int
    score: int
    items: list[ReadinessItem] = field(default_factory=list)


@dataclass
class ReadinessAssessment:
    """Complete IPO readiness assessment."""

    total_score: int
    max_score: int
    categories: list[ReadinessCategory]
    verdict: str
    months_to_ready: int
    gaps: list[str] = field(default_factory=list)


# ── Helpers ──────────────────────────────────────────────────────────


def _score_category(
    name: str,
    max_pts: int,
    scores_dict: dict[str, int],
    labels: list[tuple[str, int]],
) -> ReadinessCategory:
    items = []
    total = 0
    for label, item_max in labels:
        score = min(scores_dict.get(label, 0), item_max)
        total += score
        items.append(ReadinessItem(label=label, max_points=item_max, score=score))
    return ReadinessCategory(name=name, max_points=max_pts, score=total, items=items)


# ── Core Functions ───────────────────────────────────────────────────


def score_readiness(
    financial: dict[str, int],
    business: dict[str, int],
    governance: dict[str, int],
    legal: dict[str, int],
    operations: dict[str, int],
) -> ReadinessAssessment:
    """Score IPO readiness across 5 categories (0-100 total)."""
    fin = _score_category("Financial", 25, financial, [
        ("audited_financials", 10), ("revenue_growth", 8), ("path_to_profitability", 7),
    ])
    biz = _score_category("Business", 25, business, [
        ("market_size", 8), ("competitive_moat", 9), ("revenue_quality", 8),
    ])
    gov = _score_category("Governance", 20, governance, [
        ("board_independence", 8), ("audit_committee", 7), ("executive_team", 5),
    ])
    leg = _score_category("Legal", 15, legal, [
        ("ip_protection", 6), ("regulatory_compliance", 5), ("litigation_risk", 4),
    ])
    ops = _score_category("Operations", 15, operations, [
        ("scalable_systems", 6), ("internal_controls", 5), ("reporting_infrastructure", 4),
    ])

    categories = [fin, biz, gov, leg, ops]
    total = sum(c.score for c in categories)

    if total >= 80:
        verdict, months = "IPO-ready", 0
    elif total >= 60:
        verdict, months = "6-12 months to IPO-ready", 9
    elif total >= 40:
        verdict, months = "12-18 months to IPO-ready", 15
    else:
        verdict, months = "18+ months to IPO-ready", 24

    gaps = [
        f"{c.name}: {c.score}/{c.max_points}"
        for c in categories
        if c.score < c.max_points * 0.6
    ]
    return ReadinessAssessment(
        total_score=total,
        max_score=100,
        categories=categories,
        verdict=verdict,
        months_to_ready=months,
        gaps=gaps,
    )


def recommend_exchange(
    sector: str,
    region: str,
    revenue: float,
) -> list[ExchangeOption]:
    """Recommend exchanges based on sector, target region, and revenue."""
    region_lower = region.lower()
    sector_lower = sector.lower()

    if region_lower in ("us", "global"):
        results = [e for e in EXCHANGE_OPTIONS if e.region == "us"]
    elif region_lower == "vn":
        results = [e for e in EXCHANGE_OPTIONS if e.region == "vn"]
    elif region_lower in ("hk", "asia"):
        results = [e for e in EXCHANGE_OPTIONS if e.region == "hk"]
    else:
        results = [e for e in EXCHANGE_OPTIONS if e.region == "us"]

    if any(k in sector_lower for k in ("tech", "saas", "software", "ai", "biotech")):
        results.sort(key=lambda e: 0 if e.name == "NASDAQ" else 1)
    if revenue >= 200_000_000:
        results.sort(key=lambda e: 0 if e.name == "NYSE" else 1)

    return results


def get_timeline() -> list[TimelinePhase]:
    """Return the standard 18-month IPO preparation timeline."""
    return list(IPO_TIMELINE)


# ── Save Functions ───────────────────────────────────────────────────


def save_readiness(output_dir: str, assessment: ReadinessAssessment) -> list[str]:
    """Save IPO readiness assessment to .mekong/ipo/."""
    base = Path(output_dir) / ".mekong" / "ipo"
    base.mkdir(parents=True, exist_ok=True)
    saved = []

    path = base / "readiness-assessment.json"
    path.write_text(json.dumps(asdict(assessment), indent=2, default=str))
    saved.append(str(path))

    timeline_path = base / "ipo-timeline.json"
    timeline_path.write_text(json.dumps([asdict(p) for p in get_timeline()], indent=2))
    saved.append(str(timeline_path))

    return saved
