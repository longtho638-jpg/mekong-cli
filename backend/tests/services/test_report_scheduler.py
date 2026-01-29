"""
Test Report Scheduler
=====================

Tests for the executive report scheduler service.
"""

import os
from unittest.mock import AsyncMock, Mock, patch

import pytest

# Mock env vars to prevent RevenueService init failure during import if any
os.environ["SUPABASE_URL"] = "https://example.supabase.co"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "dummy_key"

from backend.services.report_scheduler import ReportSchedulerService


@pytest.fixture
def mock_revenue_service():
    # Create a Mock object that simulates RevenueService instance
    service = Mock()
    service.get_revenue_stats.return_value = {
        "mrr": 10000.0,
        "arr": 120000.0,
        "customer_churn_rate": 2.5,
        "active_subscribers": 100,
        "new_subscribers": 10,
        "avg_ltv": 500.0,
        "revenue_churn_rate": 1.0,
        "churned_subscribers": 2,
        "free_users": 50,
        "pro_users": 40,
        "enterprise_users": 10,
    }
    service.get_revenue_trend.return_value = [
        {"snapshot_date": "2023-01-01", "mrr": 9000.0},
        {"snapshot_date": "2023-01-30", "mrr": 10000.0},
    ]
    return service


@pytest.fixture
def mock_email_service():
    with patch("backend.services.report_scheduler.get_email_service") as mock:
        service = mock.return_value
        service.send_email = AsyncMock(return_value={"status": "sent"})
        yield service


@pytest.fixture
def mock_pdf_generator():
    with patch("backend.services.report_scheduler.pdf_generator") as mock:
        mock.generate_executive_report.return_value = b"mock_pdf_content"
        yield mock


@pytest.fixture
def mock_crm_metrics():
    with patch("backend.api.routers.executive._get_crm_metrics") as mock:
        mock.return_value = {"new_leads": 5, "active_pipeline": 10000}
        yield mock


@pytest.mark.asyncio
async def test_generate_and_send_report(
    mock_revenue_service, mock_email_service, mock_pdf_generator, mock_crm_metrics
):
    """Test the full report generation and sending flow."""

    # We patch RevenueService in the report_scheduler module to return our mock instance
    with patch(
        "backend.services.report_scheduler.RevenueService", return_value=mock_revenue_service
    ):
        scheduler = ReportSchedulerService()

        success = await scheduler.generate_and_send_report(
            tenant_id="test_tenant", report_type="weekly", recipient_email="exec@example.com"
        )

        assert success is True

        # Verify Revenue Service calls
        mock_revenue_service.get_revenue_stats.assert_called_with("test_tenant")
        mock_revenue_service.get_revenue_trend.assert_called_with("test_tenant", 7)

        # Verify PDF Generation
        mock_pdf_generator.generate_executive_report.assert_called_once()

        # Verify Email Sending
        mock_email_service.send_email.assert_called_once()
        args, kwargs = mock_email_service.send_email.call_args
        assert kwargs["to_email"] == "exec@example.com"
        assert "Executive Summary (Weekly)" in kwargs["subject"]
        assert len(kwargs["attachments"]) == 1
        assert kwargs["attachments"][0]["content"] == b"mock_pdf_content"


@pytest.mark.asyncio
async def test_send_report_no_recipient(mock_revenue_service, mock_email_service):
    """Test handling when no recipient email is provided."""
    with patch(
        "backend.services.report_scheduler.RevenueService", return_value=mock_revenue_service
    ):
        scheduler = ReportSchedulerService()

        success = await scheduler.generate_and_send_report(
            tenant_id="test_tenant", recipient_email=None
        )

        assert success is False
        mock_email_service.send_email.assert_not_called()
