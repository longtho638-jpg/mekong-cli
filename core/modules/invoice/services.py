"""
Invoice Module - Service Logic
"""
import uuid
import logging
from typing import Dict, List, Any
from .entities import Invoice, InvoiceItem, Currency, InvoiceStatus
try:
    from core.infrastructure.database import get_db
except (ImportError, ValueError):
    def get_db(): return None

logger = logging.getLogger(__name__)

class InvoiceSystem:
    """
    Invoice and Billing System.
    """
    
    def __init__(self, agency_name: str = "My Agency"):
        self.agency_name = agency_name
        self.db = get_db()
        self.invoices: Dict[str, Invoice] = {}
        logger.info(f"Invoice System initialized for {agency_name}")
        
        if self.db:
            self._load_from_db()
        else:
            self._init_demo_data()
    
    def _load_from_db(self):
        try:
            # Simplified load - In real world would need joins
            res = self.db.table("invoices").select("*").execute()
            for r in res.data:
                # Minimal hydration for dashboard count
                # To fully hydrate we'd need to fetch items
                inv = Invoice(
                    id=r['id'], client_id=r.get('client_id', ''), 
                    client_name=r.get('client_name', 'Unknown'),
                    items=[], # Lazy load or separate fetch
                    currency=Currency.USD,
                    status=InvoiceStatus(r['status']) if r['status'] in InvoiceStatus._value2member_map_ else InvoiceStatus.DRAFT
                )
                self.invoices[inv.id] = inv
        except Exception as e:
            logger.error(f"Invoice DB Error: {e}")
            self._init_demo_data()

    def _init_demo_data(self):
        """Seed the system with sample invoices."""
        logger.info("Loading demo invoice data...")
        try:
            self.create_invoice("C1", "Acme Corp", [InvoiceItem("SEO Monthly", 1, 1500.0)])
        except Exception as e:
            logger.error(f"Demo data error: {e}")
    
    def create_invoice(
        self,
        client_id: str,
        client_name: str,
        items: List[InvoiceItem],
        currency: Currency = Currency.USD
    ) -> Invoice:
        """Register a new billable invoice."""
        if not items:
            raise ValueError("Invoice must contain at least one item")

        inv = Invoice(
            id=f"INV-{uuid.uuid4().hex[:6].upper()}",
            client_id=client_id, client_name=client_name,
            items=items, currency=currency
        )
        self.invoices[inv.id] = inv
        logger.info(f"Invoice generated: {inv.id} for {client_name}")
        return inv

    def get_summary(self) -> Dict[str, Any]:
        """Get summary stats for dashboard."""
        total = len(self.invoices)
        paid = len([i for i in self.invoices.values() if i.status == InvoiceStatus.PAID])
        pending = len([i for i in self.invoices.values() if i.status in [InvoiceStatus.DRAFT, InvoiceStatus.SENT]])
        total_val = sum(i.total for i in self.invoices.values())
        
        return {
            "total_invoices": total,
            "paid": paid,
            "pending": pending,
            "total_value_usd": f"${total_val:,.2f}"
        }
    
    def format_invoice(self, invoice: Invoice) -> str:
        """Delegate formatting to Presenter (backward compat helper)."""
        from .presentation import InvoicePresenter
        return InvoicePresenter.format_invoice_ascii(self, invoice.id)
