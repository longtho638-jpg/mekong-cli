"""Tests for founder_roadshow module."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.core.founder_ipo.founder_roadshow import (
    build_roadshow_deck,
    get_qa_bank,
    analyze_order_book,
    get_allocation_strategy,
    OrderBookEntry,
)


def test_build_roadshow_deck_returns_20_slides():
    slides = build_roadshow_deck(
        company_name="AcmeCo",
        arr=80.0,
        growth_pct=75.0,
        customers=600,
        moat="network effects",
    )
    assert len(slides) == 20


def test_build_roadshow_deck_slide_numbers_sequential():
    slides = build_roadshow_deck("BetaCo", 50.0, 60.0, 400, "data flywheel")
    numbers = [s.number for s in slides]
    assert numbers == list(range(1, 21))


def test_build_roadshow_deck_slide1_has_company_name():
    slides = build_roadshow_deck("GammaCo", 100.0, 80.0, 800, "switching costs")
    assert "GammaCo" in slides[0].key_content


def test_build_roadshow_deck_slide9_has_metrics():
    slides = build_roadshow_deck("DeltaCo", 120.0, 90.0, 1000, "brand")
    slide9 = next(s for s in slides if s.number == 9)
    assert "ARR" in slide9.key_content
    assert "120.0" in slide9.key_content


def test_build_roadshow_deck_slide12_has_moat():
    slides = build_roadshow_deck("EpsilonCo", 60.0, 55.0, 350, "proprietary data")
    slide12 = next(s for s in slides if s.number == 12)
    assert "proprietary data" in slide12.key_content


def test_get_qa_bank_returns_questions():
    qa = get_qa_bank()
    assert isinstance(qa, list)
    assert len(qa) > 0
    for q in qa:
        assert q.category
        assert q.question
        assert q.suggested_answer


def test_analyze_order_book_empty_returns_zero_coverage():
    result = analyze_order_book([], shares_offered=1_000_000)
    assert result["coverage_ratio"] == 0.0
    assert result["pricing_recommendation"] == "insufficient data"


def test_analyze_order_book_high_quality_top_of_range():
    entries = [
        OrderBookEntry("Fidelity", 5_000_000, "high"),
        OrderBookEntry("Vanguard", 4_000_000, "high"),
        OrderBookEntry("T.Rowe", 1_000_000, "medium"),
    ]
    result = analyze_order_book(entries, shares_offered=1_000_000)
    assert result["coverage_ratio"] == 10.0
    assert "top of range" in result["pricing_recommendation"]


def test_analyze_order_book_low_coverage_postpone():
    entries = [OrderBookEntry("SmallFund", 500_000, "low")]
    result = analyze_order_book(entries, shares_offered=1_000_000)
    assert "postponing" in result["pricing_recommendation"]


def test_get_allocation_strategy_returns_rules():
    rules = get_allocation_strategy()
    assert isinstance(rules, list)
    assert len(rules) > 0
    total_pct = sum(r.target_pct for r in rules)
    assert total_pct > 0
