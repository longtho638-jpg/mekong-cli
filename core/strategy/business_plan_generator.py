"""
📋 Agentic Business Plan Generator
===================================

Agency chỉ cần trả lời câu hỏi → AI viết full Business Plan.
Đây là DNA đầu tiên cho toàn bộ Đế chế 1 người vận hành.

Architecture: 13 Sections (based on MEKONG-CLI.txt)
1. Customer Profile
2. Business Plan
3. Market Research
4. Brand Identity
5. Marketing Message
6. Marketing Plan
7. Marketing Content
8. Social Media (50 ideas)
9. Sales Strategy
10. PR Plan
11. Growth Plan
12. Raising Capital
13. Founder Wisdom
"""

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class PlanSection(Enum):
    """13 Business Plan sections."""

    CUSTOMER_PROFILE = "customer_profile"
    BUSINESS_PLAN = "business_plan"
    MARKET_RESEARCH = "market_research"
    BRAND_IDENTITY = "brand_identity"
    MARKETING_MESSAGE = "marketing_message"
    MARKETING_PLAN = "marketing_plan"
    MARKETING_CONTENT = "marketing_content"
    SOCIAL_MEDIA = "social_media"
    SALES_STRATEGY = "sales_strategy"
    PR_PLAN = "pr_plan"
    GROWTH_PLAN = "growth_plan"
    RAISING_CAPITAL = "raising_capital"
    FOUNDER_WISDOM = "founder_wisdom"


@dataclass
class AgencyDNA:
    """The Agency DNA - core identity from Q&A."""

    agency_name: str
    location: str
    niche: str
    target_audience: str
    dream_revenue: str
    unique_skill: str
    local_vibe: str
    language: str
    currency: str
    id: str = field(default_factory=lambda: f"DNA-{uuid.uuid4().hex[:6].upper()}")
    created_at: datetime = field(default_factory=datetime.now)
    sections: Dict[str, str] = field(default_factory=dict)


