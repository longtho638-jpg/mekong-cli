"""
Research Agent - Market Studies & Trend Analysis
Manages market research studies, surveys, and insights.
"""

from dataclasses import dataclass, field
from typing import List, Dict
from datetime import datetime
from enum import Enum
import random


class StudyType(Enum):
    SURVEY = "survey"
    FOCUS_GROUP = "focus_group"
    INTERVIEWS = "interviews"
    MARKET_SIZING = "market_sizing"
    TREND_ANALYSIS = "trend_analysis"


class StudyStatus(Enum):
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    ANALYZING = "analyzing"
    COMPLETED = "completed"


@dataclass
class Insight:
    """Research insight"""
    id: str
    title: str
    description: str
    impact: str  # high, medium, low
    source: str


@dataclass
class Study:
    """Market research study"""
    id: str
    title: str
    study_type: StudyType
    status: StudyStatus = StudyStatus.PLANNING
    respondents: int = 0
    target_respondents: int = 100
    insights: List[Insight] = field(default_factory=list)
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

    @property
    def completion_rate(self) -> float:
        return (self.respondents / self.target_respondents * 100) if self.target_respondents > 0 else 0


class ResearchAgent:
    """
    Research Agent - Nghiên cứu Thị trường
    
    Responsibilities:
    - Market studies
    - Survey management
    - Trend analysis
    - Industry reports
    """

    def __init__(self):
        self.name = "Research"
        self.status = "ready"
        self.studies: Dict[str, Study] = {}

    def create_study(
        self,
        title: str,
        study_type: StudyType,
        target_respondents: int = 100
    ) -> Study:
        """Create research study"""
        study_id = f"study_{int(datetime.now().timestamp())}_{random.randint(100,999)}"

        study = Study(
            id=study_id,
            title=title,
            study_type=study_type,
            target_respondents=target_respondents
        )

        self.studies[study_id] = study
        return study

    def start_study(self, study_id: str) -> Study:
        """Start study"""
        if study_id not in self.studies:
            raise ValueError(f"Study not found: {study_id}")

        study = self.studies[study_id]
        study.status = StudyStatus.IN_PROGRESS

        return study

    def record_response(self, study_id: str, count: int = 1) -> Study:
        """Record study responses"""
        if study_id not in self.studies:
            raise ValueError(f"Study not found: {study_id}")

        study = self.studies[study_id]
        study.respondents += count

        if study.respondents >= study.target_respondents:
            study.status = StudyStatus.ANALYZING

        return study

    def add_insight(self, study_id: str, title: str, description: str, impact: str) -> Study:
        """Add insight from study"""
        if study_id not in self.studies:
            raise ValueError(f"Study not found: {study_id}")

        study = self.studies[study_id]

        insight = Insight(
            id=f"insight_{random.randint(100,999)}",
            title=title,
            description=description,
            impact=impact,
            source=study.title
        )

        study.insights.append(insight)
        return study

    def complete_study(self, study_id: str) -> Study:
        """Complete study"""
        if study_id not in self.studies:
            raise ValueError(f"Study not found: {study_id}")

        study = self.studies[study_id]
        study.status = StudyStatus.COMPLETED

        return study

    def get_stats(self) -> Dict:
        """Get research statistics"""
        studies = list(self.studies.values())
        completed = [s for s in studies if s.status == StudyStatus.COMPLETED]

        return {
            "total_studies": len(studies),
            "completed": len(completed),
            "total_respondents": sum(s.respondents for s in studies),
            "total_insights": sum(len(s.insights) for s in studies)
        }


# Demo
if __name__ == "__main__":
    agent = ResearchAgent()

    print("🔍 Research Agent Demo\n")

    # Create study
    s1 = agent.create_study("Customer Satisfaction Survey", StudyType.SURVEY, 500)
    s2 = agent.create_study("Market Size Analysis", StudyType.MARKET_SIZING, 50)

    print(f"📋 Study: {s1.title}")
    print(f"   Type: {s1.study_type.value}")
    print(f"   Target: {s1.target_respondents}")

    # Progress
    agent.start_study(s1.id)
    agent.record_response(s1.id, 450)
    agent.record_response(s1.id, 50)

    print(f"\n✅ Responses: {s1.respondents}/{s1.target_respondents}")
    print(f"   Completion: {s1.completion_rate:.0f}%")

    # Insights
    agent.add_insight(s1.id, "High NPS Score", "Customers rate 8.5/10", "high")
    agent.add_insight(s1.id, "Feature Request", "40% want mobile app", "medium")

    agent.complete_study(s1.id)

    print(f"\n💡 Insights: {len(s1.insights)}")
