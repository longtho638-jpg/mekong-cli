"""
Contract Generator engine and formatting.
"""
import logging
import uuid
from datetime import datetime

from .models import Contract, ContractParty, ContractType, PaymentTerms, ServiceScope

logger = logging.getLogger(__name__)

class ContractEngine:
    def __init__(self, name: str, email: str, address: str):
        self.agency = ContractParty(name=name, company=name, email=email, address=address)

    def create_contract(self, client: ContractParty, scope: ServiceScope, monthly_fee: float, **kwargs) -> Contract:
        c = Contract(id=f"AGR-{uuid.uuid4().hex[:6].upper()}", type=kwargs.get("type", ContractType.RETAINER), agency=self.agency, client=client, scope=scope, monthly_fee=float(monthly_fee), payment_terms=kwargs.get("terms", PaymentTerms.NET_30), start_date=datetime.now(), duration_months=kwargs.get("months", 6))
        return c

    def format_contract(self, c: Contract) -> str:
        return f"╔═══════════════════════════════════════════════════════════╗\n║              SERVICE AGREEMENT                            ║\n║  Contract ID: {c.id:<40}  ║\n╚═══════════════════════════════════════════════════════════╝\n\nAGENCY: {c.agency.company}\nCLIENT: {c.client.company}\nFEE: ${c.monthly_fee:,.0f}/mo"
