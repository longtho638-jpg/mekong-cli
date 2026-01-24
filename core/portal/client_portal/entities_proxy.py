"""
Proxy for entity imports to handle both package and direct execution.
"""
try:
    from ...presenters.portal import ClientPortalPresenter
    from ...repositories.client_portal import ClientPortalRepository
    from ...services.client_portal import (
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
    try:
        from core.presenters.portal import ClientPortalPresenter
        from core.repositories.client_portal import ClientPortalRepository
        from core.services.client_portal import (
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
        # Last resort for legacy direct execution if paths are messy
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
