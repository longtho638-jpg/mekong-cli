"""
Proxy for entity imports to handle both package and direct execution.
"""
try:
    from ..presenters.client_portal_presenter import ClientPortalPresenter
    from ..repositories.client_portal_repository import ClientPortalRepository
    from ..services.client_portal_service import (
        Client,
        ClientPortalService,
        ClientStatus,
        Invoice,
        InvoiceStatus,
        Message,
        Project,
        ProjectStatus,
        TaskStatus,
    )
except ImportError:
    from presenters.client_portal_presenter import ClientPortalPresenter
    from repositories.client_portal_repository import ClientPortalRepository
    from services.client_portal_service import (
        Client,
        ClientPortalService,
        ClientStatus,
        Invoice,
        InvoiceStatus,
        Message,
        Project,
        ProjectStatus,
        TaskStatus,
    )
