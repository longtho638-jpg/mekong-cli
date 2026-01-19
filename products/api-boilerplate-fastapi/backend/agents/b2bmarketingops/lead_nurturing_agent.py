"""
Lead Nurturing Agent - Nurture Sequences & Scoring
Manages lead nurturing and handoff to sales.
"""

from dataclasses import dataclass, field
from typing import List, Dict
from datetime import datetime
from enum import Enum
import random


class NurtureStatus(Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CONVERTED = "converted"


@dataclass
class NurtureStep:
    """Nurture sequence step"""
    id: str
    name: str
    delay_days: int
    sent: int = 0
    opened: int = 0
    clicked: int = 0


@dataclass
class NurtureSequence:
    """Lead nurture sequence"""
    id: str
    name: str
    target_segment: str
    steps: List[NurtureStep] = field(default_factory=list)
    enrolled: int = 0
    completed: int = 0
    converted: int = 0
    status: NurtureStatus = NurtureStatus.ACTIVE

    @property
    def completion_rate(self) -> float:
        return (self.completed / self.enrolled * 100) if self.enrolled > 0 else 0

    @property
    def conversion_rate(self) -> float:
        return (self.converted / self.enrolled * 100) if self.enrolled > 0 else 0


class LeadNurturingAgent:
    """
    Lead Nurturing Agent - Nuôi dưỡng Leads
    
    Responsibilities:
    - Nurture sequences
    - Lead scoring
    - Segmentation
    - Handoff to sales
    """

    def __init__(self):
        self.name = "Lead Nurturing"
        self.status = "ready"
        self.sequences: Dict[str, NurtureSequence] = {}
        self.lead_scores: Dict[str, int] = {}

    def create_sequence(
        self,
        name: str,
        target_segment: str
    ) -> NurtureSequence:
        """Create nurture sequence"""
        seq_id = f"nurture_{random.randint(100,999)}"

        sequence = NurtureSequence(
            id=seq_id,
            name=name,
            target_segment=target_segment
        )

        self.sequences[seq_id] = sequence
        return sequence

    def add_step(
        self,
        sequence_id: str,
        name: str,
        delay_days: int
    ) -> NurtureSequence:
        """Add step to nurture sequence"""
        if sequence_id not in self.sequences:
            raise ValueError(f"Sequence not found: {sequence_id}")

        step = NurtureStep(
            id=f"step_{len(self.sequences[sequence_id].steps) + 1}",
            name=name,
            delay_days=delay_days
        )

        self.sequences[sequence_id].steps.append(step)
        return self.sequences[sequence_id]

    def enroll_lead(self, sequence_id: str, lead_id: str) -> NurtureSequence:
        """Enroll lead in sequence"""
        if sequence_id not in self.sequences:
            raise ValueError(f"Sequence not found: {sequence_id}")

        self.sequences[sequence_id].enrolled += 1
        self.lead_scores[lead_id] = 0

        return self.sequences[sequence_id]

    def score_lead(self, lead_id: str, points: int) -> int:
        """Update lead score"""
        self.lead_scores[lead_id] = self.lead_scores.get(lead_id, 0) + points
        return self.lead_scores[lead_id]

    def simulate_performance(self, sequence_id: str) -> NurtureSequence:
        """Simulate sequence performance"""
        if sequence_id not in self.sequences:
            raise ValueError(f"Sequence not found: {sequence_id}")

        sequence = self.sequences[sequence_id]
        enrolled = sequence.enrolled

        for step in sequence.steps:
            step.sent = enrolled
            step.opened = int(enrolled * random.uniform(0.25, 0.45))
            step.clicked = int(step.opened * random.uniform(0.10, 0.25))
            enrolled = int(enrolled * random.uniform(0.85, 0.95))

        sequence.completed = int(sequence.enrolled * random.uniform(0.4, 0.7))
        sequence.converted = int(sequence.completed * random.uniform(0.1, 0.3))

        return sequence

    def handoff_to_sales(self, lead_id: str) -> Dict:
        """Hand off lead to sales"""
        score = self.lead_scores.get(lead_id, 0)

        return {
            "lead_id": lead_id,
            "score": score,
            "ready_for_sales": score >= 50,
            "handoff_date": datetime.now().isoformat()
        }

    def get_stats(self) -> Dict:
        """Get nurturing statistics"""
        sequences = list(self.sequences.values())
        active = [s for s in sequences if s.status == NurtureStatus.ACTIVE]

        return {
            "total_sequences": len(sequences),
            "active": len(active),
            "total_enrolled": sum(s.enrolled for s in sequences),
            "total_converted": sum(s.converted for s in sequences),
            "avg_conversion": sum(s.conversion_rate for s in sequences) / len(sequences) if sequences else 0
        }


# Demo
if __name__ == "__main__":
    agent = LeadNurturingAgent()

    print("📧 Lead Nurturing Agent Demo\n")

    # Create sequence
    s1 = agent.create_sequence("MQL Welcome Series", "New MQLs")

    # Add steps
    agent.add_step(s1.id, "Welcome Email", 0)
    agent.add_step(s1.id, "Value Prop", 3)
    agent.add_step(s1.id, "Case Study", 7)
    agent.add_step(s1.id, "Demo Invite", 14)

    print(f"📋 Sequence: {s1.name}")
    print(f"   Segment: {s1.target_segment}")
    print(f"   Steps: {len(s1.steps)}")

    # Enroll leads
    for i in range(100):
        agent.enroll_lead(s1.id, f"lead_{i}")
        agent.score_lead(f"lead_{i}", random.randint(10, 60))

    # Simulate
    agent.simulate_performance(s1.id)

    print("\n📊 Performance:")
    print(f"   Enrolled: {s1.enrolled}")
    print(f"   Completed: {s1.completed} ({s1.completion_rate:.0f}%)")
    print(f"   Converted: {s1.converted} ({s1.conversion_rate:.0f}%)")

    # Handoff
    handoff = agent.handoff_to_sales("lead_0")
    print(f"\n🤝 Handoff: Ready = {handoff['ready_for_sales']}")
