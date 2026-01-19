"""
Sourcing Agent - Candidate Discovery & Talent Pools
Discovers and manages candidate talent pools.
"""

import random
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, List


class CandidateSource(Enum):
    LINKEDIN = "linkedin"
    GITHUB = "github"
    REFERRAL = "referral"
    JOB_BOARD = "job_board"
    DIRECT = "direct"
    EVENT = "event"


class TalentStatus(Enum):
    DISCOVERED = "discovered"
    QUALIFIED = "qualified"
    IN_POOL = "in_pool"
    CONTACTED = "contacted"
    CONVERTED = "converted"


@dataclass
class TalentProfile:
    """Sourced candidate profile"""

    id: str
    name: str
    email: str
    title: str
    skills: List[str]
    source: CandidateSource
    status: TalentStatus = TalentStatus.DISCOVERED
    match_score: int = 0  # 0-100
    linkedin_url: str = ""
    notes: str = ""
    sourced_at: datetime = None

    def __post_init__(self):
        if self.sourced_at is None:
            self.sourced_at = datetime.now()


class SourcingAgent:
    """
    Sourcing Agent - Tìm kiếm Ứng viên

    Responsibilities:
    - Discover candidates
    - Build talent pools
    - Match skills
    - Track sources
    """

    def __init__(self):
        self.name = "Sourcing"
        self.status = "ready"
        self.talents: Dict[str, TalentProfile] = {}

    def discover(
        self,
        name: str,
        email: str,
        title: str,
        skills: List[str],
        source: CandidateSource,
        match_score: int = 0,
    ) -> TalentProfile:
        """Discover new talent"""
        talent_id = f"talent_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"

        talent = TalentProfile(
            id=talent_id,
            name=name,
            email=email,
            title=title,
            skills=skills,
            source=source,
            match_score=match_score,
        )

        self.talents[talent_id] = talent
        return talent

    def qualify(self, talent_id: str, match_score: int) -> TalentProfile:
        """Qualify talent with match score"""
        if talent_id not in self.talents:
            raise ValueError(f"Talent not found: {talent_id}")

        talent = self.talents[talent_id]
        talent.status = TalentStatus.QUALIFIED
        talent.match_score = match_score

        return talent

    def add_to_pool(self, talent_id: str) -> TalentProfile:
        """Add to talent pool"""
        if talent_id not in self.talents:
            raise ValueError(f"Talent not found: {talent_id}")

        talent = self.talents[talent_id]
        talent.status = TalentStatus.IN_POOL

        return talent

    def search_by_skills(self, skills: List[str]) -> List[TalentProfile]:
        """Search talents by skills"""
        matching = []
        for talent in self.talents.values():
            if any(skill.lower() in [s.lower() for s in talent.skills] for skill in skills):
                matching.append(talent)
        return sorted(matching, key=lambda t: t.match_score, reverse=True)

    def get_by_source(self, source: CandidateSource) -> List[TalentProfile]:
        """Get talents by source"""
        return [t for t in self.talents.values() if t.source == source]

    def get_stats(self) -> Dict:
        """Get sourcing statistics"""
        talents = list(self.talents.values())

        source_breakdown = {
            s.value: len([t for t in talents if t.source == s]) for s in CandidateSource
        }

        return {
            "total_sourced": len(talents),
            "in_pool": len([t for t in talents if t.status == TalentStatus.IN_POOL]),
            "avg_match_score": sum(t.match_score for t in talents) / len(talents) if talents else 0,
            "top_source": max(source_breakdown, key=source_breakdown.get)
            if source_breakdown
            else None,
            "by_source": source_breakdown,
        }


# Demo
if __name__ == "__main__":
    agent = SourcingAgent()

    print("🔍 Sourcing Agent Demo\n")

    # Discover talents
    t1 = agent.discover(
        "Nguyen A",
        "a@email.com",
        "Senior Engineer",
        ["Python", "React", "AWS"],
        CandidateSource.LINKEDIN,
        92,
    )
    t2 = agent.discover(
        "Tran B", "b@email.com", "Backend Dev", ["Python", "Django"], CandidateSource.GITHUB, 85
    )
    t3 = agent.discover(
        "Le C", "c@email.com", "Full Stack", ["Node.js", "React"], CandidateSource.REFERRAL, 78
    )

    print(f"📋 Talent: {t1.name}")
    print(f"   Title: {t1.title}")
    print(f"   Skills: {', '.join(t1.skills)}")
    print(f"   Match: {t1.match_score}%")

    # Qualify and pool
    agent.qualify(t1.id, 95)
    agent.add_to_pool(t1.id)

    print(f"\n✅ Status: {t1.status.value}")

    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Total: {stats['total_sourced']}")
    print(f"   In Pool: {stats['in_pool']}")
    print(f"   Avg Match: {stats['avg_match_score']:.0f}%")
