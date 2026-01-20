"""
Franchise System Facade.
"""
from .engine import FranchiseEngine
from .models import Franchisee, FranchiseStatus, FranchiseTier, Territory, TerritoryStatus


class FranchiseSystem(FranchiseEngine):
    def __init__(self):
        super().__init__()
        self._create_demo_data()

    def _create_demo_data(self):
        t1 = Territory("VN-HCM", "Vietnam", "HCM City", population=9000)
        self.territories[t1.id] = t1
        self.onboard_franchisee("Minh Nguyen", "minh@agency.vn", "Minh Digital", FranchiseTier.FRANCHISE)

    def format_dashboard(self) -> str:
        active = [f for f in self.franchisees.values() if f.status == FranchiseStatus.ACTIVE]
        lines = ["╔═══════════════════════════════════════════════════════════╗", f"║  🌍 FRANCHISE NETWORK DASHBOARD{' ' * 30}║", f"║  {len(active)} active partners │ {len(self.territories)} territories{' ' * 19}║", "╚═══════════════════════════════════════════════════════════╝"]
        return "\n".join(lines)
