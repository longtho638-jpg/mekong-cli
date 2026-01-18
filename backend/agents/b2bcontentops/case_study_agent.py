"""
Case Study Agent - Customer Success Stories
Manages case studies, ROI metrics, and success patterns.
"""

import random
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List


class CaseStudyStatus(Enum):
    DRAFT = "draft"
    CUSTOMER_REVIEW = "customer_review"
    APPROVED = "approved"
    PUBLISHED = "published"


@dataclass
class ROIMetric:
    """ROI metric"""

    name: str
    value: str
    improvement: str


@dataclass
class CaseStudy:
    """Customer case study"""

    id: str
    customer: str
    industry: str
    title: str
    challenge: str
    solution: str
    status: CaseStudyStatus = CaseStudyStatus.DRAFT
    roi_metrics: List[ROIMetric] = field(default_factory=list)
    quote: str = ""
    views: int = 0
    downloads: int = 0
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class CaseStudyAgent:
    """
    Case Study Agent - Câu chuyện Khách hàng

    Responsibilities:
    - Customer stories
    - ROI metrics
    - Success patterns
    - Industry segments
    """

    def __init__(self):
        self.name = "Case Study"
        self.status = "ready"
        self.case_studies: Dict[str, CaseStudy] = {}

    def create_case_study(
        self, customer: str, industry: str, title: str, challenge: str, solution: str
    ) -> CaseStudy:
        """Create case study"""
        cs_id = f"cs_{random.randint(100, 999)}"

        case_study = CaseStudy(
            id=cs_id,
            customer=customer,
            industry=industry,
            title=title,
            challenge=challenge,
            solution=solution,
        )

        self.case_studies[cs_id] = case_study
        return case_study

    def add_roi_metric(self, cs_id: str, name: str, value: str, improvement: str) -> CaseStudy:
        """Add ROI metric"""
        if cs_id not in self.case_studies:
            raise ValueError(f"Case study not found: {cs_id}")

        metric = ROIMetric(name=name, value=value, improvement=improvement)
        self.case_studies[cs_id].roi_metrics.append(metric)

        return self.case_studies[cs_id]

    def add_quote(self, cs_id: str, quote: str) -> CaseStudy:
        """Add customer quote"""
        if cs_id not in self.case_studies:
            raise ValueError(f"Case study not found: {cs_id}")

        self.case_studies[cs_id].quote = quote
        return self.case_studies[cs_id]

    def publish(self, cs_id: str) -> CaseStudy:
        """Publish case study"""
        if cs_id not in self.case_studies:
            raise ValueError(f"Case study not found: {cs_id}")

        self.case_studies[cs_id].status = CaseStudyStatus.PUBLISHED
        return self.case_studies[cs_id]

    def record_engagement(self, cs_id: str, views: int = 1, downloads: int = 0) -> CaseStudy:
        """Record engagement"""
        if cs_id not in self.case_studies:
            raise ValueError(f"Case study not found: {cs_id}")

        self.case_studies[cs_id].views += views
        self.case_studies[cs_id].downloads += downloads

        return self.case_studies[cs_id]

    def get_by_industry(self, industry: str) -> List[CaseStudy]:
        """Get case studies by industry"""
        return [cs for cs in self.case_studies.values() if cs.industry == industry]

    def get_stats(self) -> Dict:
        """Get case study statistics"""
        case_studies = list(self.case_studies.values())
        published = [cs for cs in case_studies if cs.status == CaseStudyStatus.PUBLISHED]

        return {
            "total_case_studies": len(case_studies),
            "published": len(published),
            "total_views": sum(cs.views for cs in case_studies),
            "total_downloads": sum(cs.downloads for cs in case_studies),
            "industries": len(set(cs.industry for cs in case_studies)),
        }


# Demo
if __name__ == "__main__":
    agent = CaseStudyAgent()

    print("📋 Case Study Agent Demo\n")

    # Create case study
    cs1 = agent.create_case_study(
        customer="Acme Corp",
        industry="Technology",
        title="How Acme Corp Increased Revenue 3x",
        challenge="Manual processes slowing growth",
        solution="Implemented automation platform",
    )

    print(f"📋 Case Study: {cs1.title}")
    print(f"   Customer: {cs1.customer}")
    print(f"   Industry: {cs1.industry}")

    # Add ROI metrics
    agent.add_roi_metric(cs1.id, "Revenue Growth", "300%", "+200%")
    agent.add_roi_metric(cs1.id, "Time Saved", "20hrs/week", "-80%")
    agent.add_roi_metric(cs1.id, "ROI", "450%", "in 6 months")

    # Add quote
    agent.add_quote(cs1.id, "This transformed our business completely.")

    print(f"\n📊 ROI Metrics: {len(cs1.roi_metrics)}")
    for m in cs1.roi_metrics:
        print(f"   {m.name}: {m.value} ({m.improvement})")

    # Publish and engage
    agent.publish(cs1.id)
    agent.record_engagement(cs1.id, views=150, downloads=25)

    print(f"\n👁️ Views: {cs1.views}")
    print(f"📥 Downloads: {cs1.downloads}")
