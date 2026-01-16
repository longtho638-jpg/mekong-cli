"""
Creative Concept Agent - Campaign Concepts & Ideas
Manages creative concepts, briefs, and idea generation.
"""

from dataclasses import dataclass, field
from typing import List, Dict
from datetime import datetime
from enum import Enum
import random


class ConceptStatus(Enum):
    IDEATION = "ideation"
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    REJECTED = "rejected"


@dataclass
class CreativeBrief:
    """Creative brief"""
    objective: str
    target_audience: str
    key_message: str
    tone: str
    deliverables: List[str]


@dataclass
class Concept:
    """Creative concept"""
    id: str
    name: str
    campaign: str
    brief: CreativeBrief
    status: ConceptStatus = ConceptStatus.IDEATION
    ideas: List[str] = field(default_factory=list)
    score: float = 0
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class CreativeConceptAgent:
    """
    Creative Concept Agent - Ý tưởng Sáng tạo
    
    Responsibilities:
    - Campaign concepts
    - Creative briefs
    - Idea generation
    - Concept testing
    """

    def __init__(self):
        self.name = "Creative Concept"
        self.status = "ready"
        self.concepts: Dict[str, Concept] = {}

    def create_concept(
        self,
        name: str,
        campaign: str,
        objective: str,
        target_audience: str,
        key_message: str,
        tone: str,
        deliverables: List[str]
    ) -> Concept:
        """Create creative concept"""
        concept_id = f"concept_{random.randint(100,999)}"

        brief = CreativeBrief(
            objective=objective,
            target_audience=target_audience,
            key_message=key_message,
            tone=tone,
            deliverables=deliverables
        )

        concept = Concept(
            id=concept_id,
            name=name,
            campaign=campaign,
            brief=brief
        )

        self.concepts[concept_id] = concept
        return concept

    def add_idea(self, concept_id: str, idea: str) -> Concept:
        """Add idea to concept"""
        if concept_id not in self.concepts:
            raise ValueError(f"Concept not found: {concept_id}")

        self.concepts[concept_id].ideas.append(idea)
        return self.concepts[concept_id]

    def submit_for_review(self, concept_id: str) -> Concept:
        """Submit concept for review"""
        if concept_id not in self.concepts:
            raise ValueError(f"Concept not found: {concept_id}")

        self.concepts[concept_id].status = ConceptStatus.REVIEW
        return self.concepts[concept_id]

    def approve(self, concept_id: str, score: float = 0) -> Concept:
        """Approve concept"""
        if concept_id not in self.concepts:
            raise ValueError(f"Concept not found: {concept_id}")

        concept = self.concepts[concept_id]
        concept.status = ConceptStatus.APPROVED
        concept.score = score

        return concept

    def get_stats(self) -> Dict:
        """Get concept statistics"""
        concepts = list(self.concepts.values())
        approved = [c for c in concepts if c.status == ConceptStatus.APPROVED]

        return {
            "total_concepts": len(concepts),
            "approved": len(approved),
            "in_review": len([c for c in concepts if c.status == ConceptStatus.REVIEW]),
            "avg_score": sum(c.score for c in approved) / len(approved) if approved else 0,
            "total_ideas": sum(len(c.ideas) for c in concepts)
        }


# Demo
if __name__ == "__main__":
    agent = CreativeConceptAgent()

    print("💡 Creative Concept Agent Demo\n")

    # Create concept
    c1 = agent.create_concept(
        name="Summer Splash",
        campaign="Q3 Product Launch",
        objective="Generate buzz for new product",
        target_audience="Young professionals 25-35",
        key_message="Innovation meets lifestyle",
        tone="Fresh, Energetic, Bold",
        deliverables=["Video Ad", "Social Posts", "Email Banner"]
    )

    print(f"📋 Concept: {c1.name}")
    print(f"   Campaign: {c1.campaign}")
    print(f"   Objective: {c1.brief.objective}")
    print(f"   Target: {c1.brief.target_audience}")

    # Add ideas
    agent.add_idea(c1.id, "Hero video with water splash effect")
    agent.add_idea(c1.id, "Influencer collab series")
    agent.add_idea(c1.id, "Interactive social filter")

    print(f"\n💭 Ideas: {len(c1.ideas)}")
    for idea in c1.ideas:
        print(f"   • {idea}")

    # Approve
    agent.submit_for_review(c1.id)
    agent.approve(c1.id, score=85)

    print(f"\n✅ Status: {c1.status.value}")
    print(f"   Score: {c1.score}")
