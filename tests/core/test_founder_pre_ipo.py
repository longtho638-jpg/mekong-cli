"""Tests for founder_pre_ipo module."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.core.founder_ipo.founder_pre_ipo import (
    score_readiness,
    recommend_exchange,
    get_timeline,
)


_FULL_SCORES = {
    "financial": {"audited_financials": 10, "revenue_growth": 8, "path_to_profitability": 7},
    "business": {"market_size": 8, "competitive_moat": 9, "revenue_quality": 8},
    "governance": {"board_independence": 8, "audit_committee": 7, "executive_team": 5},
    "legal": {"ip_protection": 6, "regulatory_compliance": 5, "litigation_risk": 4},
    "operations": {"scalable_systems": 6, "internal_controls": 5, "reporting_infrastructure": 4},
}

_ZERO_SCORES = {k: {kk: 0 for kk in v} for k, v in _FULL_SCORES.items()}


def test_score_readiness_full_score_is_100():
    result = score_readiness(**_FULL_SCORES)
    assert result.total_score == 100
    assert result.max_score == 100


def test_score_readiness_full_score_verdict_ipo_ready():
    result = score_readiness(**_FULL_SCORES)
    assert result.verdict == "IPO-ready"
    assert result.months_to_ready == 0


def test_score_readiness_zero_verdict_18_plus():
    result = score_readiness(**_ZERO_SCORES)
    assert result.total_score == 0
    assert "18+" in result.verdict
    assert result.months_to_ready == 24


def test_score_readiness_mid_range_verdict():
    mid = {
        "financial": {"audited_financials": 6, "revenue_growth": 5, "path_to_profitability": 4},
        "business": {"market_size": 5, "competitive_moat": 5, "revenue_quality": 5},
        "governance": {"board_independence": 5, "audit_committee": 4, "executive_team": 3},
        "legal": {"ip_protection": 3, "regulatory_compliance": 3, "litigation_risk": 2},
        "operations": {"scalable_systems": 3, "internal_controls": 3, "reporting_infrastructure": 2},
    }
    result = score_readiness(**mid)
    assert 40 <= result.total_score <= 70


def test_score_readiness_has_five_categories():
    result = score_readiness(**_FULL_SCORES)
    assert len(result.categories) == 5
    names = [c.name for c in result.categories]
    assert "Financial" in names
    assert "Governance" in names


def test_score_readiness_gaps_empty_when_full():
    result = score_readiness(**_FULL_SCORES)
    assert result.gaps == []


def test_score_readiness_gaps_populated_when_low():
    result = score_readiness(**_ZERO_SCORES)
    assert len(result.gaps) > 0


def test_recommend_exchange_us_tech_prefers_nasdaq():
    exchanges = recommend_exchange(sector="SaaS", region="us", revenue=50_000_000)
    assert len(exchanges) > 0
    assert exchanges[0].name == "NASDAQ"


def test_recommend_exchange_high_revenue_prefers_nyse():
    exchanges = recommend_exchange(sector="Enterprise", region="us", revenue=300_000_000)
    assert exchanges[0].name == "NYSE"


def test_recommend_exchange_vn_region():
    exchanges = recommend_exchange(sector="Tech", region="vn", revenue=10_000_000)
    assert all(e.region == "vn" for e in exchanges)


def test_get_timeline_returns_phases():
    phases = get_timeline()
    assert isinstance(phases, list)
    assert len(phases) > 0
    assert hasattr(phases[0], "name") or hasattr(phases[0], "phase")
