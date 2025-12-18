"""
©️ IP Manager - Intellectual Property
=======================================

Manage trademarks and copyrights.
Protect your creations!

Features:
- Trademark portfolio
- Copyright registration
- License tracking
- Brand asset protection
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class IPType(Enum):
    """IP types."""
    TRADEMARK = "trademark"
    COPYRIGHT = "copyright"
    PATENT = "patent"
    TRADE_SECRET = "trade_secret"
    DOMAIN = "domain"


class IPStatus(Enum):
    """IP status."""
    PENDING = "pending"
    REGISTERED = "registered"
    EXPIRED = "expired"
    ABANDONED = "abandoned"


class LicenseType(Enum):
    """License types."""
    EXCLUSIVE = "exclusive"
    NON_EXCLUSIVE = "non_exclusive"
    PERPETUAL = "perpetual"
    LIMITED = "limited"


@dataclass
class IntellectualProperty:
    """An intellectual property asset."""
    id: str
    name: str
    ip_type: IPType
    owner: str
    status: IPStatus = IPStatus.PENDING
    registration_number: str = ""
    filed_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    description: str = ""


@dataclass
class License:
    """An IP license."""
    id: str
    ip_id: str
    licensee: str
    license_type: LicenseType
    fee: float = 0
    start_date: datetime = field(default_factory=datetime.now)
    end_date: Optional[datetime] = None


class IPManager:
    """
    IP Manager.
    
    Intellectual property management.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.assets: Dict[str, IntellectualProperty] = {}
        self.licenses: List[License] = []
        
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo data."""
        # Agency IP
        ips = [
            ("Agency Logo", IPType.TRADEMARK, "Registered trademark"),
            ("Brand Guidelines", IPType.COPYRIGHT, "Design system"),
            ("AgencyOS Software", IPType.COPYRIGHT, "Core platform"),
            ("agencyos.com", IPType.DOMAIN, "Primary domain"),
            ("Marketing Framework", IPType.TRADE_SECRET, "Proprietary methodology"),
        ]
        
        for name, iptype, desc in ips:
            ip = self.register_ip(name, iptype, desc)
            ip.status = IPStatus.REGISTERED
    
    def register_ip(
        self,
        name: str,
        ip_type: IPType,
        description: str = ""
    ) -> IntellectualProperty:
        """Register an intellectual property."""
        ip = IntellectualProperty(
            id=f"IP-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            ip_type=ip_type,
            owner=self.agency_name,
            filed_date=datetime.now(),
            description=description
        )
        
        # Set expiry based on type
        if ip_type == IPType.TRADEMARK:
            ip.expiry_date = datetime.now() + timedelta(days=3650)  # 10 years
        elif ip_type == IPType.DOMAIN:
            ip.expiry_date = datetime.now() + timedelta(days=365)  # 1 year
        elif ip_type == IPType.COPYRIGHT:
            ip.expiry_date = datetime.now() + timedelta(days=36500)  # 100 years
        
        self.assets[ip.id] = ip
        return ip
    
    def update_status(self, ip: IntellectualProperty, status: IPStatus):
        """Update IP status."""
        ip.status = status
    
    def create_license(
        self,
        ip: IntellectualProperty,
        licensee: str,
        license_type: LicenseType,
        fee: float = 0,
        duration_days: int = 365
    ) -> License:
        """Create an IP license."""
        license = License(
            id=f"LIC-{uuid.uuid4().hex[:6].upper()}",
            ip_id=ip.id,
            licensee=licensee,
            license_type=license_type,
            fee=fee,
            end_date=datetime.now() + timedelta(days=duration_days)
        )
        self.licenses.append(license)
        return license
    
    def get_expiring_soon(self, days: int = 60) -> List[IntellectualProperty]:
        """Get IPs expiring soon."""
        cutoff = datetime.now() + timedelta(days=days)
        return [
            ip for ip in self.assets.values()
            if ip.status == IPStatus.REGISTERED
            and ip.expiry_date and ip.expiry_date <= cutoff
        ]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get IP statistics."""
        registered = sum(1 for ip in self.assets.values() if ip.status == IPStatus.REGISTERED)
        pending = sum(1 for ip in self.assets.values() if ip.status == IPStatus.PENDING)
        
        by_type = {}
        for ip in self.assets.values():
            t = ip.ip_type.value
            by_type[t] = by_type.get(t, 0) + 1
        
        return {
            "total": len(self.assets),
            "registered": registered,
            "pending": pending,
            "licenses": len(self.licenses),
            "by_type": by_type,
            "expiring_soon": len(self.get_expiring_soon())
        }
    
    def format_dashboard(self) -> str:
        """Format IP manager dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ©️ IP MANAGER                                             ║",
            f"║  {stats['registered']} registered │ {stats['licenses']} licenses │ {stats['expiring_soon']} expiring  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🏆 IP PORTFOLIO                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"trademark": "™️", "copyright": "©️", "patent": "📜",
                     "trade_secret": "🔐", "domain": "🌐"}
        status_icons = {"pending": "⏳", "registered": "✅",
                       "expired": "⏰", "abandoned": "❌"}
        
        for ip in list(self.assets.values())[:5]:
            t_icon = type_icons.get(ip.ip_type.value, "📄")
            s_icon = status_icons.get(ip.status.value, "⚪")
            lines.append(f"║    {t_icon} {s_icon} {ip.name[:35]:<35}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 IP BY TYPE                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for iptype, count in sorted(stats['by_type'].items(), key=lambda x: x[1], reverse=True):
            icon = type_icons.get(iptype, "📄")
            bar = "█" * count + "░" * (10 - min(10, count))
            lines.append(f"║    {icon} {iptype.title():<14} │ {bar} │ {count:>3}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📜 ACTIVE LICENSES                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        if self.licenses:
            for lic in self.licenses[:3]:
                ip = self.assets.get(lic.ip_id)
                ip_name = ip.name if ip else "Unknown"
                lines.append(f"║    📜 {ip_name[:18]:<18} → {lic.licensee[:14]:<14}  ║")
        else:
            lines.append("║    No active licenses                                    ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 IP SUMMARY                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📄 Total Assets:       {stats['total']:>12}              ║",
            f"║    ✅ Registered:         {stats['registered']:>12}              ║",
            f"║    ⏳ Pending:            {stats['pending']:>12}              ║",
            f"║    📜 Active Licenses:    {stats['licenses']:>12}              ║",
            "║                                                           ║",
            "║  [🏆 Portfolio]  [📜 Licenses]  [🔍 Search]               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Protect your creations!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ipm = IPManager("Saigon Digital Hub")
    
    print("©️ IP Manager")
    print("=" * 60)
    print()
    
    # Create a license
    logo = list(ipm.assets.values())[0]
    ipm.create_license(logo, "Partner Agency", LicenseType.NON_EXCLUSIVE, 500)
    
    print(ipm.format_dashboard())
