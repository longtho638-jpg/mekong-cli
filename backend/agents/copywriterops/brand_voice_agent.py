"""
Brand Voice Agent - Brand Guidelines & Tone Consistency
Manages brand voice, tone templates, and style checks.
"""

import random
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List


class ToneType(Enum):
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    BOLD = "bold"
    PLAYFUL = "playful"
    AUTHORITATIVE = "authoritative"
    EMPATHETIC = "empathetic"


class VoiceScore(Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    NEEDS_WORK = "needs_work"
    OFF_BRAND = "off_brand"


@dataclass
class BrandGuideline:
    """Brand voice guideline"""

    id: str
    category: str
    rule: str
    examples: List[str] = field(default_factory=list)
    avoid: List[str] = field(default_factory=list)


@dataclass
class VoiceTemplate:
    """Pre-approved voice template"""

    id: str
    name: str
    tone: ToneType
    template: str
    use_case: str


@dataclass
class VoiceCheck:
    """Voice consistency check result"""

    id: str
    copy_text: str
    score: VoiceScore
    feedback: List[str] = field(default_factory=list)
    checked_at: datetime = None

    def __post_init__(self):
        if self.checked_at is None:
            self.checked_at = datetime.now()


class BrandVoiceAgent:
    """
    Brand Voice Agent - Quản lý Thương hiệu

    Responsibilities:
    - Brand guidelines
    - Tone consistency
    - Voice templates
    - Style checks
    """

    def __init__(self):
        self.name = "Brand Voice"
        self.status = "ready"
        self.guidelines: Dict[str, BrandGuideline] = {}
        self.templates: Dict[str, VoiceTemplate] = {}
        self.checks: Dict[str, VoiceCheck] = {}
        self.brand_tones: List[ToneType] = [ToneType.PROFESSIONAL, ToneType.FRIENDLY]

    def add_guideline(
        self, category: str, rule: str, examples: List[str] = None, avoid: List[str] = None
    ) -> BrandGuideline:
        """Add brand guideline"""
        guide_id = f"guide_{random.randint(100, 999)}"

        guideline = BrandGuideline(
            id=guide_id, category=category, rule=rule, examples=examples or [], avoid=avoid or []
        )

        self.guidelines[guide_id] = guideline
        return guideline

    def add_template(
        self, name: str, tone: ToneType, template: str, use_case: str
    ) -> VoiceTemplate:
        """Add voice template"""
        template_id = f"tpl_{random.randint(100, 999)}"

        voice_template = VoiceTemplate(
            id=template_id, name=name, tone=tone, template=template, use_case=use_case
        )

        self.templates[template_id] = voice_template
        return voice_template

    def check_voice(self, copy_text: str) -> VoiceCheck:
        """Check copy against brand voice"""
        check_id = f"check_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"

        # Simulate voice check
        feedback = []
        score = VoiceScore.GOOD

        # Simple checks
        if len(copy_text) < 10:
            feedback.append("Copy is too short")
            score = VoiceScore.NEEDS_WORK
        if copy_text.isupper():
            feedback.append("Avoid all caps - doesn't match brand tone")
            score = VoiceScore.NEEDS_WORK
        if "!" in copy_text and copy_text.count("!") > 1:
            feedback.append("Too many exclamation marks")
            score = VoiceScore.NEEDS_WORK

        if not feedback:
            feedback.append("Copy aligns with brand voice guidelines")
            score = VoiceScore.GOOD

        check = VoiceCheck(id=check_id, copy_text=copy_text, score=score, feedback=feedback)

        self.checks[check_id] = check
        return check

    def get_stats(self) -> Dict:
        """Get brand voice statistics"""
        checks = list(self.checks.values())

        return {
            "total_guidelines": len(self.guidelines),
            "total_templates": len(self.templates),
            "total_checks": len(checks),
            "excellent": len([c for c in checks if c.score == VoiceScore.EXCELLENT]),
            "good": len([c for c in checks if c.score == VoiceScore.GOOD]),
            "needs_work": len([c for c in checks if c.score == VoiceScore.NEEDS_WORK]),
        }


# Demo
if __name__ == "__main__":
    agent = BrandVoiceAgent()

    print("🎯 Brand Voice Agent Demo\n")

    # Add guidelines
    g1 = agent.add_guideline(
        "Tone",
        "Be professional but approachable",
        examples=["We're here to help you succeed"],
        avoid=["URGENT!", "Act NOW!!!"],
    )

    print(f"📋 Guideline: {g1.category}")
    print(f"   Rule: {g1.rule}")

    # Add template
    t1 = agent.add_template(
        "Welcome Email",
        ToneType.FRIENDLY,
        "Welcome to {company}! We're excited to have you...",
        "New user onboarding",
    )

    print(f"\n📝 Template: {t1.name}")
    print(f"   Tone: {t1.tone.value}")

    # Voice check
    c1 = agent.check_voice("Transform your business with our solution")
    c2 = agent.check_voice("BUY NOW!!! LIMITED OFFER!!!")

    print(f"\n✅ Check 1: {c1.score.value}")
    print(f"   {c1.feedback[0]}")

    print(f"\n⚠️ Check 2: {c2.score.value}")
    for f in c2.feedback:
        print(f"   - {f}")
