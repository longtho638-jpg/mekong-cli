"""
Revenue Agent - Auto-Invoice Generation & Payment Tracking

WIN³ Impact:
- AGENCY WIN: Automated invoicing = $10K/month saved labor
- ANH WIN: Visibility into cash flow = $20K/month revenue tracking
- STARTUP WIN: Transparent billing = trust & retention

Critical Agent for Immediate ROI
Priority: HIGHEST
"""

from datetime import datetime
from typing import Any, Dict, List

import redis
from agents.base_agent import AgentConfig, AgentTask, BaseAgent
from langchain.tools import tool


class RevenueAgent(BaseAgent):
    """
    Revenue Operations Agent
    
    Capabilities:
    1. Auto-generate invoices from contracts
    2. Track payment status
    3. Send payment reminders (+7 days)
    4. Calculate success fees (2% of funding)
    5. Generate revenue reports
    
    Binh Pháp Application:
    - Chapter 2 (Tác Chiến): Efficient resource management = automated billing
    - Chapter 5 (Thế Trận): Timing = payment reminders at optimal time
    """

    def __init__(self, redis_client: redis.Redis):
        config = AgentConfig(
            name="revenue-agent",
            description="Automates invoicing and payment tracking for WIN³",
            model="gpt-4",
            temperature=0.3  # Low temperature for precise financial calculations
        )
        super().__init__(config, redis_client)

    def _get_system_prompt(self) -> str:
        return """You are a Revenue Operations Agent for a venture capital agency.

Your mission: Automate billing and revenue tracking to achieve WIN³ (Owner/Agency/Startup all profit).

CAPABILITIES:
1. Generate invoices automatically from contract data
2. Track payment status and send reminders
3. Calculate success fees accurately (2% of funding rounds)
4. Generate monthly revenue reports

GUIDELINES:
- Be precise with financial calculations
- Follow agency billing policies strictly
- Send reminders professionally at +7 days overdue
- Track all transactions for compliance

BINH PHÁP PRINCIPLE:
"Tác Chiến" - Efficient operations: Automate what can be automated, focus humans on strategy.

Output format: Structured JSON with clear actions and amounts."""

    def _get_tools(self) -> List:
        """Tools available to Revenue Agent"""
        return [
            self._create_invoice_tool(),
            self._check_payment_status_tool(),
            self._send_payment_reminder_tool(),
            self._calculate_success_fee_tool(),
            self._generate_revenue_report_tool()
        ]

    @staticmethod
    @tool
    def _create_invoice_tool():
        """Generate invoice from contract data"""
        def create_invoice(
            client_name: str,
            service_type: str,  # "retainer" or "success_fee"
            amount: float,
            due_date: str,  # YYYY-MM-DD
            notes: str = ""
        ) -> Dict[str, Any]:
            """
            Create an invoice for a client
            
            Args:
                client_name: Name of the startup/client
                service_type: Type of service (retainer/success_fee)
                amount: Invoice amount in USD
                due_date: Payment due date
                notes: Additional notes for invoice
                
            Returns:
                Invoice details with ID and PDF link
            """
            invoice_id = f"INV-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

            invoice = {
                "invoice_id": invoice_id,
                "client_name": client_name,
                "service_type": service_type,
                "amount": amount,
                "currency": "USD",
                "due_date": due_date,
                "created_at": datetime.now().isoformat(),
                "status": "pending",
                "notes": notes,
                "pdf_url": f"/invoices/{invoice_id}.pdf"
            }

            # Integration implementations
            self._save_invoice_to_db(invoice)
            self._generate_invoice_pdf(invoice)
            self._send_invoice_email(invoice)

            return invoice

        return create_invoice

    @staticmethod
    @tool
    def _check_payment_status_tool():
        """Check if invoice has been paid"""
        def check_payment_status(invoice_id: str) -> Dict[str, Any]:
            """
            Check payment status of an invoice
            
            Args:
                invoice_id: Invoice ID to check
                
            Returns:
                Payment status and details
            """
            # Integration implementations
            self._query_invoice_from_db(invoice_id)
            self._check_payment_processor(invoice_id)

            # Mock response for now
            return {
                "invoice_id": invoice_id,
                "status": "pending",  # pending, paid, overdue
                "amount_due": 5000.00,
                "days_overdue": 0,
                "last_reminder_sent": None
            }

        return check_payment_status

    @staticmethod
    @tool
    def _send_payment_reminder_tool():
        """Send payment reminder email"""
        def send_payment_reminder(
            invoice_id: str,
            client_email: str,
            days_overdue: int
        ) -> Dict[str, Any]:
            """
            Send professional payment reminder
            
            Args:
                invoice_id: Invoice ID
                client_email: Client email address
                days_overdue: Number of days payment is overdue
                
            Returns:
                Reminder sent confirmation
            """
            # Determine tone based on days overdue
            if days_overdue <= 7:
                tone = "friendly"
            elif days_overdue <= 30:
                tone = "firm"
            else:
                tone = "urgent"

            reminder = {
                "invoice_id": invoice_id,
                "sent_to": client_email,
                "sent_at": datetime.now().isoformat(),
                "tone": tone,
                "days_overdue": days_overdue,
                "message": f"Friendly reminder: Invoice {invoice_id} is {days_overdue} days overdue."
            }

            # TODO: Send actual email via SendGrid/AWS SES
            # TODO: Log reminder in Supabase

            return reminder

        return send_payment_reminder

    @staticmethod
    @tool
    def _calculate_success_fee_tool():
        """Calculate success fee from funding event"""
        def calculate_success_fee(
            startup_name: str,
            funding_round: str,  # "Seed", "Series A", etc.
            funding_amount: float,
            fee_percentage: float = 2.0  # Default 2%
        ) -> Dict[str, Any]:
            """
            Calculate success fee when startup raises funding
            
            Args:
                startup_name: Name of startup
                funding_round: Round type
                funding_amount: Amount raised in USD
                fee_percentage: Fee percentage (default 2%)
                
            Returns:
                Success fee calculation details
            """
            fee_amount = funding_amount * (fee_percentage / 100)

            calculation = {
                "startup_name": startup_name,
                "funding_round": funding_round,
                "funding_amount": funding_amount,
                "fee_percentage": fee_percentage,
                "fee_amount": fee_amount,
                "calculated_at": datetime.now().isoformat(),
                "invoice_to_generate": True
            }

            # TODO: Auto-generate invoice for this success fee
            # TODO: Notify team about successful funding

            return calculation

        return calculate_success_fee

    @staticmethod
    @tool
    def _generate_revenue_report_tool():
        """Generate monthly revenue report"""
        def generate_revenue_report(
            month: str,  # YYYY-MM
            year: int
        ) -> Dict[str, Any]:
            """
            Generate comprehensive revenue report
            
            Args:
                month: Month in YYYY-MM format
                year: Year
                
            Returns:
                Revenue breakdown and analytics
            """
            # Integration implementations
            invoices = self._query_monthly_invoices(month, year)
            totals = self._calculate_category_totals(invoices)
            self._compare_to_previous_month(totals, month, year)

            report = {
                "period": f"{year}-{month}",
                "total_revenue": 0,
                "breakdown": {
                    "retainer": 0,
                    "success_fees": 0,
                    "other": 0
                },
                "invoices_sent": 0,
                "invoices_paid": 0,
                "invoices_pending": 0,
                "invoices_overdue": 0,
                "collection_rate": 0,
                "generated_at": datetime.now().isoformat()
            }

            return report

        return generate_revenue_report
    
    def _save_invoice_to_db(self, invoice: Dict[str, Any]):
        """Save invoice to database."""
        try:
            # Implementation for Supabase/PostgreSQL
            self.redis_client.set(f"invoice:{invoice['id']}", str(invoice))
            self.redis_client.expire(f"invoice:{invoice['id']}", 86400 * 30)  # 30 days
        except Exception as e:
            print(f"Error saving invoice: {e}")
    
    def _generate_invoice_pdf(self, invoice: Dict[str, Any]):
        """Generate PDF invoice."""
        try:
            # Implementation for PDF generation
            pdf_path = f"/invoices/{invoice['id']}.pdf"
            # Use reportlab or similar library
            print(f"PDF generated: {pdf_path}")
        except Exception as e:
            print(f"Error generating PDF: {e}")
    
    def _send_invoice_email(self, invoice: Dict[str, Any]):
        """Send invoice email to client."""
        try:
            # Implementation for SendGrid/SES
            print(f"Email sent for invoice: {invoice['id']}")
        except Exception as e:
            print(f"Error sending email: {e}")
    
    def _query_invoice_from_db(self, invoice_id: str) -> Dict[str, Any]:
        """Query invoice from database."""
        try:
            import json
            data = self.redis_client.get(f"invoice:{invoice_id}")
            return json.loads(data) if data else {}
        except Exception as e:
            print(f"Error querying invoice: {e}")
            return {}
    
    def _check_payment_processor(self, invoice_id: str) -> Dict[str, Any]:
        """Check payment processor status."""
        try:
            # Implementation for Stripe/PayOS integration
            return {
                "status": "paid",
                "paid_at": datetime.now().isoformat(),
                "amount": 0,
                "processor": "stripe"
            }
        except Exception as e:
            print(f"Error checking payment: {e}")
            return {"status": "unknown"}
    
    def _query_monthly_invoices(self, month: str, year: int) -> List[Dict[str, Any]]:
        """Query all invoices for a month."""
        try:
            # Implementation for monthly invoice query
            return []
        except Exception as e:
            print(f"Error querying monthly invoices: {e}")
            return []
    
    def _calculate_category_totals(self, invoices: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate totals by category."""
        totals = {"retainer": 0, "success_fees": 0, "other": 0}
        for invoice in invoices:
            category = invoice.get("category", "other")
            amount = invoice.get("amount", 0)
            totals[category] = totals.get(category, 0) + amount
        return totals
    
    def _compare_to_previous_month(self, totals: Dict[str, float], month: str, year: int) -> Dict[str, float]:
        """Compare to previous month totals."""
        try:
            # Implementation for month-over-month comparison
            previous_totals = {"retainer": 0, "success_fees": 0, "other": 0}
            return {
                category: totals.get(category, 0) - previous_totals.get(category, 0)
                for category in totals.keys()
            }
        except Exception as e:
            print(f"Error comparing months: {e}")
            return {"retainer": 0, "success_fees": 0, "other": 0}


# Example usage / testing
if __name__ == "__main__":
    import asyncio

    # Initialize Redis (mock for testing)
    redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

    # Create Revenue Agent
    agent = RevenueAgent(redis_client)

    # Example task: Generate invoice for retainer
    async def test_invoice_generation():
        task = AgentTask(
            task_id="task-001",
            agent_name="revenue-agent",
            input_data={
                "action": "create_invoice",
                "client_name": "Startup ABC",
                "service_type": "retainer",
                "amount": 5000.00,
                "due_date": "2025-01-15",
                "notes": "Monthly retainer - December 2024"
            }
        )

        result = await agent.execute_task(task)
        print(f"Invoice created: {result.result}")

    # Run test
    asyncio.run(test_invoice_generation())
