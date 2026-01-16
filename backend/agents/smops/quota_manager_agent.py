"""
Quota Manager Agent - Team Quota Tracking
Manages quotas, attainment, and team performance.
"""

from dataclasses import dataclass, field
from typing import List, Dict
from enum import Enum


class Period(Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


@dataclass
class SalesRep:
    """Sales representative"""
    id: str
    name: str
    territory: str
    quota: float
    closed: float = 0.0
    
    @property
    def attainment(self) -> float:
        return (self.closed / self.quota * 100) if self.quota > 0 else 0
    
    @property
    def remaining(self) -> float:
        return max(0, self.quota - self.closed)


@dataclass
class TeamQuota:
    """Team quota summary"""
    period: Period
    total_quota: float
    total_closed: float
    reps: List[SalesRep] = field(default_factory=list)
    
    @property
    def attainment(self) -> float:
        return (self.total_closed / self.total_quota * 100) if self.total_quota > 0 else 0


class QuotaManagerAgent:
    """
    Quota Manager Agent - Quản lý Chỉ tiêu
    
    Responsibilities:
    - Assign quotas
    - Track attainment
    - Team performance
    - Territory management
    """
    
    def __init__(self):
        self.name = "Quota Manager"
        self.status = "ready"
        self.reps: Dict[str, SalesRep] = {}
        self.period = Period.QUARTERLY
        
    def add_rep(
        self,
        rep_id: str,
        name: str,
        territory: str,
        quota: float
    ) -> SalesRep:
        """Add sales rep with quota"""
        rep = SalesRep(
            id=rep_id,
            name=name,
            territory=territory,
            quota=quota
        )
        self.reps[rep_id] = rep
        return rep
    
    def record_closed(self, rep_id: str, amount: float) -> SalesRep:
        """Record closed deal for rep"""
        if rep_id not in self.reps:
            raise ValueError(f"Rep not found: {rep_id}")
            
        rep = self.reps[rep_id]
        rep.closed += amount
        return rep
    
    def update_quota(self, rep_id: str, new_quota: float) -> SalesRep:
        """Update rep quota"""
        if rep_id not in self.reps:
            raise ValueError(f"Rep not found: {rep_id}")
            
        rep = self.reps[rep_id]
        rep.quota = new_quota
        return rep
    
    def get_leaderboard(self) -> List[SalesRep]:
        """Get reps sorted by attainment"""
        return sorted(self.reps.values(), key=lambda r: r.attainment, reverse=True)
    
    def get_by_territory(self, territory: str) -> List[SalesRep]:
        """Get reps by territory"""
        return [r for r in self.reps.values() if r.territory == territory]
    
    def get_team_summary(self) -> TeamQuota:
        """Get team quota summary"""
        reps = list(self.reps.values())
        
        return TeamQuota(
            period=self.period,
            total_quota=sum(r.quota for r in reps),
            total_closed=sum(r.closed for r in reps),
            reps=reps
        )
    
    def get_stats(self) -> Dict:
        """Get quota statistics"""
        reps = list(self.reps.values())
        summary = self.get_team_summary()
        
        on_track = len([r for r in reps if r.attainment >= 80])
        
        return {
            "total_reps": len(reps),
            "team_quota": summary.total_quota,
            "team_closed": summary.total_closed,
            "team_attainment": f"{summary.attainment:.0f}%",
            "on_track": on_track,
            "at_risk": len(reps) - on_track,
            "top_performer": self.get_leaderboard()[0].name if reps else None
        }


# Demo
if __name__ == "__main__":
    agent = QuotaManagerAgent()
    
    print("📊 Quota Manager Agent Demo\n")
    
    # Add reps
    agent.add_rep("rep_1", "Nguyễn A", "South", 50000)
    agent.add_rep("rep_2", "Trần B", "North", 40000)
    agent.add_rep("rep_3", "Lê C", "Central", 45000)
    
    # Record closed deals
    agent.record_closed("rep_1", 42000)
    agent.record_closed("rep_2", 28000)
    agent.record_closed("rep_3", 38000)
    
    print("🏆 Leaderboard:")
    for i, rep in enumerate(agent.get_leaderboard(), 1):
        print(f"   {i}. {rep.name}: {rep.attainment:.0f}% (${rep.closed:,.0f}/${rep.quota:,.0f})")
    
    # Team summary
    summary = agent.get_team_summary()
    print("\n📈 Team Summary:")
    print(f"   Quota: ${summary.total_quota:,.0f}")
    print(f"   Closed: ${summary.total_closed:,.0f}")
    print(f"   Attainment: {summary.attainment:.0f}%")
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   On Track: {stats['on_track']}")
    print(f"   Top Performer: {stats['top_performer']}")
