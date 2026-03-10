"""Founder IPO Roadshow — Roadshow prep engine.

Builds 20-slide deck outline, Q&A bank, order book analysis,
and allocation strategy for IPO roadshow execution.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass
from pathlib import Path

from .founder_roadshow_data import ALLOCATION_RULES, DECK_STRUCTURE, QA_BANK

logger = logging.getLogger(__name__)


# ── Data Models ──────────────────────────────────────────────────────


@dataclass
class DeckSlide:
    number: int
    title: str
    key_content: str


@dataclass
class QAQuestion:
    category: str
    question: str
    suggested_answer: str


@dataclass
class OrderBookEntry:
    investor_name: str
    shares_requested: int
    quality: str  # "high" | "medium" | "low"


@dataclass
class AllocationRule:
    category: str
    target_pct: float
    description: str


@dataclass
class RoadshowPackage:
    deck_outline: list[DeckSlide]
    qa_bank: list[QAQuestion]
    allocation_rules: list[AllocationRule]


# ── Core Functions ───────────────────────────────────────────────────


def build_roadshow_deck(
    company_name: str,
    arr: float,
    growth_pct: float,
    customers: int,
    moat: str,
) -> list[DeckSlide]:
    """Build 20-slide roadshow deck outline with company data filled in."""
    slides = []
    for num, title, template in DECK_STRUCTURE:
        if num == 1:
            content = f"{company_name} | {template}"
        elif num == 9:
            content = (
                f"ARR: ${arr:.1f}M | Growth: {growth_pct:.0f}% YoY | "
                f"Customers: {customers}"
            )
        elif num == 12:
            content = f"Moat: {moat}. {template}"
        else:
            content = template
        slides.append(DeckSlide(number=num, title=title, key_content=content))
    return slides


def get_qa_bank() -> list[QAQuestion]:
    """Return the full Q&A bank for roadshow preparation."""
    return [QAQuestion(category=cat, question=q, suggested_answer=a) for cat, q, a in QA_BANK]


def analyze_order_book(
    entries: list[OrderBookEntry],
    shares_offered: int,
) -> dict:
    """Analyze order book coverage and quality; recommend pricing action."""
    if not entries or shares_offered <= 0:
        return {
            "coverage_ratio": 0.0,
            "quality_breakdown": {"high": 0, "medium": 0, "low": 0},
            "pricing_recommendation": "insufficient data",
        }

    total_requested = sum(e.shares_requested for e in entries)
    coverage = total_requested / shares_offered

    quality_breakdown: dict[str, int] = {"high": 0, "medium": 0, "low": 0}
    for entry in entries:
        key = entry.quality if entry.quality in quality_breakdown else "low"
        quality_breakdown[key] += entry.shares_requested

    high_pct = quality_breakdown["high"] / total_requested * 100 if total_requested else 0

    if coverage >= 10 and high_pct >= 50:
        rec = "price at top of range or above"
    elif coverage >= 5 and high_pct >= 35:
        rec = "price at midpoint to top of range"
    elif coverage >= 3:
        rec = "price at midpoint of range"
    elif coverage >= 1:
        rec = "price at bottom of range"
    else:
        rec = "consider postponing — insufficient demand"

    return {
        "coverage_ratio": round(coverage, 2),
        "total_shares_requested": total_requested,
        "shares_offered": shares_offered,
        "quality_breakdown": quality_breakdown,
        "high_quality_pct": round(high_pct, 1),
        "pricing_recommendation": rec,
    }


def get_allocation_strategy() -> list[AllocationRule]:
    """Return IPO share allocation rules."""
    return [AllocationRule(category=cat, target_pct=pct, description=desc)
            for cat, pct, desc in ALLOCATION_RULES]


def build_roadshow_package(
    company_name: str,
    arr: float,
    growth_pct: float,
    customers: int,
    moat: str,
) -> RoadshowPackage:
    """Build complete roadshow package: deck + Q&A + allocation rules."""
    return RoadshowPackage(
        deck_outline=build_roadshow_deck(company_name, arr, growth_pct, customers, moat),
        qa_bank=get_qa_bank(),
        allocation_rules=get_allocation_strategy(),
    )


# ── Save Functions ───────────────────────────────────────────────────


def save_roadshow(output_dir: str, package: RoadshowPackage) -> list[str]:
    """Save roadshow package to .mekong/ipo/."""
    base = Path(output_dir) / ".mekong" / "ipo"
    base.mkdir(parents=True, exist_ok=True)
    saved = []

    deck_path = base / "roadshow-deck-outline.json"
    deck_path.write_text(json.dumps([asdict(s) for s in package.deck_outline], indent=2))
    saved.append(str(deck_path))

    qa_path = base / "roadshow-qa-bank.json"
    qa_path.write_text(json.dumps([asdict(q) for q in package.qa_bank], indent=2))
    saved.append(str(qa_path))

    alloc_path = base / "roadshow-allocation-rules.json"
    alloc_path.write_text(json.dumps([asdict(r) for r in package.allocation_rules], indent=2))
    saved.append(str(alloc_path))

    return saved
