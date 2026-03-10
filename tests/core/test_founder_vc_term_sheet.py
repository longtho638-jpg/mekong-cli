"""Tests for founder_vc_term_sheet module."""

import pytest
from src.core.founder_vc.founder_vc_term_sheet import (
    analyze_term_sheet,
    simulate_exit,
    EconomicTerms,
    ControlTerms,
    FounderTerms,
    TermSheetAnalysis,
    ExitScenario,
)


def _base_economic(**kwargs) -> EconomicTerms:
    defaults = dict(
        pre_money_valuation=5_000_000,
        investment_amount=1_000_000,
        liquidation_pref_multiple=1.0,
        participating=False,
        anti_dilution="broad_weighted_avg",
        option_pool_pct=10.0,
        option_pool_pre_money=False,
    )
    defaults.update(kwargs)
    return EconomicTerms(**defaults)


def test_analyze_term_sheet_founder_friendly():
    econ = _base_economic()
    result = analyze_term_sheet(econ)
    assert isinstance(result, TermSheetAnalysis)
    assert result.verdict == "FOUNDER_FRIENDLY"
    assert result.danger_count == 0


def test_analyze_term_sheet_option_pool_shuffle_danger():
    econ = _base_economic(option_pool_pre_money=True)
    result = analyze_term_sheet(econ)
    danger_names = [c.clause_name for c in result.clause_analyses if c.rating == "DANGER"]
    assert "Option Pool Shuffle" in danger_names


def test_analyze_term_sheet_participating_pref_danger():
    econ = _base_economic(participating=True, liquidation_pref_multiple=1.0)
    result = analyze_term_sheet(econ)
    ratings = [c.rating for c in result.clause_analyses if c.clause_name == "Liquidation Preference"]
    assert "DANGER" in ratings


def test_analyze_term_sheet_full_ratchet_extreme_danger():
    econ = _base_economic(anti_dilution="full_ratchet")
    result = analyze_term_sheet(econ)
    ad_clauses = [c for c in result.clause_analyses if c.clause_name == "Anti-Dilution"]
    assert ad_clauses[0].rating == "EXTREME_DANGER"


def test_analyze_term_sheet_predatory():
    econ = _base_economic(
        anti_dilution="full_ratchet",
        participating=True,
        liquidation_pref_multiple=2.0,
        option_pool_pre_money=True,
    )
    ctrl = ControlTerms(
        founder_board_seats=1,
        investor_board_seats=2,
        drag_along_requires_common=False,
    )
    result = analyze_term_sheet(econ, ctrl)
    assert result.verdict == "PREDATORY"
    assert result.danger_count >= 3


def test_analyze_term_sheet_investor_board_majority():
    econ = _base_economic()
    ctrl = ControlTerms(founder_board_seats=1, investor_board_seats=2)
    result = analyze_term_sheet(econ, ctrl)
    board_clause = next(c for c in result.clause_analyses if c.clause_name == "Board Control")
    assert board_clause.rating == "DANGER"


def test_analyze_term_sheet_no_shop_watch():
    econ = _base_economic()
    founder = FounderTerms(no_shop_days=45)
    result = analyze_term_sheet(econ, founder=founder)
    ns = next(c for c in result.clause_analyses if c.clause_name == "No-Shop")
    assert ns.rating == "WATCH"


def test_analyze_term_sheet_non_compete_watch():
    econ = _base_economic()
    founder = FounderTerms(non_compete_months=24)
    result = analyze_term_sheet(econ, founder=founder)
    nc = next(c for c in result.clause_analyses if c.clause_name == "Non-Compete")
    assert nc.rating == "WATCH"


def test_economic_post_money():
    econ = _base_economic(pre_money_valuation=5_000_000, investment_amount=1_000_000)
    assert econ.post_money_valuation == 6_000_000


def test_economic_investor_ownership_pct():
    econ = _base_economic(pre_money_valuation=5_000_000, investment_amount=1_000_000)
    pct = econ.investor_ownership_pct
    assert pytest.approx(pct, rel=0.01) == (1_000_000 / 6_000_000) * 100


def test_simulate_exit_default_values():
    scenarios = simulate_exit(
        investment=1_000_000,
        investor_pct=20.0,
        liq_pref_multiple=1.0,
    )
    assert len(scenarios) == 4
    for s in scenarios:
        assert isinstance(s, ExitScenario)
        assert s.exit_value > 0


def test_simulate_exit_payout_sums_to_exit():
    scenarios = simulate_exit(
        investment=1_000_000,
        investor_pct=20.0,
        liq_pref_multiple=1.0,
        exit_values=[10_000_000],
    )
    s = scenarios[0]
    assert pytest.approx(s.vc_payout_non_part + s.founder_payout_non_part, rel=0.01) == 10_000_000


def test_simulate_exit_participating_worse_for_founder():
    scenarios_non = simulate_exit(1_000_000, 20.0, 1.0, exit_values=[5_000_000])
    # delta > 0 means non-part is better for founder
    s = scenarios_non[0]
    assert s.founder_delta >= 0
