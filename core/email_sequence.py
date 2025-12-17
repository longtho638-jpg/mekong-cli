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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum


class SequenceType(Enum):
    """Email sequence type."""
    WELCOME = "welcome"
    ONBOARDING = "onboarding"
    NURTURE = "nurture"
    REENGAGEMENT = "reengagement"
    UPSELL = "upsell"


class EmailTrigger(Enum):
    """Email trigger type."""
    SIGNUP = "signup"
    PURCHASE = "purchase"
    DAY_DELAY = "day_delay"
    BEHAVIOR = "behavior"


@dataclass
class Email:
    """An email in a sequence."""
    subject: str
    body: str
    delay_days: int
    trigger: EmailTrigger


@dataclass
class EmailSequence:
    """A complete email sequence."""
    name: str
    type: SequenceType
    description: str
    emails: List[Email]
    created_at: datetime = field(default_factory=datetime.now)


class EmailSequenceBuilder:
    """
    Email Sequence Builder.
    
    Create automated email sequences for client nurturing.
    """
    
    def __init__(self, agency_name: str, niche: str):
        self.agency_name = agency_name
        self.niche = niche
        self.sequences: Dict[SequenceType, EmailSequence] = {}
        
        # Pre-build sequences
        self._create_default_sequences()
    
    def _create_default_sequences(self):
        """Create default email sequences."""
        
        # Welcome sequence
        self.sequences[SequenceType.WELCOME] = EmailSequence(
            name="Welcome Series",
            type=SequenceType.WELCOME,
            description="Welcome new subscribers and introduce your agency",
            emails=[
                Email(
                    subject=f"Welcome to {self.agency_name}! 🎉",
                    body=f"""Hi {{{{name}}}}!

Welcome to {self.agency_name}! We're thrilled to have you.

Here's what you can expect from us:
✅ Expert {self.niche} insights
✅ Actionable tips you can use today
✅ Exclusive offers and resources

As a thank you, here's a free resource: [Link]

Best,
{self.agency_name} Team 🏯""",
                    delay_days=0,
                    trigger=EmailTrigger.SIGNUP
                ),
                Email(
                    subject=f"Why we started {self.agency_name}",
                    body=f"""Hi {{{{name}}}}!

I wanted to share why we started {self.agency_name}...

[Your story here]

We believe every business deserves access to expert {self.niche} help.

What's your biggest challenge right now?
Reply and let me know - I read every email!

Best,
Founder, {self.agency_name}""",
                    delay_days=2,
                    trigger=EmailTrigger.DAY_DELAY
                ),
                Email(
                    subject="Your free strategy session awaits 🎁",
                    body=f"""Hi {{{{name}}}}!

I'd love to offer you a FREE 30-minute {self.niche} strategy session.

In this call, we'll:
✅ Audit your current strategy
✅ Identify quick wins
✅ Create an action plan

No strings attached - just pure value.

👉 Book your call: [Link]

Best,
{self.agency_name} Team""",
                    delay_days=5,
                    trigger=EmailTrigger.DAY_DELAY
                )
            ]
        )
        
        # Onboarding sequence
        self.sequences[SequenceType.ONBOARDING] = EmailSequence(
            name="Client Onboarding",
            type=SequenceType.ONBOARDING,
            description="Guide new clients through the onboarding process",
            emails=[
                Email(
                    subject="🎉 Welcome aboard! Here's what happens next",
                    body=f"""Hi {{{{name}}}}!

Welcome to {self.agency_name}! We're excited to work with you.

📋 NEXT STEPS:
1. You'll receive an onboarding questionnaire (coming next)
2. We'll schedule your kickoff call
3. Work begins within 48 hours!

Questions? Reply to this email anytime.

Best,
{self.agency_name} Team 🏯""",
                    delay_days=0,
                    trigger=EmailTrigger.PURCHASE
                ),
                Email(
                    subject="📋 Quick questionnaire (5 mins)",
                    body=f"""Hi {{{{name}}}}!

To hit the ground running, please complete this quick questionnaire:

👉 [Questionnaire Link]

This helps us understand your:
• Business goals
• Target audience
• Current challenges

It only takes 5 minutes!

Best,
{self.agency_name} Team""",
                    delay_days=1,
                    trigger=EmailTrigger.DAY_DELAY
                ),
                Email(
                    subject="🚀 Work has begun!",
                    body=f"""Hi {{{{name}}}}!

Great news - work on your project has officially begun!

📊 WHAT'S HAPPENING:
• Research & analysis: In progress
• Strategy development: Starting soon
• First deliverables: Within 7 days

You'll receive your first progress report on [Date].

Excited to show you what we've got!

Best,
{self.agency_name} Team 🏯""",
                    delay_days=3,
                    trigger=EmailTrigger.DAY_DELAY
                )
            ]
        )
        
        # Re-engagement sequence
        self.sequences[SequenceType.REENGAGEMENT] = EmailSequence(
            name="Re-engagement Campaign",
            type=SequenceType.REENGAGEMENT,
            description="Win back inactive subscribers",
            emails=[
                Email(
                    subject="We miss you! 💔",
                    body=f"""Hi {{{{name}}}}!

We noticed you haven't been around lately...

Is everything okay? We'd love to hear from you.

Here's what you've missed:
✅ [Recent update 1]
✅ [Recent update 2]
✅ [Recent update 3]

Best,
{self.agency_name} Team""",
                    delay_days=0,
                    trigger=EmailTrigger.BEHAVIOR
                ),
                Email(
                    subject="Special offer just for you 🎁",
                    body=f"""Hi {{{{name}}}}!

We want you back! Here's a special offer:

🎁 20% OFF your next project with us

Use code: COMEBACK20

Valid for 7 days only.

Best,
{self.agency_name} Team""",
                    delay_days=3,
                    trigger=EmailTrigger.DAY_DELAY
                )
            ]
        )
    
    def get_sequence(self, type: SequenceType) -> EmailSequence:
        """Get a sequence by type."""
        return self.sequences.get(type)
    
    def format_sequence(self, sequence: EmailSequence) -> str:
        """Format sequence for display."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📧 EMAIL SEQUENCE: {sequence.name.upper()[:32]:<32}  ║",
            f"║  {sequence.description[:53]:<53}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        for i, email in enumerate(sequence.emails, 1):
            delay_text = "Immediately" if email.delay_days == 0 else f"Day {email.delay_days}"
            lines.append(f"║                                                           ║")
            lines.append(f"║  📨 Email {i}: {delay_text:<42}  ║")
            lines.append(f"║  Subject: {email.subject[:45]:<45}  ║")
            
            # First line of body
            body_preview = email.body.split('\n')[0][:45]
            lines.append(f"║  Preview: {body_preview:<45}  ║")
        
        lines.extend([
            "║                                                           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📊 Total Emails: {len(sequence.emails)} | {self.agency_name:<30}  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def export_sequence(self, sequence: EmailSequence) -> str:
        """Export sequence as markdown."""
        lines = [
            f"# 📧 {sequence.name}",
            "",
            f"> {sequence.description}",
            "",
            "---",
            "",
        ]
        
        for i, email in enumerate(sequence.emails, 1):
            delay_text = "Immediately" if email.delay_days == 0 else f"Day {email.delay_days}"
            lines.extend([
                f"## Email {i}: {delay_text}",
                "",
                f"**Subject:** {email.subject}",
                "",
                "```",
                email.body,
                "```",
                "",
                "---",
                "",
            ])
        
        lines.append(f"*Generated by {self.agency_name}*")
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    builder = EmailSequenceBuilder(
        agency_name="Saigon Digital Hub",
        niche="Real Estate Marketing"
    )
    
    print("📧 Email Sequence Builder")
    print("=" * 60)
    print()
    
    # Show welcome sequence
    welcome = builder.get_sequence(SequenceType.WELCOME)
    print(builder.format_sequence(welcome))
    print()
    
    # Show onboarding sequence
    onboarding = builder.get_sequence(SequenceType.ONBOARDING)
    print(builder.format_sequence(onboarding))
    print()
    
    print(f"✅ {len(builder.sequences)} sequences ready to use!")
