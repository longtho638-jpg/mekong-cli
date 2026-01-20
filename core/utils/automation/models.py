"""
Data models and Enums for Data Automation.
"""
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class WorkflowStatus(Enum):
    """Execution status of an automation workflow."""
    ACTIVE = "active"
    PAUSED = "paused"
    ERROR = "error"
    DISABLED = "disabled"

class DataSource(Enum):
    """Available data sources and destinations."""
    CRM = "crm"
    SPREADSHEET = "spreadsheet"
    API = "api"
    EMAIL = "email"
    FORM = "form"
    DATABASE = "database"

class TriggerType(Enum):
    """Types of triggers that initiate automation."""
    SCHEDULE = "schedule"
    WEBHOOK = "webhook"
    EVENT = "event"
    MANUAL = "manual"

@dataclass
class AutomationWorkflow:
    """An automation workflow entity."""
    id: str
    name: str
    source: DataSource
    destination: DataSource
    trigger: TriggerType
    status: WorkflowStatus = WorkflowStatus.ACTIVE
    runs_count: int = 0
    records_processed: int = 0
    last_run: Optional[datetime] = None
    error_count: int = 0

@dataclass
class DataImport:
    """A single data import batch entity."""
    id: str
    source: str
    destination: str
    records: int
    success: int = 0
    errors: int = 0
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None

    def __post_init__(self):
        if self.records < 0:
            raise ValueError("Record count cannot be negative")

@dataclass
class IntegrationSync:
    """A continuous integration sync between two applications."""
    id: str
    app_a: str
    app_b: str
    sync_type: str  # one_way, two_way
    last_sync: datetime = field(default_factory=datetime.now)
    synced_records: int = 0
    is_active: bool = True
