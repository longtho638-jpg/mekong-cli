"""
Client Portal Repository Facade.
"""
from .invoice_repo import InvoiceRepo
from .message_repo import MessageRepo
from .project_repo import ProjectRepo
from .stats_repo import StatsRepo
from .user_repo import UserRepo


class ClientPortalRepository(UserRepo, ProjectRepo, InvoiceRepo, MessageRepo, StatsRepo):
    """
    Facade for Client Portal Repository.
    Combines all modular repositories into a single interface for backward compatibility.
    """
    def __init__(self, storage_path: str = "data/client_portal"):
        super().__init__(storage_path)
