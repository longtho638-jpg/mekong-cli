"""
Report Scheduler Service
========================

Handles the execution of scheduled executive reports.
Orchestrates: Data Fetching -> PDF Generation -> Email Delivery.
"""

import logging
from datetime import date, timedelta
from typing import Optional

from backend.api.routers.executive import _get_crm_metrics
from backend.api.services.revenue_service import RevenueService
from backend.services.email_service import get_email_service
from backend.services.pdf_generator import pdf_generator

logger = logging.getLogger(__name__)


class ReportSchedulerService:
    """Service to generate and deliver executive reports."""

    def __init__(self):
        self.revenue_service = RevenueService()
        self.email_service = get_email_service()

    async def generate_and_send_report(
        self, tenant_id: str, report_type: str = "weekly", recipient_email: str = None
    ) -> bool:
        """
        Generate executive report and email it.

        Args:
            tenant_id: Tenant ID
            report_type: 'daily', 'weekly', 'monthly'
            recipient_email: Email to send report to

        Returns:
            bool: Success status
        """
        try:
            logger.info(f"Generating {report_type} report for tenant {tenant_id}")

            # 1. Determine date range
            days = 30
            if report_type == "weekly":
                days = 7
            elif report_type == "daily":
                days = 1
            elif report_type == "monthly":
                days = 30

            start_date = (date.today() - timedelta(days=days)).isoformat()
            end_date = date.today().isoformat()

            # 2. Gather Data
            # Revenue
            rev_stats = self.revenue_service.get_revenue_stats(tenant_id)
            trends = self.revenue_service.get_revenue_trend(tenant_id, days)

            # CRM (Mock/Simple for now)
            crm_stats = _get_crm_metrics()

            # Insights
            insights = []
            if rev_stats["customer_churn_rate"] > 5.0:
                insights.append(
                    f"CRITICAL: Churn rate is {rev_stats['customer_churn_rate']}%. Action required."
                )

            if trends and len(trends) > 1:
                growth = (
                    ((trends[-1]["mrr"] - trends[0]["mrr"]) / trends[0]["mrr"]) * 100
                    if trends[0]["mrr"] > 0
                    else 0
                )
                insights.append(f"Revenue Growth: {growth:.1f}% in the last {days} days.")

            insights.append(f"New Leads: {crm_stats['new_leads']} new leads acquired.")

            # 3. Generate PDF
            pdf_bytes = pdf_generator.generate_executive_report(
                metrics=rev_stats,
                trends=trends,
                insights=insights,
                start_date=start_date,
                end_date=end_date,
            )

            # 4. Send Email
            if not recipient_email:
                # TODO: Fetch tenant admin email from User Service
                # For now, fallback or log warning
                logger.warning(f"No recipient email found for tenant {tenant_id}")
                return False

            subject = f"Executive Summary ({report_type.title()}) - {end_date}"

            # Prepare attachment
            attachment = {
                "filename": f"Executive_Report_{end_date}.pdf",
                "content": pdf_bytes,  # Email service needs to handle bytes or base64
                "content_type": "application/pdf",
            }

            # Note: EmailService.send_email signature might need adjustment if it expects base64 encoded content
            # or if 'attachments' parameter handles bytes.
            # Assuming standard attachment dict format.

            html_content = f"""
            <h2>Your {report_type.title()} Executive Summary is ready.</h2>
            <p>Please find the attached PDF report covering key metrics and insights for the period {start_date} to {end_date}.</p>
            <p><strong>Highlights:</strong></p>
            <ul>
                <li>MRR: ${rev_stats["mrr"]:,.2f}</li>
                <li>Active Subscribers: {rev_stats["active_subscribers"]}</li>
            </ul>
            """

            await self.email_service.send_email(
                to_email=recipient_email,
                subject=subject,
                html_content=html_content,
                attachments=[attachment],
            )

            logger.info(f"Report sent successfully to {recipient_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to generate/send report: {e}")
            return False


# Singleton
_report_scheduler_service = None


def get_report_scheduler_service():
    """Get singleton instance of ReportSchedulerService."""
    global _report_scheduler_service
    if not _report_scheduler_service:
        _report_scheduler_service = ReportSchedulerService()
    return _report_scheduler_service