class BusinessPlanGenerator:
    """
    Agentic Business Plan Generator.

    Transforms owner answers into a comprehensive 13-section business strategy.
    """

    def __init__(self):
        self.questions = self._load_questions()
        self.templates = self._load_templates()
        self.current_answers: Dict[str, str] = {}
        logger.info("Business Plan Generator initialized")

    def _load_questions(self) -> List[Dict[str, str]]:
        """Load core questions for the setup flow."""
        return [
            {
                "id": "agency_name",
                "question": "🏯 Tên Agency của bạn là gì?",
                "example": "Saigon Digital Hub",
            },
            {
                "id": "location",
                "question": "📍 Agency hoạt động ở đâu?",
                "example": "Ho Chi Minh City, Vietnam",
            },
            {
                "id": "niche",
                "question": "🎯 Bạn chuyên về lĩnh vực nào?",
                "example": "Real Estate Marketing",
            },
            {
                "id": "target_audience",
                "question": "👥 Khách hàng mục tiêu là ai?",
                "example": "Chủ dự án BĐS",
            },
            {
                "id": "dream_revenue",
                "question": "💰 Mục tiêu doanh thu mỗi tháng?",
                "example": "$10,000/month",
            },
            {
                "id": "unique_skill",
                "question": "⚡ Kỹ năng/thế mạnh đặc biệt?",
                "example": "Ads Optimization",
            },
            {
                "id": "local_vibe",
                "question": "🎤 Giọng điệu (Voice & Tone)?",
                "example": "Chuyên nghiệp & Gần gũi",
            },
            {"id": "language", "question": "🌐 Ngôn ngữ chính?", "example": "Tiếng Việt"},
            {"id": "currency", "question": "💱 Đơn vị tiền tệ chính?", "example": "VND"},
        ]

    def _load_templates(self) -> Dict[PlanSection, str]:
        """Load templates for all 13 sections."""
        # Note: In a real AI app, these would be prompts for LLM.
        # Here we use formatted strings as pre-built smart templates.
        t = {
            PlanSection.CUSTOMER_PROFILE: "# 1. CUSTOMER PROFILE\nTarget: {target_audience}\nNiche: {niche}\nLocation: {location}",
            PlanSection.BUSINESS_PLAN: "# 2. BUSINESS PLAN\nMission: {agency_name} for {niche}\nGoal: {dream_revenue}",
            PlanSection.MARKET_RESEARCH: "# 3. MARKET RESEARCH\nMarket: {location} {niche} landscape.",
            PlanSection.BRAND_IDENTITY: "# 4. BRAND IDENTITY\nName: {agency_name}\nVibe: {local_vibe}",
            PlanSection.MARKETING_MESSAGE: "# 5. MARKETING MESSAGE\nUSP: {unique_skill}",
            PlanSection.MARKETING_PLAN: "# 6. MARKETING PLAN\nFocus on {target_audience} in {location}.",
            PlanSection.MARKETING_CONTENT: "# 7. MARKETING CONTENT\nCase studies on {niche}.",
            PlanSection.SOCIAL_MEDIA: "# 8. SOCIAL MEDIA\n50 Ideas for {agency_name}.",
            PlanSection.SALES_STRATEGY: "# 9. SALES STRATEGY\nGoal: {dream_revenue} through {unique_skill}.",
            PlanSection.PR_PLAN: "# 10. PR PLAN\nThought leadership in {niche}.",
            PlanSection.GROWTH_PLAN: "# 11. GROWTH PLAN\nScale {agency_name} globally.",
            PlanSection.RAISING_CAPITAL: "# 12. RAISING CAPITAL\nValuation based on {dream_revenue} ARR.",
            PlanSection.FOUNDER_WISDOM: "# 13. FOUNDER WISDOM\nStrategy: Win without fighting.",
        }
        return t

    def answer_question(self, question_id: str, answer: str):
        """Record an owner's answer with basic validation."""
        if not answer:
            logger.warning(f"Empty answer received for {question_id}")
        self.current_answers[question_id] = answer
        logger.debug(f"Question {question_id} answered")

    def is_complete(self) -> bool:
        """Check if all mandatory questions are answered."""
        required = [q["id"] for q in self.questions]
        return all(q in self.current_answers for q in required)

    def generate_dna(self) -> AgencyDNA:
        """Process answers and generate the final Agency DNA."""
        if not self.is_complete():
            logger.error("Attempted to generate DNA without all answers")
            raise ValueError("Incomplete answers")

        dna = AgencyDNA(
            agency_name=self.current_answers.get("agency_name", ""),
            location=self.current_answers.get("location", ""),
            niche=self.current_answers.get("niche", ""),
            target_audience=self.current_answers.get("target_audience", ""),
            dream_revenue=self.current_answers.get("dream_revenue", ""),
            unique_skill=self.current_answers.get("unique_skill", ""),
            local_vibe=self.current_answers.get("local_vibe", ""),
            language=self.current_answers.get("language", ""),
            currency=self.current_answers.get("currency", ""),
        )

        # Build all 13 sections using the templates
        for section, template in self.templates.items():
            try:
                dna.sections[section.value] = template.format(**self.current_answers)
            except KeyError as e:
                logger.error(f"Template mapping error in {section.value}: {e}")
                dna.sections[section.value] = f"Missing data for section: {e}"

        logger.info(f"DNA generated successfully for {dna.agency_name}")
        return dna

    def format_full_plan(self, dna: AgencyDNA) -> str:
        """Render the complete 13-section business plan as a string."""
        border = "═" * 60
        lines = [
            border,
            f"📂 BUSINESS PLAN: {dna.agency_name.upper()}",
            f"DNA ID: {dna.id} | Date: {dna.created_at.strftime('%Y-%m-%d')}",
            border,
            "",
        ]

        # Add sections in order
        for section in PlanSection:
            content = dna.sections.get(section.value, "Section not generated.")
            lines.append(content)
            lines.append("-" * 40)
            lines.append("")

        lines.extend(
            [
                '🏯 "Không đánh mà thắng" - Win Without Fighting',
                f"Location: {dna.location} | Powered by Agency OS",
                border,
            ]
        )

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📋 Initializing Business Plan Generator...")
    print("=" * 60)

    try:
        gen = BusinessPlanGenerator()

        # Simulated Answers
        answers = {
            "agency_name": "Saigon Digital Hub",
            "location": "HCM, Vietnam",
            "niche": "Real Estate",
            "target_audience": "Project Owners",
            "dream_revenue": "$10,000/mo",
            "unique_skill": "Facebook Ads",
            "local_vibe": "Professional",
            "language": "Vietnamese",
            "currency": "VND",
        }

        for q_id, val in answers.items():
            gen.answer_question(q_id, val)

        if gen.is_complete():
            dna = gen.generate_dna()
            plan = gen.format_full_plan(dna)

            print(f"\n✅ DNA Generated for {dna.agency_name}")
            print(f"📄 Sections completed: {len(dna.sections)}/13")
            print("\nPreview of Section 1:")
            print(dna.sections["customer_profile"])

    except Exception as e:
        logger.error(f"Process Error: {e}")
