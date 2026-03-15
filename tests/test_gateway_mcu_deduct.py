"""Tests for POST /v1/mcu/deduct gateway endpoint."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from src.gateway import app, mcu_billing


@pytest.fixture(autouse=True)
def reset_billing():
    """Reset MCU billing state between tests."""
    mcu_billing._tenants.clear()
    yield
    mcu_billing._tenants.clear()


client = TestClient(app)  # type: ignore[call-arg]


class TestMCUDeductEndpoint:
    """Test POST /v1/mcu/deduct."""

    def test_deduct_simple_success(self):
        mcu_billing.add_credits("t1", 100)
        resp = client.post("/v1/mcu/deduct", json={
            "tenant_id": "t1",
            "complexity": "simple",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["amount_deducted"] == 1
        assert data["balance_after"] == 99

    def test_deduct_standard_success(self):
        mcu_billing.add_credits("t1", 100)
        resp = client.post("/v1/mcu/deduct", json={
            "tenant_id": "t1",
            "complexity": "standard",
        })
        assert resp.status_code == 200
        assert resp.json()["amount_deducted"] == 3

    def test_deduct_complex_success(self):
        mcu_billing.add_credits("t1", 100)
        resp = client.post("/v1/mcu/deduct", json={
            "tenant_id": "t1",
            "complexity": "complex",
        })
        assert resp.status_code == 200
        assert resp.json()["amount_deducted"] == 5

    def test_deduct_insufficient_balance_402(self):
        mcu_billing.add_credits("t1", 2)
        resp = client.post("/v1/mcu/deduct", json={
            "tenant_id": "t1",
            "complexity": "complex",
        })
        assert resp.status_code == 402
        assert "Insufficient" in resp.json()["detail"]

    def test_deduct_invalid_complexity_400(self):
        mcu_billing.add_credits("t1", 100)
        resp = client.post("/v1/mcu/deduct", json={
            "tenant_id": "t1",
            "complexity": "mega",
        })
        assert resp.status_code == 400
        assert "Invalid complexity" in resp.json()["detail"]

    def test_deduct_with_mission_id(self):
        mcu_billing.add_credits("t1", 50)
        resp = client.post("/v1/mcu/deduct", json={
            "tenant_id": "t1",
            "complexity": "standard",
            "mission_id": "m-456",
        })
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_deduct_low_balance_flag(self):
        mcu_billing.add_credits("t1", 12)
        resp = client.post("/v1/mcu/deduct", json={
            "tenant_id": "t1",
            "complexity": "standard",
        })
        data = resp.json()
        assert data["success"] is True
        assert data["low_balance"] is True  # 12-3=9 < 10

    def test_deduct_missing_tenant_id_422(self):
        resp = client.post("/v1/mcu/deduct", json={
            "complexity": "simple",
        })
        assert resp.status_code == 422

    def test_sequential_deductions(self):
        mcu_billing.add_credits("t1", 20)
        client.post("/v1/mcu/deduct", json={
            "tenant_id": "t1", "complexity": "simple",
        })
        client.post("/v1/mcu/deduct", json={
            "tenant_id": "t1", "complexity": "standard",
        })
        resp = client.post("/v1/mcu/deduct", json={
            "tenant_id": "t1", "complexity": "complex",
        })
        data = resp.json()
        assert data["balance_after"] == 11  # 20-1-3-5

    def test_deduct_zero_balance_tenant(self):
        resp = client.post("/v1/mcu/deduct", json={
            "tenant_id": "new_tenant",
            "complexity": "simple",
        })
        assert resp.status_code == 402
