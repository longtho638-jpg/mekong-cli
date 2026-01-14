"""
📧 Email Sequence Builder - Automated Nurturing
=================================================

Build automated email sequences for client nurturing.
Convert leads to customers on autopilot!

Features:
- Pre-built sequences (Welcome, Onboarding, Re-engagement)
- Email templates with personalization
- Timing configuration
- A/B testing suggestions
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SequenceType(Enum):
    """Email sequence categories."""
    WELCOME = "welcome"
    ONBOARDING = "onboarding"
    NURTURE = "nurture"
    REENGAGEMENT = "reengagement"
    UPSELL = "upsell"


class EmailTrigger(Enum):
    """Event triggers for sequence steps."""
    SIGNUP = "signup"
    PURCHASE = "purchase"
    DAY_DELAY = "day_delay"
    BEHAVIOR = "behavior"


@dataclass
class Email:
    """An individual email within a sequence."""
    subject: str
    body: str
    delay_days: int
    trigger: EmailTrigger

    def __post_init__(self):
        if self.delay_days < 0:
            raise ValueError("Delay days cannot be negative")


@dataclass
class EmailSequence:
    """A collection of emails forming a strategic workflow."""
    name: str
    type: SequenceType
    description: str
    emails: List[Email]
    created_at: datetime = field(default_factory=datetime.now)


class EmailSequenceBuilder:
    """
    Email Sequence Builder System.
    
    Generates and manages automated email workflows for client nurturing and retention.
    """
    
    def __init__(self, agency_name: str, niche: str):
        self.agency_name = agency_name
        self.niche = niche
        self.sequences: Dict[SequenceType, EmailSequence] = {}
        
        logger.info(f"Email Sequence Builder initialized for {agency_name} ({niche})")
        self._create_default_sequences()
    
    def _create_default_sequences(self):
        """Pre-populate with standard agency nurturing sequences."""
        # 1. Welcome sequence
        self.sequences[SequenceType.WELCOME] = EmailSequence(
            name="Welcome Series",
            type=SequenceType.WELCOME,
            description="Introduction to the agency and value proposition",
            emails=[
                Email(
                    subject=f"Welcome to {self.agency_name}! 🎉",
                    body=f"Hi {{{{name}}}}! Thanks for joining our {self.niche} community.",
                    delay_days=0,
                    trigger=EmailTrigger.SIGNUP
                ),
                Email(
                    subject="Expert Strategy for you",
                    body="Sharing our secret sauce for growth...",
                    delay_days=2,
                    trigger=EmailTrigger.DAY_DELAY
                )
            ]
        )
        
        # 2. Onboarding sequence
        self.sequences[SequenceType.ONBOARDING] = EmailSequence(
            name="Client Onboarding",
            type=SequenceType.ONBOARDING,
            description="Guide new clients through the startup process",
            emails=[
                Email(
                    subject="🎉 Welcome aboard! What's next?",
                    body="Here's your onboarding roadmap...",
                    delay_days=0,
                    trigger=EmailTrigger.PURCHASE
                )
            ]
        )
        logger.debug("Default sequences created successfully.")
    
    def get_sequence(self, seq_type: SequenceType) -> Optional[EmailSequence]:
        """Fetch a specific sequence by its type."""
        return self.sequences.get(seq_type)
    
    def format_sequence_view(self, seq_type: SequenceType) -> str:
        """Render a text-based overview of a sequence."""
        sequence = self.get_sequence(seq_type)
        if not sequence: return "Sequence not found."
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📧 EMAIL SEQUENCE: {sequence.name.upper()[:32]:<32}  ║",
            f"║  {sequence.description[:53]:<53}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        for i, email in enumerate(sequence.emails, 1):
            delay_txt = "Immediate" if email.delay_days == 0 else f"Day {email.delay_days}"
            lines.append(f"║  {i}. {delay_txt:<15} │ Sub: {email.subject[:35]:<35} ║")
        
        lines.extend([
            "║                                                           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📊 {len(sequence.emails)} steps │ {self.agency_name[:30]:<30}  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📧 Initializing Sequence Builder...")
    print("=" * 60)
    
    try:
        builder = EmailSequenceBuilder("Saigon Digital Hub", "Real Estate")
        print("\n" + builder.format_sequence_view(SequenceType.WELCOME))
        
    except Exception as e:
        logger.error(f"Builder Error: {e}")
