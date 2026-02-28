"""Load / concurrency tests for RaaS credit and mission stores.

Verifies atomicity under concurrent access without overdraft or ID collisions.
"""
from __future__ import annotations

import threading
from pathlib import Path

import pytest

from src.raas.credits import CreditStore
from src.raas.mission_models import MissionComplexity
from src.raas.mission_store import MissionStore


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def db_path(tmp_path: Path) -> Path:
    return tmp_path / "load_test.db"


# ---------------------------------------------------------------------------
# Test: 50 concurrent deductions — no overdraft
# ---------------------------------------------------------------------------


def test_concurrent_credit_deductions(db_path: Path):
    """50 threads each deduct 1 credit from a shared tenant; final balance >= 0."""
    store = CreditStore(db_path=db_path)
    tenant_id = "load-tenant-001"
    initial = 25  # Only 25 credits — exactly half the threads can succeed
    store.add(tenant_id, initial, "load test seed")

    successes = []
    failures = []
    lock = threading.Lock()

    def deduct():
        ok = store.deduct(tenant_id, 1, "concurrent deduction")
        with lock:
            (successes if ok else failures).append(ok)

    threads = [threading.Thread(target=deduct) for _ in range(50)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    final_balance = store.get_balance(tenant_id)

    # Invariants
    assert final_balance >= 0, f"Overdraft detected: balance={final_balance}"
    assert len(successes) == initial, f"Expected {initial} successes, got {len(successes)}"
    assert len(failures) == 50 - initial, f"Expected {50 - initial} failures, got {len(failures)}"
    assert final_balance == 0  # All 25 credits consumed exactly once


# ---------------------------------------------------------------------------
# Test: concurrent mission creation — all IDs unique
# ---------------------------------------------------------------------------


def test_concurrent_mission_creation(db_path: Path):
    """20 threads each create 1 mission; all resulting IDs must be unique."""
    store = MissionStore(db_path=db_path)
    tenant_id = "load-tenant-002"
    goal = "concurrent mission"

    ids = []
    lock = threading.Lock()

    def create():
        record = store.create(tenant_id, goal, MissionComplexity.simple, 1)
        with lock:
            ids.append(record.id)

    threads = [threading.Thread(target=create) for _ in range(20)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert len(ids) == 20, f"Expected 20 missions, got {len(ids)}"
    assert len(set(ids)) == 20, "Duplicate mission IDs detected under concurrent creation"
