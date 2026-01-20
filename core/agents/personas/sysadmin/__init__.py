"""
SysAdmin Persona Facade and Dashboard.
"""
from typing import Any, Dict

from .manager import SysAdminManager
from .models import Backup, BackupStatus, Server, ServerStatus, ServerType, UserAccount


class SysAdmin(SysAdminManager):
    """
    Systems Administrator.
    Manage IT systems.
    """
    def __init__(self, agency_name: str):
        super().__init__(agency_name)

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
            "successful_backups": successful_backups,
        }

    def format_dashboard(self) -> str:
        """Format SysAdmin dashboard."""
        stats = self.get_stats()
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🔧 SYSTEMS ADMINISTRATOR                                 ║",
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

        lines.extend(["║                                                           ║", "║  👥 USER ACCOUNTS                                         ║", "║  ─────────────────────────────────────────────────────── ║"])
        role_icons = {"admin": "👑", "user": "👤", "guest": "👻"}
        for user in list(self.users.values())[:3]:
            icon = role_icons.get(user.role, "👤")
            status = "✅" if user.active else "❌"
            lines.append(f"║  {status} {icon} {user.username[:12]:<12} │ {user.department[:12]:<12} │ {user.email[:15]:<15}  ║")

        lines.extend(["║                                                           ║", "║  💾 BACKUPS                                               ║", "║  ─────────────────────────────────────────────────────── ║"])
        backup_icons = {"scheduled": "⏰", "running": "🔄", "completed": "✅", "failed": "❌"}
        for backup in self.backups[-3:]:
            icon = backup_icons.get(backup.status.value, "⚪")
            last = backup.last_run.strftime("%Y-%m-%d") if backup.last_run else "Never"
            lines.append(f"║  {icon} {backup.name[:15]:<15} │ {backup.size_gb:>5.1f}GB │ {last:<12}  ║")

        lines.extend([
            "║                                                           ║",
            "║  [🖥️ Servers]  [👥 Users]  [💾 Backups]                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Castle {self.agency_name} - Systems running smoothly!        ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)
