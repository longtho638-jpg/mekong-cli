"""
Refactored Client Portal Facade.
"""
from .client_ops import ClientOps
from .invoice_ops import InvoiceOps
from .message_ops import MessageOps
from .project_ops import ProjectOps
from .rendering import RenderingOps


class ClientPortal(ClientOps, ProjectOps, InvoiceOps, MessageOps, RenderingOps):
    """
    Refactored Client Portal với modular architecture.
    Combines all modular components into a single interface.
    """
    def __init__(self, agency_name: str = "Nova Digital"):
        super().__init__(agency_name)
