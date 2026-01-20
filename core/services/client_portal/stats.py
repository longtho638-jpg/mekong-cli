"""
Statistics and calculation logic for Client Portal.
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from .models import Invoice, InvoiceStatus, Project, TaskStatus

logger = logging.getLogger(__name__)

class StatsManager:
    def __init__(self):
        self.stats = {
            "total_clients": 0,
            "active_clients": 0,
            "total_projects": 0,
            "active_projects": 0,
            "total_invoiced": 0.0,
            "total_collected": 0.0,
        }

    def update_client_stats(self, client_count_change: int = 0, active_change: int = 0) -> None:
        self.stats["total_clients"] += client_count_change
        self.stats["active_clients"] += active_change

    def update_project_stats(self, project_count_change: int = 0, active_change: int = 0) -> None:
        self.stats["total_projects"] += project_count_change
        self.stats["active_projects"] += active_change

    def get_stats(self) -> Dict[str, Any]:
        return self.stats.copy()

    def calculate_project_progress(self, project: Project) -> float:
        if not project.tasks:
            return 0.0
        done = sum(1 for t in project.tasks if t.status == TaskStatus.DONE)
        return (done / len(project.tasks)) * 100.0

    def is_project_over_budget(self, project: Project) -> bool:
        return project.spent > project.budget

    def is_invoice_overdue(self, invoice: Invoice) -> bool:
        if invoice.status == InvoiceStatus.PAID:
            return False
        return datetime.now() > invoice.due_date
