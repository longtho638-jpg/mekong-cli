"""
Templates and Questions for Business Plan Generation.
"""
from .models import PlanSection

QUESTIONS = [
    {"id": "agency_name", "question": "🏯 Tên Agency của bạn là gì?", "example": "Saigon Digital Hub"},
    {"id": "location", "question": "📍 Agency hoạt động ở đâu?", "example": "Ho Chi Minh City, Vietnam"},
    {"id": "niche", "question": "🎯 Bạn chuyên về lĩnh vực nào?", "example": "Real Estate Marketing"},
    {"id": "target_audience", "question": "👥 Khách hàng mục tiêu là ai?", "example": "Chủ dự án BĐS"},
    {"id": "dream_revenue", "question": "💰 Mục tiêu doanh thu mỗi tháng?", "example": "$10,000/month"},
    {"id": "unique_skill", "question": "⚡ Kỹ năng/thế mạnh đặc biệt?", "example": "Ads Optimization"},
    {"id": "local_vibe", "question": "🎤 Giọng điệu (Voice & Tone)?", "example": "Chuyên nghiệp & Gần gũi"},
    {"id": "language", "question": "🌐 Ngôn ngữ chính?", "example": "Tiếng Việt"},
    {"id": "currency", "question": "💒 Đơn vị tiền tệ chính?", "example": "VND"},
]

SECTION_TEMPLATES = {
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
