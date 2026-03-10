"""Tests for founder_s1 module."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.core.founder_ipo.founder_s1 import (
    build_s1_framework,
    generate_risk_factors,
    check_narrative_quality,
    S1Framework,
)


def test_build_s1_framework_returns_framework():
    fw = build_s1_framework(
        company_name="AcmeCo",
        arr=50.0,
        growth_pct=80.0,
        gross_margin_pct=75.0,
        customers=500,
        nrr_pct=120.0,
    )
    assert isinstance(fw, S1Framework)
    assert len(fw.sections) > 0
    assert len(fw.risk_factors) > 0
    assert len(fw.narrative_checks) == 6


def test_build_s1_framework_narrative_score_range():
    fw = build_s1_framework(
        company_name="BetaCo",
        arr=100.0,
        growth_pct=60.0,
        gross_margin_pct=70.0,
        customers=200,
        nrr_pct=115.0,
    )
    assert 0 <= fw.narrative_score <= 6


def test_build_s1_framework_company_name_in_sections():
    fw = build_s1_framework(
        company_name="GammaCorp",
        arr=30.0,
        growth_pct=50.0,
        gross_margin_pct=65.0,
        customers=150,
        nrr_pct=110.0,
    )
    all_content = " ".join(s.content_template for s in fw.sections)
    assert "GammaCorp" in all_content


def test_generate_risk_factors_always_includes_base():
    risks = generate_risk_factors(
        has_losses=False,
        customer_concentration=False,
        ai_dependent=False,
        international=False,
    )
    assert isinstance(risks, list)
    assert len(risks) >= 1


def test_generate_risk_factors_losses_adds_factors():
    risks_no_loss = generate_risk_factors(False, False, False, False)
    risks_loss = generate_risk_factors(True, False, False, False)
    assert len(risks_loss) >= len(risks_no_loss)


def test_generate_risk_factors_all_flags():
    risks = generate_risk_factors(
        has_losses=True,
        customer_concentration=True,
        ai_dependent=True,
        international=True,
    )
    assert len(risks) > 3


def test_generate_risk_factors_have_severity():
    risks = generate_risk_factors(True, True, False, False)
    for r in risks:
        assert r.severity in ("low", "medium", "high")


def test_check_narrative_quality_returns_six_checks():
    fw = build_s1_framework(
        company_name="TestCo",
        arr=40.0,
        growth_pct=70.0,
        gross_margin_pct=72.0,
        customers=300,
        nrr_pct=118.0,
    )
    checks = check_narrative_quality(fw)
    assert len(checks) == 6


def test_check_narrative_quality_checks_have_questions():
    fw = build_s1_framework("DeltaCo", 60.0, 90.0, 78.0, 400, 125.0)
    for check in fw.narrative_checks:
        assert check.question
        assert isinstance(check.passed, bool)
