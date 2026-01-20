"""
Contract Generator Facade.
"""
from .engine import ContractEngine as BaseGenerator
from .models import Contract, ContractParty, ContractType, PaymentTerms, ServiceScope


class ContractGenerator(BaseGenerator):
    """Contract Generator System."""
    def __init__(self, agency_name: str, agency_email: str, agency_address: str):
        super().__init__(agency_name, agency_email, agency_address)

__all__ = ['ContractGenerator', 'ContractType', 'PaymentTerms', 'ContractParty', 'ServiceScope', 'Contract']
