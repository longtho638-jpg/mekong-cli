"""
Systems Administrator Data Models.
"""
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class ServerStatus(Enum):
    """Server status."""
    RUNNING = "running"
    STOPPED = "stopped"
    MAINTENANCE = "maintenance"
    ERROR = "error"

class ServerType(Enum):
    """Server types."""
    WEB = "web"
    DATABASE = "database"
    APPLICATION = "application"
    FILE = "file"
    MAIL = "mail"

class BackupStatus(Enum):
    """Backup status."""
    SCHEDULED = "scheduled"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class Server:
    """A server."""
    id: str
    name: str
    server_type: ServerType
    ip_address: str
    status: ServerStatus = ServerStatus.RUNNING
    cpu_percent: float = 0
    memory_percent: float = 0
    disk_percent: float = 0
    uptime_days: int = 0

@dataclass
class UserAccount:
    """A user account."""
    id: str
    username: str
    email: str
    department: str
    role: str = "user"  # admin, user, guest
    active: bool = True
    last_login: Optional[datetime] = None

@dataclass
class Backup:
    """A backup job."""
    id: str
    name: str
    server_id: str
    status: BackupStatus = BackupStatus.SCHEDULED
    size_gb: float = 0
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
