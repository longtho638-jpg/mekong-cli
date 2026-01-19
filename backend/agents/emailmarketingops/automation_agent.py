"""
Automation Agent - Email Automation & Drip Campaigns
Manages automated email sequences and triggers.
"""

import random
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List


class TriggerType(Enum):
    SIGNUP = "signup"
    PURCHASE = "purchase"
    ABANDONED_CART = "abandoned_cart"
    INACTIVITY = "inactivity"
    CUSTOM = "custom"


class AutomationStatus(Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


@dataclass
class EmailStep:
    """Automation email step"""

    id: str
    subject: str
    delay_hours: int
    sent: int = 0
    opened: int = 0
    clicked: int = 0


@dataclass
class Automation:
    """Email automation/drip campaign"""

    id: str
    name: str
    trigger: TriggerType
    status: AutomationStatus = AutomationStatus.DRAFT
    steps: List[EmailStep] = field(default_factory=list)
    enrolled: int = 0
    completed: int = 0

    @property
    def completion_rate(self) -> float:
        return (self.completed / self.enrolled * 100) if self.enrolled > 0 else 0

    @property
    def total_sent(self) -> int:
        return sum(s.sent for s in self.steps)


class AutomationAgent:
    """
    Automation Agent - Tự động hóa Email

    Responsibilities:
    - Drip campaigns
    - Trigger workflows
    - Segmentation
    - Journey mapping
    """

    def __init__(self):
        self.name = "Automation"
        self.status = "ready"
        self.automations: Dict[str, Automation] = {}

    def create_automation(self, name: str, trigger: TriggerType) -> Automation:
        """Create automation"""
        auto_id = f"auto_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"

        automation = Automation(id=auto_id, name=name, trigger=trigger)

        self.automations[auto_id] = automation
        return automation

    def add_step(self, automation_id: str, subject: str, delay_hours: int) -> Automation:
        """Add email step to automation"""
        if automation_id not in self.automations:
            raise ValueError(f"Automation not found: {automation_id}")

        automation = self.automations[automation_id]

        step = EmailStep(
            id=f"step_{len(automation.steps) + 1}", subject=subject, delay_hours=delay_hours
        )

        automation.steps.append(step)
        return automation

    def activate(self, automation_id: str) -> Automation:
        """Activate automation"""
        if automation_id not in self.automations:
            raise ValueError(f"Automation not found: {automation_id}")

        automation = self.automations[automation_id]
        automation.status = AutomationStatus.ACTIVE

        return automation

    def simulate_enrollment(self, automation_id: str, count: int) -> Automation:
        """Simulate enrollments for demo"""
        if automation_id not in self.automations:
            raise ValueError(f"Automation not found: {automation_id}")

        automation = self.automations[automation_id]
        automation.enrolled = count
        automation.completed = int(count * random.uniform(0.4, 0.7))

        for step in automation.steps:
            step.sent = int(count * random.uniform(0.85, 0.95))
            step.opened = int(step.sent * random.uniform(0.25, 0.45))
            step.clicked = int(step.opened * random.uniform(0.15, 0.30))

        return automation

    def get_stats(self) -> Dict:
        """Get automation statistics"""
        automations = list(self.automations.values())
        active = [a for a in automations if a.status == AutomationStatus.ACTIVE]

        return {
            "total_automations": len(automations),
            "active": len(active),
            "total_enrolled": sum(a.enrolled for a in automations),
            "total_completed": sum(a.completed for a in automations),
            "total_emails_sent": sum(a.total_sent for a in automations),
            "avg_completion": sum(a.completion_rate for a in active) / len(active) if active else 0,
        }


# Demo
if __name__ == "__main__":
    agent = AutomationAgent()

    print("🔄 Automation Agent Demo\n")

    # Create automation
    a1 = agent.create_automation("Welcome Series", TriggerType.SIGNUP)

    # Add steps
    agent.add_step(a1.id, "Welcome to our platform!", 0)
    agent.add_step(a1.id, "Getting started guide", 24)
    agent.add_step(a1.id, "Your first week tips", 72)
    agent.add_step(a1.id, "How can we help?", 168)

    print(f"📋 Automation: {a1.name}")
    print(f"   Trigger: {a1.trigger.value}")
    print(f"   Steps: {len(a1.steps)}")

    # Activate and simulate
    agent.activate(a1.id)
    agent.simulate_enrollment(a1.id, 500)

    print("\n📊 Performance:")
    print(f"   Enrolled: {a1.enrolled}")
    print(f"   Completed: {a1.completed} ({a1.completion_rate:.0f}%)")
    print(f"   Total Sent: {a1.total_sent}")

    print("\n📧 Steps:")
    for step in a1.steps:
        print(f"   {step.subject[:30]}... → Sent: {step.sent}, Opens: {step.opened}")
