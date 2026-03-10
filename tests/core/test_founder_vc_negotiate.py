"""Tests for founder_vc_negotiate module."""

from src.core.founder_vc.founder_vc_negotiate import (
    assess_batna,
    build_walk_away_lines,
    generate_counter_scripts,
    build_negotiation_prep,
    BATNAAssessment,
    WalkAwayLine,
    CounterScript,
    NegotiationPrep,
)


def test_assess_batna_weak():
    b = assess_batna(current_mrr=5000, mom_growth_pct=5)
    assert isinstance(b, BATNAAssessment)
    assert b.strength == "WEAK"
    assert b.score < b.max_score * 0.5


def test_assess_batna_strong():
    b = assess_batna(
        current_mrr=30_000,
        mom_growth_pct=20,
        competing_terms=2,
        runway_months=24,
        revenue_financing_approved=True,
        profitable=True,
    )
    assert b.strength == "STRONG"
    assert b.score >= b.max_score * 0.8


def test_assess_batna_moderate():
    b = assess_batna(
        current_mrr=12_000,
        mom_growth_pct=18,
        competing_terms=0,
        runway_months=12,
    )
    assert b.strength in ("MODERATE", "WEAK")


def test_assess_batna_factors_count():
    b = assess_batna(current_mrr=0, mom_growth_pct=0)
    assert len(b.factors) == 7


def test_batna_strategy_weak():
    b = assess_batna(0, 0)
    assert "CAREFUL" in b.strategy


def test_batna_strategy_strong():
    b = assess_batna(30_000, 20, competing_terms=2, profitable=True, runway_months=20)
    if b.strength == "STRONG":
        assert "AGGRESSIVE" in b.strategy
    else:
        assert "BALANCED" in b.strategy or "CAREFUL" in b.strategy


def test_build_walk_away_lines_count():
    lines = build_walk_away_lines(min_valuation=5_000_000, max_dilution_pct=20.0)
    assert len(lines) == 5
    assert all(isinstance(w, WalkAwayLine) for w in lines)


def test_build_walk_away_lines_valuation_format():
    lines = build_walk_away_lines(min_valuation=8_000_000, max_dilution_pct=25.0)
    val_line = next(x for x in lines if x.term == "Valuation floor")
    assert "8.0M" in val_line.floor_value


def test_build_walk_away_lines_max_dilution():
    lines = build_walk_away_lines(min_valuation=5_000_000, max_dilution_pct=30.0)
    dilution_line = next(x for x in lines if x.term == "Max dilution")
    assert "30.0" in dilution_line.floor_value


def test_build_walk_away_lines_board_seats():
    lines = build_walk_away_lines(5_000_000, 20.0, min_founder_board_seats=3)
    board_line = next(x for x in lines if x.term == "Board composition")
    assert "3" in board_line.floor_value


def test_generate_counter_scripts_count():
    scripts = generate_counter_scripts(
        their_valuation=5_000_000,
        your_valuation=8_000_000,
        current_mrr=25_000,
        mom_growth_pct=15,
    )
    assert len(scripts) == 5
    assert all(isinstance(s, CounterScript) for s in scripts)


def test_generate_counter_scripts_valuation_term():
    scripts = generate_counter_scripts(4_000_000, 7_000_000, 20_000, 12)
    val_script = next(s for s in scripts if s.term_name == "Valuation")
    assert "4M" in val_script.their_position or "4" in val_script.their_position
    assert "7M" in val_script.your_counter or "7" in val_script.your_counter


def test_build_negotiation_prep_complete():
    prep = build_negotiation_prep(
        current_mrr=20_000,
        mom_growth_pct=15,
        their_valuation=5_000_000,
        your_valuation=8_000_000,
    )
    assert isinstance(prep, NegotiationPrep)
    assert prep.batna is not None
    assert len(prep.walk_away_lines) == 5
    assert len(prep.counter_scripts) == 5
    assert len(prep.pressure_responses) == 5
    assert len(prep.closing_checklist) == 8
