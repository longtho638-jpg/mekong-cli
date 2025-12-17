"""
🔧 Systems Administrator - System Operations
==============================================

Manage and maintain IT systems.
Keep systems running smoothly!

Roles:
- Server management
- User accounts
- System monitoring
- Backup management
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


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


class SysAdmin:
    """
    Systems Administrator.
    
    Manage IT systems.
    """
    
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
        uptime: int = 30
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
            uptime_days=uptime
        )
        self.servers[server.id] = server
        return server
    
    def update_server(self, server: Server, status: ServerStatus):
        """Update server status."""
        server.status = status
    
    def add_user(
        self,
        username: str,
        email: str,
        department: str,
        role: str = "user"
    ) -> UserAccount:
        """Add a user account."""
        user = UserAccount(
            id=f"USR-{uuid.uuid4().hex[:6].upper()}",
            username=username,
            email=email,
            department=department,
            role=role
        )
        self.users[user.id] = user
        return user
    
    def deactivate_user(self, user: UserAccount):
        """Deactivate user account."""
        user.active = False
    
    def schedule_backup(
        self,
        name: str,
        server: Server,
        hours_interval: int = 24
    ) -> Backup:
        """Schedule a backup."""
        backup = Backup(
            id=f"BKP-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            server_id=server.id,
            next_run=datetime.now() + timedelta(hours=hours_interval)
        )
        self.backups.append(backup)
        return backup
    
    def run_backup(self, backup: Backup, size_gb: float, success: bool = True):
        """Run a backup."""
        backup.status = BackupStatus.COMPLETED if success else BackupStatus.FAILED
        backup.size_gb = size_gb
        backup.last_run = datetime.now()
        backup.next_run = datetime.now() + timedelta(hours=24)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get system stats."""
        running = sum(1 for s in self.servers.values() if s.status == ServerStatus.RUNNING)
        active_users = sum(1 for u in self.users.values() if u.active)
        successful_backups = sum(1 for b in self.backups if b.status == BackupStatus.COMPLETED)
        
        return {
            "servers": len(self.servers),
            "running": running,
            "users": len(self.users),
            "active_users": active_users,
            "backups": len(self.backups),
            "successful_backups": successful_backups
        }
    
    def format_dashboard(self) -> str:
        """Format SysAdmin dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🔧 SYSTEMS ADMINISTRATOR                                 ║",
            f"║  {stats['servers']} servers │ {stats['active_users']} users │ {stats['successful_backups']} backups    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🖥️ SERVERS                                               ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        status_icons = {"running": "🟢", "stopped": "🔴", "maintenance": "🟡", "error": "❌"}
        type_icons = {"web": "🌐", "database": "🗄️", "application": "⚙️", "file": "📁", "mail": "📧"}
        
        for server in list(self.servers.values())[:4]:
            s_icon = status_icons.get(server.status.value, "⚪")
            t_icon = type_icons.get(server.server_type.value, "🖥️")
            
            lines.append(f"║  {s_icon} {t_icon} {server.name[:12]:<12} │ CPU:{server.cpu_percent:>3.0f}% │ MEM:{server.memory_percent:>3.0f}% │ {server.uptime_days}d  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  👥 USER ACCOUNTS                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        role_icons = {"admin": "👑", "user": "👤", "guest": "👻"}
        
        for user in list(self.users.values())[:3]:
            icon = role_icons.get(user.role, "👤")
            status = "✅" if user.active else "❌"
            lines.append(f"║  {status} {icon} {user.username[:12]:<12} │ {user.department[:12]:<12} │ {user.email[:15]:<15}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💾 BACKUPS                                               ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        backup_icons = {"scheduled": "⏰", "running": "🔄", "completed": "✅", "failed": "❌"}
        
        for backup in self.backups[-3:]:
            icon = backup_icons.get(backup.status.value, "⚪")
            last = backup.last_run.strftime("%Y-%m-%d") if backup.last_run else "Never"
            lines.append(f"║  {icon} {backup.name[:15]:<15} │ {backup.size_gb:>5.1f}GB │ {last:<12}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🖥️ Servers]  [👥 Users]  [💾 Backups]                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Systems running smoothly!        ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    sysadmin = SysAdmin("Saigon Digital Hub")
    
    print("🔧 Systems Administrator")
    print("=" * 60)
    print()
    
    # Add servers
    s1 = sysadmin.add_server("Web-Prod-01", ServerType.WEB, "10.0.1.10", 35, 60, 45, 120)
    s2 = sysadmin.add_server("DB-Prod-01", ServerType.DATABASE, "10.0.1.20", 55, 75, 70, 90)
    s3 = sysadmin.add_server("App-Prod-01", ServerType.APPLICATION, "10.0.1.30", 40, 50, 35, 60)
    
    # Add users
    sysadmin.add_user("alex.nguyen", "alex@agency.com", "Engineering", "admin")
    sysadmin.add_user("sarah.tran", "sarah@agency.com", "Marketing", "user")
    sysadmin.add_user("mike.lee", "mike@agency.com", "Sales", "user")
    
    # Schedule backups
    b1 = sysadmin.schedule_backup("Daily DB Backup", s2, 24)
    b2 = sysadmin.schedule_backup("Weekly Full Backup", s1, 168)
    
    sysadmin.run_backup(b1, 25.5, True)
    
    print(sysadmin.format_dashboard())
