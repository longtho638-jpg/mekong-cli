from datetime import date
from decimal import Decimal
from unittest.mock import Mock, patch

import pytest

from backend.api.services.revenue_service import RevenueService


@pytest.fixture
def mock_supabase():
    with patch('backend.api.services.revenue_service.create_client') as mock_create:
        mock_client = Mock()
        mock_create.return_value = mock_client
        yield mock_client

@pytest.fixture
def revenue_service(mock_supabase):
    # Set env vars to avoid ValueError in __init__
    with patch.dict('os.environ', {'SUPABASE_URL': 'http://test', 'SUPABASE_SERVICE_ROLE_KEY': 'test'}):
        return RevenueService()

def test_get_current_mrr(revenue_service, mock_supabase):
    # Setup mock return
    mock_rpc = mock_supabase.rpc.return_value
    mock_rpc.execute.return_value.data = "12500.50"

    # Execute
    mrr = revenue_service.get_current_mrr(tenant_id="tenant-123")

    # Verify
    assert mrr == Decimal("12500.50")
    mock_supabase.rpc.assert_called_with(
        "calculate_current_mrr",
        {"p_tenant_id": "tenant-123"}
    )

def test_get_current_mrr_error(revenue_service, mock_supabase):
    # Setup mock to raise exception
    mock_supabase.rpc.side_effect = Exception("RPC Error")

    # Execute
    mrr = revenue_service.get_current_mrr("tenant-123")

    # Verify
    assert mrr == Decimal("0")

def test_get_churn_rate(revenue_service, mock_supabase):
    # Setup mock return
    mock_rpc = mock_supabase.rpc.return_value
    mock_rpc.execute.return_value.data = [{
        "customer_churn_rate": 0.025,
        "revenue_churn_rate": 0.015
    }]

    # Execute
    rates = revenue_service.get_churn_rate("tenant-123")

    # Verify
    assert rates["customer_churn_rate"] == Decimal("0.025")
    assert rates["revenue_churn_rate"] == Decimal("0.015")

def test_get_revenue_stats(revenue_service, mock_supabase):
    # Mock individual methods called by get_revenue_stats
    revenue_service.get_current_mrr = Mock(return_value=Decimal("10000"))
    revenue_service.get_current_arr = Mock(return_value=Decimal("120000"))
    revenue_service.get_churn_rate = Mock(return_value={
        "customer_churn_rate": Decimal("0.02"),
        "revenue_churn_rate": Decimal("0.01")
    })
    revenue_service.get_avg_ltv = Mock(return_value=Decimal("500"))

    # Mock the query for subscriber counts
    mock_query = mock_supabase.table.return_value.select.return_value
    mock_query.eq.return_value.execute.return_value.data = [{
        "active_subscribers": 100,
        "trial_subscribers": 10,
        "churned_subscribers": 5,
        "free_users": 20,
        "pro_users": 70,
        "enterprise_users": 10
    }]

    # Execute
    stats = revenue_service.get_revenue_stats("tenant-123")

    # Verify structure
    assert stats["mrr"] == 10000.0
    assert stats["arr"] == 120000.0
    assert stats["customer_churn_rate"] == 0.02
    assert stats["active_subscribers"] == 100

def test_get_recent_payments(revenue_service, mock_supabase):
    # Setup mock return
    mock_data = [
        {"id": "pay_1", "amount": 100, "status": "succeeded"},
        {"id": "pay_2", "amount": 200, "status": "pending"}
    ]
    mock_query = mock_supabase.table.return_value.select.return_value.order.return_value.limit.return_value
    mock_query.eq.return_value.execute.return_value.data = mock_data

    # Execute
    payments = revenue_service.get_recent_payments("tenant-123", limit=5)

    # Verify
    assert len(payments) == 2
    assert payments[0]["id"] == "pay_1"

def test_create_snapshot(revenue_service, mock_supabase):
    # Mock dependencies
    revenue_service.get_revenue_stats = Mock(return_value={
        "mrr": 10000, "arr": 120000, "active_subscribers": 100,
        "churned_subscribers": 5, "avg_ltv": 500
    })
    revenue_service.get_churn_rate = Mock(return_value={
        "customer_churn_rate": 0.02, "revenue_churn_rate": 0.01
    })

    # Mock total revenue query
    mock_rev_query = mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value
    mock_rev_query.execute.return_value.data = [{"amount": 100}, {"amount": 200}]

    # Mock new subscribers query
    mock_sub_query = mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value
    mock_sub_result = Mock()
    mock_sub_result.count = 3
    mock_sub_query.execute.return_value = mock_sub_result

    # Mock upsert
    mock_upsert = mock_supabase.table.return_value.upsert.return_value
    mock_upsert.execute.return_value.data = [{"id": "snap_1"}]

    # Execute
    snapshot = revenue_service.create_snapshot("tenant-123")

    # Verify
    assert snapshot["id"] == "snap_1"

    # Verify upsert call
    mock_supabase.table.assert_any_call("revenue_snapshots")
