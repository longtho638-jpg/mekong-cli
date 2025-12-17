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

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import json


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
    created_at: datetime = field(default_factory=datetime.now)
    sections: Dict[str, str] = field(default_factory=dict)


class BusinessPlanGenerator:
    """
    Agentic Business Plan Generator.
    
    Ask simple questions → Generate full 13-section plan.
    """
    
    def __init__(self):
        self.questions = self._load_questions()
        self.templates = self._load_templates()
        self.current_answers: Dict[str, str] = {}
    
    def _load_questions(self) -> List[Dict[str, str]]:
        """Load the core questions."""
        return [
            {
                "id": "agency_name",
                "question": "🏯 Tên Agency của bạn là gì?",
                "example": "Saigon Digital Hub"
            },
            {
                "id": "location", 
                "question": "📍 Agency hoạt động ở đâu? (Thành phố/Quốc gia)",
                "example": "Ho Chi Minh City, Vietnam"
            },
            {
                "id": "niche",
                "question": "🎯 Bạn chuyên về lĩnh vực nào?",
                "example": "Real Estate Marketing"
            },
            {
                "id": "target_audience",
                "question": "👥 Khách hàng mục tiêu của bạn là ai?",
                "example": "Chủ dự án BĐS, Môi giới cá nhân"
            },
            {
                "id": "dream_revenue",
                "question": "💰 Mục tiêu doanh thu mỗi tháng?",
                "example": "$10,000/month"
            },
            {
                "id": "unique_skill",
                "question": "⚡ Kỹ năng/thế mạnh đặc biệt của bạn?",
                "example": "PPC Expert, Facebook Ads Master"
            },
            {
                "id": "local_vibe",
                "question": "🎤 Giọng điệu địa phương của agency?",
                "example": "Thân thiện miền Nam, chuyên nghiệp nhưng gần gũi"
            },
            {
                "id": "language",
                "question": "🌐 Ngôn ngữ chính?",
                "example": "Vietnamese + English"
            },
            {
                "id": "currency",
                "question": "💱 Đơn vị tiền tệ chính?",
                "example": "VND + USD"
            }
        ]
    
    def _load_templates(self) -> Dict[PlanSection, str]:
        """Load section templates."""
        return {
            PlanSection.CUSTOMER_PROFILE: """
# 1. CUSTOMER PROFILE (Hồ sơ Khách hàng)

## Target Audience
**Primary:** {target_audience}
**Secondary:** Các doanh nghiệp {niche} tại {location} cần chuyển đổi số

## Psychographic Segmentation
- **Builders:** Muốn xây dựng thương hiệu bền vững
- **Growth Seekers:** Cần tăng trưởng nhanh chóng

## Latent Pain Points
- "Tôi cần {niche} marketing nhưng không biết bắt đầu từ đâu"
- "Ngân sách hạn chế nhưng muốn kết quả cao"
- "Không có thời gian học và tự làm"

## Dream State
Trở thành thương hiệu {niche} hàng đầu tại {location}, tăng gấp 3x doanh thu trong 6 tháng.
""",
            PlanSection.BUSINESS_PLAN: """
# 2. BUSINESS PLAN (Kế hoạch Kinh doanh)

## Mission Statement
"{agency_name} - Bình dân hóa {niche} marketing cho doanh nghiệp {location}"

## Vision Statement  
Trở thành Agency {niche} số 1 tại {location} vào năm 2026.

## Value Proposition
"{unique_skill} + AI Automation = Kết quả vượt trội, chi phí tối ưu"

## Business Model
- **Retainer Fee:** Gói dịch vụ hàng tháng
- **Project Fee:** Dự án theo yêu cầu
- **Performance Fee:** Thu phí theo kết quả

## Business Goals
- Doanh thu: {dream_revenue}
- Khách hàng: 20+ accounts active
- Team: 1 founder + AI workforce
""",
            PlanSection.BRAND_IDENTITY: """
# 4. BRAND IDENTITY (Nhận diện Thương hiệu)

## Brand Name
{agency_name}

## Tagline
"Your {niche} Partner in {location}"

## Unique Selling Proposition
Agency {niche} duy nhất kết hợp {unique_skill} với AI Automation.

## Voice and Tone
{local_vibe}

## Colors
- Primary: Professional Blue
- Secondary: {location} inspired accent
- Dark mode ready

## Brand Promise
"Chúng tôi không chỉ làm marketing, chúng tôi xây dựng đế chế cho bạn."
""",
            PlanSection.MARKETING_MESSAGE: """
# 5. MARKETING MESSAGE (Thông điệp Tiếp thị)

## Unique Selling Proposition
1. **{unique_skill}:** Chuyên gia hàng đầu về {niche}
2. **AI-Powered:** Tự động hóa 80% công việc lặp lại
3. **Local First:** Hiểu rõ thị trường {location}

## Benefits
✅ Tăng doanh thu gấp 3x
✅ Giảm 70% thời gian marketing
✅ ROI đo lường được

## Story Telling
"Từ một freelancer đam mê {niche}, tôi đã xây dựng {agency_name} để giúp hàng trăm doanh nghiệp tại {location} bứt phá..."

## Call to Action
"Đặt lịch tư vấn MIỄN PHÍ 30 phút ngay hôm nay!"

## Irresistible Offer
"Audit miễn phí + Chiến lược {niche} marketing 90 ngày. Trị giá $500, MIỄN PHÍ cho 10 khách hàng đầu tiên."
""",
            PlanSection.SALES_STRATEGY: """
# 9. SALES STRATEGY (Chiến lược Bán hàng)

## Sales Channels
- **Inbound:** Content marketing, SEO, Social media
- **Outbound:** LinkedIn outreach, Cold email
- **Referral:** Chương trình giới thiệu 10% hoa hồng

## Pricing Structure
- Basic: 5,000,000 VND/tháng
- Pro: 15,000,000 VND/tháng  
- Enterprise: Custom pricing

## Go to Market Strategy
1. **Phase 1 (Month 1-2):** 10 khách hàng beta miễn phí
2. **Phase 2 (Month 3-4):** Ra mắt chính thức, 20 khách
3. **Phase 3 (Month 5+):** Scale lên {dream_revenue}

## Sales Process
Discovery Call → Proposal → Contract → Onboarding → Delivery
""",
            PlanSection.GROWTH_PLAN: """
# 11. GROWTH PLAN (Kế hoạch Tăng trưởng)

## Fastest Path to First 10 Customers
1. Đăng bài value trên Facebook Groups {niche}
2. Offer free audit cho 20 doanh nghiệp {location}
3. Convert 50% thành khách hàng trả phí

## Viral Loop
- Referral: 10% hoa hồng trọn đời
- Case Study: Chia sẻ thành công của khách hàng
- Template: Tặng free template, thu email

## Scaling Strategy
- **Month 1-3:** 10 clients, $3K MRR
- **Month 4-6:** 20 clients, $7K MRR  
- **Month 7-12:** 40 clients, {dream_revenue}

## AI Workforce
- Content Writer AI
- SEO Analyst AI
- Social Manager AI
- Client Report AI
"""
        }
    
    def get_questions(self) -> List[Dict[str, str]]:
        """Get all questions to ask agency."""
        return self.questions
    
    def answer_question(self, question_id: str, answer: str):
        """Record an answer."""
        self.current_answers[question_id] = answer
    
    def is_complete(self) -> bool:
        """Check if all questions answered."""
        required = [q["id"] for q in self.questions]
        return all(q in self.current_answers for q in required)
    
    def generate_dna(self) -> AgencyDNA:
        """Generate the Agency DNA from answers."""
        if not self.is_complete():
            raise ValueError("Not all questions answered")
        
        dna = AgencyDNA(
            agency_name=self.current_answers.get("agency_name", ""),
            location=self.current_answers.get("location", ""),
            niche=self.current_answers.get("niche", ""),
            target_audience=self.current_answers.get("target_audience", ""),
            dream_revenue=self.current_answers.get("dream_revenue", ""),
            unique_skill=self.current_answers.get("unique_skill", ""),
            local_vibe=self.current_answers.get("local_vibe", ""),
            language=self.current_answers.get("language", ""),
            currency=self.current_answers.get("currency", "")
        )
        
        # Generate each section
        for section, template in self.templates.items():
            dna.sections[section.value] = template.format(**self.current_answers)
        
        return dna
    
    def format_full_plan(self, dna: AgencyDNA) -> str:
        """Format the complete business plan."""
        lines = [
            "═" * 60,
            f"📂 BUSINESS PLAN: {dna.agency_name.upper()}",
            f"Generated: {dna.created_at.strftime('%Y-%m-%d')} | Powered by Agency OS",
            "═" * 60,
            "",
        ]
        
        for section_name, content in dna.sections.items():
            lines.append(content)
            lines.append("")
            lines.append("_" * 60)
            lines.append("")
        
        lines.extend([
            "",
            "🏯 \"Không đánh mà thắng\" - Win Without Fighting",
            "",
            f"Generated by Agency OS for {dna.agency_name}",
            f"Location: {dna.location} | Niche: {dna.niche}",
            "",
            "═" * 60,
        ])
        
        return "\n".join(lines)
    
    def demo_full_flow(self):
        """Demo the full Q&A flow with sample answers."""
        # Sample answers
        demo_answers = {
            "agency_name": "Saigon Digital Hub",
            "location": "Ho Chi Minh City, Vietnam",
            "niche": "Real Estate Marketing",
            "target_audience": "Chủ dự án BĐS, Môi giới cá nhân",
            "dream_revenue": "$10,000/month",
            "unique_skill": "Facebook Ads + Content Marketing",
            "local_vibe": "Thân thiện miền Nam, chuyên nghiệp",
            "language": "Vietnamese + English",
            "currency": "VND + USD"
        }
        
        # Answer all questions
        for q_id, answer in demo_answers.items():
            self.answer_question(q_id, answer)
        
        # Generate DNA
        dna = self.generate_dna()
        
        return dna, self.format_full_plan(dna)


# Example usage
if __name__ == "__main__":
    generator = BusinessPlanGenerator()
    
    print("📋 Agentic Business Plan Generator")
    print("=" * 60)
    print()
    
    # Show questions
    print("❓ Questions to Ask Agency:")
    print("-" * 40)
    for q in generator.get_questions():
        print(f"   {q['question']}")
        print(f"      Example: {q['example']}")
        print()
    
    # Demo full flow
    print("=" * 60)
    print("🎯 DEMO: Generating Full Business Plan...")
    print("=" * 60)
    print()
    
    dna, plan = generator.demo_full_flow()
    
    # Show abbreviated plan
    print(f"✅ Generated DNA for: {dna.agency_name}")
    print(f"   Location: {dna.location}")
    print(f"   Niche: {dna.niche}")
    print(f"   Target: {dna.target_audience}")
    print(f"   Goal: {dna.dream_revenue}")
    print()
    print(f"📄 Full Plan: {len(plan)} characters, {len(dna.sections)} sections")
    print()
    
    # Show first section
    first_section = list(dna.sections.values())[0]
    print("📖 Section 1 Preview:")
    print(first_section[:500])
