"""
Systems Administrator Logic - Server and User Management.
"""
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from .models import Backup, BackupStatus, Server, ServerStatus, ServerType, UserAccount


class SysAdminManager:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.servers: Dict[str, Server] = {}
        self.users: Dict[str, UserAccount] = {}
        self.backups: List[Backup] = []

    def add_server(
        self,
        name: str,
        server_type: ServerType,
        ip_address: str,
        cpu: float = 20,
        memory: float = 40,
        disk: float = 50,
        uptime: int = 30,
    ) -> Server:
        """Add a server."""
        server = Server(
            id=f"SRV-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            server_type=server_type,
            ip_address=ip_address,
            cpu_percent=cpu,
            memory_percent=memory,
            disk_percent=disk,
            uptime_days=uptime,
        )
        self.servers[server.id] = server
        return server

    def update_server(self, server: Server, status: ServerStatus):
        """Update server status."""
        server.status = status

    def add_user(
        self, username: str, email: str, department: str, role: str = "user"
    ) -> UserAccount:
        """Add a user account."""
        user = UserAccount(
            id=f"USR-{uuid.uuid4().hex[:6].upper()}",
            username=username,
            email=email,
            department=department,
            role=role,
        )
        self.users[user.id] = user
        return user

    def deactivate_user(self, user: UserAccount):
        """Deactivate user account."""
        user.active = False

    def schedule_backup(self, name: str, server: Server, hours_interval: int = 24) -> Backup:
        """Schedule a backup."""
        backup = Backup(
            id=f"BKP-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            server_id=server.id,
            next_run=datetime.now() + timedelta(hours=hours_interval),
        )
        self.backups.append(backup)
        return backup

    def run_backup(self, backup: Backup, size_gb: float, success: bool = True):
        """Run a backup."""
        backup.status = BackupStatus.COMPLETED if success else BackupStatus.FAILED
        backup.size_gb = size_gb
        backup.last_run = datetime.now()
        backup.next_run = datetime.now() + timedelta(hours=24)
