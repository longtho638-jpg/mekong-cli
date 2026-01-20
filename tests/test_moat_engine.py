
import pytest
from pathlib import Path
from antigravity.core.moat_engine.engine import MoatEngine, get_moat_engine

@pytest.fixture
def moat_engine(tmp_path):
    # Use a temporary directory for storage
    storage = tmp_path / "moats"
    return MoatEngine(storage_path=storage)

def test_initialization(moat_engine):
    assert len(moat_engine.moats) == 5
    assert "data" in moat_engine.moats
    assert "learning" in moat_engine.moats
    assert moat_engine.moats["data"].name == "Data Moat"

def test_add_data_point(moat_engine):
    initial_strength = moat_engine.moats["data"].strength

    # Add enough data points to increase strength
    # Logic: strength = total / 5. To get > 0, need total >= 5.
    moat_engine.add_data_point("projects", count=10)

    assert moat_engine.moats["data"].metrics["projects"] == 10
    assert moat_engine.moats["data"].strength > initial_strength
    assert moat_engine.moats["data"].strength == 2  # 10/5 = 2

def test_record_learning(moat_engine):
    initial_strength = moat_engine.moats["learning"].strength

    # Record learning
    # Logic: strength = (patterns / 2) * rate
    # rate starts at 0.75.
    # record_learning adds 1 pattern and updates rate.

    for _ in range(10):
        moat_engine.record_learning(success=True)

    assert moat_engine.moats["learning"].metrics["patterns"] == 10
    assert moat_engine.moats["learning"].strength > initial_strength

def test_add_workflow(moat_engine):
    initial_strength = moat_engine.moats["workflow"].strength

    moat_engine.add_workflow(count=5)

    assert moat_engine.moats["workflow"].metrics["custom_workflows"] == 5
    assert moat_engine.moats["workflow"].strength == 25  # 5 * 5 = 25

def test_calculate_switching_cost(moat_engine):
    # Add some metrics
    moat_engine.add_data_point("projects", 10) # 30 hours
    moat_engine.add_workflow(2) # 20 hours
    # Learning: 0 patterns -> 0 hours

    costs = moat_engine.calculate_switching_cost()

    assert costs["hours"] == 50
    assert costs["financial_usd"] == 5000

def test_persistence(tmp_path):
    storage = tmp_path / "moats_persist"

    # Create and modify
    engine1 = MoatEngine(storage_path=storage)
    engine1.add_data_point("projects", 100)

    # Load new instance
    engine2 = MoatEngine(storage_path=storage)
    assert engine2.moats["data"].metrics["projects"] == 100
    assert engine2.moats["data"].strength == 20

def test_global_instance():
    engine = get_moat_engine()
    assert isinstance(engine, MoatEngine)
