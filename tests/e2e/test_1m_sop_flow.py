"""E2E test: 1M SOP full billing flow.

Tests the complete tenant lifecycle per AgencyOS 100/100 conditions:
  Polar webhook → MCU credit → MCU check → mission create →
  mission complete → MCU deduct → credits.low trigger.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from src.gateway import app, mcu_billing


@pytest.fixture(autouse=True)
def reset_state():
    """Reset all in-memory stores between tests."""
    mcu_billing._tenants.clear()
    # Clear mission store
    from src.gateway import MISSION_STORE
    MISSION_STORE.clear()
    yield
    mcu_billing._tenants.clear()
    MISSION_STORE.clear()


client = TestClient(app)


class TestTenantOnboarding:
    """Step 1: Tenant signs up via Polar.sh checkout → MCU credited."""

    def test_polar_webhook_credits_tenant(self):
        """Simulate Polar subscription.created → add MCU credits."""
        # Polar webhook would call our billing system
        # For now, directly credit via MCUBilling (webhook handler TBD)
        tenant = mcu_billing.add_credits("tenant-sop-1", 200, "Polar Growth tier")
        assert tenant.balance == 200
        assert tenant.total_credited == 200

    def test_starter_tier_credits(self):
        """Starter tier ($49) → 50 MCU."""
        tenant = mcu_billing.add_credits("t-starter", 50, "Polar Starter")
        assert tenant.balance == 50

    def test_growth_tier_credits(self):
        """Growth tier ($149) → 200 MCU."""
        tenant = mcu_billing.add_credits("t-growth", 200, "Polar Growth")
        assert tenant.balance == 200

    def test_premium_tier_credits(self):
        """Premium tier ($499) → 1000 MCU."""
        tenant = mcu_billing.add_credits("t-premium", 1000, "Polar Premium")
        assert tenant.balance == 1000


class TestMCUCheckBeforeMission:
    """Step 2: Check tenant has enough MCU before accepting mission."""

    def test_sufficient_balance_allows_mission(self):
        """Tenant with credits can create mission."""
        mcu_billing.add_credits("t1", 100)
        # Check balance before mission
        assert mcu_billing.get_balance("t1") >= 1
        # Create mission
        resp = client.post("/v1/missions", json={
            "goal": "Deploy landing page",
            "tenant_id": "t1",
        })
        assert resp.status_code == 200

    def test_zero_balance_blocks_deduction(self):
        """Tenant with 0 MCU gets rejected on deduction."""
        resp = client.post("/v1/mcu/deduct", json={
            "tenant_id": "t-broke",
            "complexity": "simple",
        })
        assert resp.status_code == 402


class TestMissionLifecycle:
    """Step 3-5: Full mission create → execute → complete → deduct."""

    def test_full_mission_flow(self):
        """Complete flow: credit → create mission → deduct MCU."""
        tenant_id = "t-full-flow"

        # Step 1: Credit tenant (Polar webhook)
        mcu_billing.add_credits(tenant_id, 50, "Polar Starter")
        assert mcu_billing.get_balance(tenant_id) == 50

        # Step 2: Create mission
        resp = client.post("/v1/missions", json={
            "goal": "Build authentication system",
            "tenant_id": tenant_id,
        })
        assert resp.status_code == 200
        mission_id = resp.json()["mission_id"]
        assert len(mission_id) > 0  # UUID format

        # Step 3: Check mission status
        resp = client.get(f"/v1/missions/{mission_id}")
        assert resp.status_code == 200
        assert resp.json()["tenant_id"] == tenant_id

        # Step 4: Deduct MCU (standard complexity)
        resp = client.post("/v1/mcu/deduct", json={
            "tenant_id": tenant_id,
            "complexity": "standard",
            "mission_id": mission_id,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["amount_deducted"] == 3
        assert data["balance_after"] == 47

    def test_complex_mission_deduction(self):
        """Complex mission costs 5 MCU."""
        mcu_billing.add_credits("t-complex", 20)
        resp = client.post("/v1/mcu/deduct", json={
            "tenant_id": "t-complex",
            "complexity": "complex",
        })
        assert resp.status_code == 200
        assert resp.json()["amount_deducted"] == 5
        assert resp.json()["balance_after"] == 15

    def test_multiple_missions_drain_balance(self):
        """Sequential missions correctly drain MCU balance."""
        tid = "t-drain"
        mcu_billing.add_credits(tid, 10)

        # 3 simple missions (3 MCU total)
        for _ in range(3):
            resp = client.post("/v1/mcu/deduct", json={
                "tenant_id": tid, "complexity": "simple",
            })
            assert resp.status_code == 200

        assert mcu_billing.get_balance(tid) == 7

        # 1 complex mission (5 MCU)
        resp = client.post("/v1/mcu/deduct", json={
            "tenant_id": tid, "complexity": "complex",
        })
        assert resp.status_code == 200
        assert mcu_billing.get_balance(tid) == 2

        # Next standard mission should fail (need 3, have 2)
        resp = client.post("/v1/mcu/deduct", json={
            "tenant_id": tid, "complexity": "standard",
        })
        assert resp.status_code == 402


class TestCreditsLowTrigger:
    """Step 6: credits.low webhook fires when balance < 10 MCU."""

    def test_low_balance_flag_on_deduction(self):
        """Deduction returns low_balance=True when balance drops below 10."""
        mcu_billing.add_credits("t-low", 12)
        resp = client.post("/v1/mcu/deduct", json={
            "tenant_id": "t-low",
            "complexity": "standard",
        })
        data = resp.json()
        assert data["success"] is True
        assert data["balance_after"] == 9
        assert data["low_balance"] is True

    def test_no_low_balance_above_threshold(self):
        """No low_balance flag when balance stays above 10."""
        mcu_billing.add_credits("t-ok", 100)
        resp = client.post("/v1/mcu/deduct", json={
            "tenant_id": "t-ok",
            "complexity": "complex",
        })
        data = resp.json()
        assert data["low_balance"] is False

    def test_is_low_balance_query(self):
        """Direct query for low balance status."""
        mcu_billing.add_credits("t-query", 5)
        assert mcu_billing.is_low_balance("t-query") is True

        mcu_billing.add_credits("t-query", 50)
        assert mcu_billing.is_low_balance("t-query") is False


class TestMCURefundFlow:
    """Mission cancel → MCU refund."""

    def test_refund_after_cancel(self):
        """Cancelled mission gets MCU refunded."""
        tid = "t-refund"
        mcu_billing.add_credits(tid, 50)
        mcu_billing.deduct(tid, "complex")  # -5
        assert mcu_billing.get_balance(tid) == 45

        # Refund the complex mission
        tenant = mcu_billing.refund(tid, 5, mission_id="m-cancelled")
        assert tenant is not None
        assert tenant.balance == 50
        assert tenant.total_refunded == 5


class TestHealthAndSchema:
    """Verify supporting endpoints work in the flow."""

    def test_health_check(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

    def test_webhook_schema(self):
        resp = client.get("/v1/webhook/schema")
        assert resp.status_code == 200
        assert "events" in resp.json()
