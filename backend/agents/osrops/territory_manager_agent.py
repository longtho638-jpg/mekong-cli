"""
Territory Manager Agent - Geographic Sales Territory
Manages territories, coverage, and route optimization.
"""

from dataclasses import dataclass
from typing import List, Dict


@dataclass
class Territory:
    """Sales territory"""
    id: str
    name: str
    region: str
    assigned_rep: str
    customer_count: int = 0
    revenue_target: float = 0.0
    revenue_actual: float = 0.0
    coverage_percent: float = 0.0

    @property
    def attainment(self) -> float:
        return (self.revenue_actual / self.revenue_target * 100) if self.revenue_target > 0 else 0


@dataclass
class RouteStop:
    """Route stop"""
    customer: str
    address: str
    priority: int
    estimated_time_mins: int


class TerritoryManagerAgent:
    """
    Territory Manager Agent - Quản lý Địa bàn
    
    Responsibilities:
    - Territory assignment
    - Coverage tracking
    - Route optimization
    - Geographic analytics
    """

    def __init__(self):
        self.name = "Territory Manager"
        self.status = "ready"
        self.territories: Dict[str, Territory] = {}

    def create_territory(
        self,
        name: str,
        region: str,
        assigned_rep: str,
        revenue_target: float = 0.0
    ) -> Territory:
        """Create a new territory"""
        territory_id = f"territory_{name.lower().replace(' ', '_')}"

        territory = Territory(
            id=territory_id,
            name=name,
            region=region,
            assigned_rep=assigned_rep,
            revenue_target=revenue_target
        )

        self.territories[territory_id] = territory
        return territory

    def update_coverage(self, territory_id: str, customer_count: int, coverage_percent: float) -> Territory:
        """Update territory coverage"""
        if territory_id not in self.territories:
            raise ValueError(f"Territory not found: {territory_id}")

        territory = self.territories[territory_id]
        territory.customer_count = customer_count
        territory.coverage_percent = coverage_percent

        return territory

    def record_revenue(self, territory_id: str, amount: float) -> Territory:
        """Record revenue for territory"""
        if territory_id not in self.territories:
            raise ValueError(f"Territory not found: {territory_id}")

        territory = self.territories[territory_id]
        territory.revenue_actual += amount

        return territory

    def plan_route(self, stops: List[Dict]) -> List[RouteStop]:
        """Plan optimized route for field visits"""
        route_stops = [
            RouteStop(
                customer=stop["customer"],
                address=stop["address"],
                priority=stop.get("priority", 1),
                estimated_time_mins=stop.get("time_mins", 30)
            )
            for stop in stops
        ]

        # Sort by priority (simple optimization)
        return sorted(route_stops, key=lambda s: s.priority)

    def get_leaderboard(self) -> List[Territory]:
        """Get territories sorted by attainment"""
        return sorted(self.territories.values(), key=lambda t: t.attainment, reverse=True)

    def get_stats(self) -> Dict:
        """Get territory statistics"""
        territories = list(self.territories.values())

        return {
            "total_territories": len(territories),
            "total_customers": sum(t.customer_count for t in territories),
            "total_revenue": sum(t.revenue_actual for t in territories),
            "avg_coverage": sum(t.coverage_percent for t in territories) / len(territories) if territories else 0,
            "avg_attainment": sum(t.attainment for t in territories) / len(territories) if territories else 0
        }


# Demo
if __name__ == "__main__":
    agent = TerritoryManagerAgent()

    print("🗺️ Territory Manager Agent Demo\n")

    # Create territories
    t1 = agent.create_territory("HCM South", "South", "Rep A", 50000)
    t2 = agent.create_territory("HCM North", "South", "Rep B", 40000)
    t3 = agent.create_territory("Hanoi", "North", "Rep C", 35000)

    # Update coverage
    agent.update_coverage(t1.id, 45, 85.0)
    agent.update_coverage(t2.id, 38, 72.0)
    agent.update_coverage(t3.id, 30, 65.0)

    # Record revenue
    agent.record_revenue(t1.id, 42000)
    agent.record_revenue(t2.id, 35000)
    agent.record_revenue(t3.id, 28000)

    print("📍 Territories:")
    for t in agent.get_leaderboard():
        print(f"   {t.name}: {t.attainment:.0f}% ({t.coverage_percent}% coverage)")

    # Plan route
    route = agent.plan_route([
        {"customer": "Client A", "address": "123 Nguyen Hue", "priority": 2},
        {"customer": "Client B", "address": "456 Le Loi", "priority": 1},
        {"customer": "Client C", "address": "789 Dong Khoi", "priority": 3},
    ])

    print("\n🛣️ Route:")
    for i, stop in enumerate(route, 1):
        print(f"   {i}. {stop.customer} - {stop.address}")

    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Total Revenue: ${stats['total_revenue']:,.0f}")
    print(f"   Avg Coverage: {stats['avg_coverage']:.0f}%")
