"""Tests for founder_vc_bootstrap module."""

import pytest
from src.core.founder_vc.founder_vc_bootstrap import (
    calculate_ramen,
    build_bootstrap_plan,
    get_alternative_funding,
    check_raise_readiness,
    RamenCalculation,
    BootstrapPlan,
    RaiseReadiness,
)


def test_calculate_ramen_basic():
    r = calculate_ramen(2000, 500, 1500)
    assert isinstance(r, RamenCalculation)
    assert r.personal_expenses == 2000
    assert r.business_expenses == 500
    assert r.founder_salary == 1500
    assert r.buffer_pct == 20.0


def test_ramen_target_includes_buffer():
    r = calculate_ramen(1000, 500, 1000, buffer_pct=10.0)
    expected = (1000 + 500 + 1000) * 1.10  # 2750
    assert r.ramen_target == pytest.approx(expected)


def test_ramen_users_needed():
    r = calculate_ramen(2000, 500, 1500)
    users = r.users_needed(avg_price=49.0)
    assert users > 0
    assert isinstance(users, int)
    # ramen_target / 49 rounded up + 1
    assert users == int(r.ramen_target / 49.0) + 1


def test_ramen_users_needed_zero_price():
    r = calculate_ramen(2000, 500, 1500)
    assert r.users_needed(avg_price=0) == 0


def test_weeks_to_ramen_already_profitable():
    r = calculate_ramen(1000, 500, 1000)
    # Already at ramen if current_mrr > ramen_target
    weeks = r.weeks_to_ramen(current_mrr=r.ramen_target + 1, weekly_growth_pct=5)
    assert weeks == 0


def test_weeks_to_ramen_no_growth():
    r = calculate_ramen(2000, 500, 1500)
    weeks = r.weeks_to_ramen(current_mrr=0, weekly_growth_pct=0)
    assert weeks == -1  # impossible


def test_weeks_to_ramen_positive():
    r = calculate_ramen(1000, 200, 800)  # small ramen target
    weeks = r.weeks_to_ramen(current_mrr=100, weekly_growth_pct=10)
    assert weeks > 0
    assert weeks < 520  # bounded


def test_build_bootstrap_plan_structure():
    plan = build_bootstrap_plan("Acme", current_mrr=500, avg_price=49.0)
    assert isinstance(plan, BootstrapPlan)
    assert plan.company_name == "Acme"
    assert plan.current_mrr == 500
    assert plan.avg_price == 49.0
    assert len(plan.milestones) == 5
    assert len(plan.strategies) == 6


def test_build_bootstrap_plan_milestone_months():
    plan = build_bootstrap_plan("Test", current_mrr=0)
    months = [m.month for m in plan.milestones]
    assert months == [1, 3, 6, 9, 12]


def test_get_alternative_funding_all():
    sources = get_alternative_funding()
    assert len(sources) >= 6
    types = {s.type for s in sources}
    assert "revenue_based" in types
    assert "accelerator" in types
    assert "grant" in types


def test_get_alternative_funding_filtered():
    grants = get_alternative_funding("grant")
    assert all(s.type == "grant" for s in grants)
    assert len(grants) >= 2


def test_check_raise_readiness_not_ready():
    r = check_raise_readiness(current_mrr=5000, mom_growth_pct=5)
    assert isinstance(r, RaiseReadiness)
    assert r.should_raise is False
    assert r.score < 4
    assert "DO NOT RAISE" in r.verdict or "WAIT" in r.verdict


def test_check_raise_readiness_strong():
    r = check_raise_readiness(current_mrr=60000, mom_growth_pct=20)
    assert r.should_raise is True
    assert r.score >= 4
    assert "RAISE" in r.verdict
