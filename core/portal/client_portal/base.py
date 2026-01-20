"""
Base initialization and demo data for Client Portal.
"""
import logging

from .entities_proxy import (
    ClientPortalPresenter,
    ClientPortalRepository,
    ClientPortalService,
    InvoiceStatus,
    TaskStatus,
)

logger = logging.getLogger(__name__)

class BasePortal:
    """Base logic for Client Portal layers and state."""
    def __init__(self, agency_name: str = "Nova Digital"):
        self.agency_name = agency_name
        self.service = ClientPortalService(agency_name)
        self.repository = ClientPortalRepository()
        self.presenter = ClientPortalPresenter(agency_name)

        # Load data
        self.clients = self.repository.load_clients()
        self.projects = self.repository.load_projects()
        self.invoices = self.repository.load_invoices()
        self.messages = self.repository.load_messages()
        self.service.stats = self.repository.load_stats()

        if not self.clients:
            self._create_demo_data()

    def _create_demo_data(self):
        """Tạo demo data cho testing."""
        logger.info("Loading demo client portal data...")
        try:
            client = self.add_client("John Smith", "john@example.com", "Acme Corp", 2000.0)
            project = self.create_project(
                client.id, "Website Redesign", "Complete overhauled branding", 5000.0
            )

            tasks = [("Discovery", TaskStatus.DONE), ("Homepage", TaskStatus.IN_PROGRESS)]
            for name, status in tasks:
                self.add_task(project.id, name, f"Complete {name.lower()}", status)

            self.create_invoice(
                client.id,
                2500.0,
                [{"name": "Phase 1", "amount": 2500.0}],
                project_id=project.id,
                status=InvoiceStatus.PAID,
            )
        except Exception as e:
            logger.error(f"Demo data error: {e}")
