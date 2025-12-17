"""
🎨 AI Content Generator - 50 Social Media Ideas
=================================================

Generate 50 social media content ideas from Agency DNA.
Based on MEKONG-CLI.txt 5 Content Pillars.

Pillars:
1. Code-to-Cashflow (Tech kiếm tiền)
2. Solopreneur Mindset (Tư duy làm chủ)
3. Local AI (AI địa phương)
4. Automation Hacks (Mẹo tự động)
5. Agency Life (Cuộc sống agency)
"""

from typing import Dict, List, Any
from dataclasses import dataclass
from enum import Enum


class ContentPillar(Enum):
    """5 Content Pillars from MEKONG-CLI.txt."""
    CODE_TO_CASHFLOW = "code_to_cashflow"
    SOLOPRENEUR_MINDSET = "solopreneur_mindset"
    LOCAL_AI = "local_ai"
    AUTOMATION_HACKS = "automation_hacks"
    AGENCY_LIFE = "agency_life"


class ContentFormat(Enum):
    """Content formats."""
    TWITTER_THREAD = "Twitter Thread"
    CAROUSEL = "Carousel Post"
    VIDEO_SHORT = "Short Video"
    BLOG_POST = "Blog Post"
    LIVE_STREAM = "Live Stream"
    CASE_STUDY = "Case Study"


@dataclass
class ContentIdea:
    """A content idea."""
    pillar: ContentPillar
    title: str
    hook: str
    format: ContentFormat
    cta: str


class ContentGenerator:
    """
    AI Content Generator.
    
    Generate 50 social media ideas from Agency DNA.
    """
    
    def __init__(self, agency_name: str, niche: str, location: str, skill: str):
        self.agency_name = agency_name
        self.niche = niche
        self.location = location
        self.skill = skill
        
        # Templates per pillar (10 each)
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict[ContentPillar, List[Dict]]:
        """Load content templates."""
        return {
            ContentPillar.CODE_TO_CASHFLOW: [
                {"title": f"From {self.skill} to $10K/month: My journey", "format": ContentFormat.TWITTER_THREAD, "hook": "I made ${amount} in my first month. Here's how..."},
                {"title": f"5 ways {self.niche} agencies waste money", "format": ContentFormat.CAROUSEL, "hook": "Stop burning cash on these..."},
                {"title": f"Setup {self.niche} CRM for free in 15 minutes", "format": ContentFormat.VIDEO_SHORT, "hook": "No more spreadsheets!"},
                {"title": f"How I automated {self.niche} reporting", "format": ContentFormat.BLOG_POST, "hook": "Save 10 hours per week"},
                {"title": f"Live: Building a {self.niche} funnel", "format": ContentFormat.LIVE_STREAM, "hook": "Watch me build in real-time"},
                {"title": f"Client result: 3x ROI in {self.niche}", "format": ContentFormat.CASE_STUDY, "hook": "From 0 to hero"},
                {"title": f"The tech stack behind {self.agency_name}", "format": ContentFormat.CAROUSEL, "hook": "Tools that make $$$"},
                {"title": f"Why I chose {self.niche} over other niches", "format": ContentFormat.TWITTER_THREAD, "hook": "The math that changed my life"},
                {"title": f"$500/day with {self.skill}: Blueprint", "format": ContentFormat.BLOG_POST, "hook": "Step by step process"},
                {"title": f"Deploy {self.niche} agency in 15 minutes", "format": ContentFormat.VIDEO_SHORT, "hook": "Speed run!"},
            ],
            ContentPillar.SOLOPRENEUR_MINDSET: [
                {"title": "Why 1-person agency is the future", "format": ContentFormat.TWITTER_THREAD, "hook": "Sam Altman predicted this..."},
                {"title": "I fired my team. Best decision ever.", "format": ContentFormat.CAROUSEL, "hook": "Controversial but true"},
                {"title": f"Morning routine at {self.agency_name}", "format": ContentFormat.VIDEO_SHORT, "hook": "4:30 AM start"},
                {"title": "The loneliness of solo entrepreneurship", "format": ContentFormat.BLOG_POST, "hook": "Let's talk about mental health"},
                {"title": "AMA: Running agency from laptop", "format": ContentFormat.LIVE_STREAM, "hook": "Ask me anything!"},
                {"title": f"Year 1 at {self.agency_name}: Lessons", "format": ContentFormat.CASE_STUDY, "hook": "What I learned"},
                {"title": "Tool vs Team: My controversial take", "format": ContentFormat.CAROUSEL, "hook": "Why I invest in tools"},
                {"title": "4-hour workweek as agency owner", "format": ContentFormat.TWITTER_THREAD, "hook": "Tim Ferriss was right"},
                {"title": f"Building in {self.location}: Pros and cons", "format": ContentFormat.BLOG_POST, "hook": "The honest truth"},
                {"title": "My daily non-negotiables", "format": ContentFormat.VIDEO_SHORT, "hook": "Habits that make millions"},
            ],
            ContentPillar.LOCAL_AI: [
                {"title": f"AI that speaks {self.location} language", "format": ContentFormat.TWITTER_THREAD, "hook": "Local vibe matters..."},
                {"title": f"GPT vs local-tuned AI for {self.niche}", "format": ContentFormat.CAROUSEL, "hook": "The comparison you needed"},
                {"title": f"Training AI on {self.location} data", "format": ContentFormat.VIDEO_SHORT, "hook": "Secret sauce revealed"},
                {"title": f"Why {self.location} businesses need local AI", "format": ContentFormat.BLOG_POST, "hook": "The cultural nuance"},
                {"title": f"Live: Tuning AI for {self.niche}", "format": ContentFormat.LIVE_STREAM, "hook": "Watch the magic"},
                {"title": f"Case: AI content for {self.location}", "format": ContentFormat.CASE_STUDY, "hook": "Before vs After"},
                {"title": "Vibe Tuning: What and why", "format": ContentFormat.CAROUSEL, "hook": "The secret weapon"},
                {"title": f"ChatGPT fails in {self.location}", "format": ContentFormat.TWITTER_THREAD, "hook": "Funny mistakes"},
                {"title": f"Building {self.niche} AI assistant", "format": ContentFormat.BLOG_POST, "hook": "Your 24/7 employee"},
                {"title": f"AI demo: {self.niche} content", "format": ContentFormat.VIDEO_SHORT, "hook": "Mind = blown"},
            ],
            ContentPillar.AUTOMATION_HACKS: [
                {"title": f"Automate {self.niche} in 10 minutes", "format": ContentFormat.TWITTER_THREAD, "hook": "Zero code needed"},
                {"title": "5 automations that save me 20h/week", "format": ContentFormat.CAROUSEL, "hook": "Copy these today"},
                {"title": f"Auto-report for {self.niche} clients", "format": ContentFormat.VIDEO_SHORT, "hook": "Set it and forget it"},
                {"title": "Zapier vs Make vs n8n: My verdict", "format": ContentFormat.BLOG_POST, "hook": "After 1000 zaps..."},
                {"title": "Build automation live!", "format": ContentFormat.LIVE_STREAM, "hook": "From idea to deployed"},
                {"title": f"0 to automated: {self.niche} case", "format": ContentFormat.CASE_STUDY, "hook": "The transformation"},
                {"title": "Automations under $10/month", "format": ContentFormat.CAROUSEL, "hook": "Budget-friendly power"},
                {"title": f"Auto-invoice for {self.agency_name}", "format": ContentFormat.TWITTER_THREAD, "hook": "Never chase payments"},
                {"title": f"Client onboarding automation", "format": ContentFormat.BLOG_POST, "hook": "First impression matters"},
                {"title": "My Telegram bot that runs agency", "format": ContentFormat.VIDEO_SHORT, "hook": "The ultimate hack"},
            ],
            ContentPillar.AGENCY_LIFE: [
                {"title": f"A day at {self.agency_name}", "format": ContentFormat.TWITTER_THREAD, "hook": "Behind the scenes"},
                {"title": "Setup tour: My minimal workspace", "format": ContentFormat.CAROUSEL, "hook": "Just laptop + coffee"},
                {"title": f"Working from {self.location} cafe", "format": ContentFormat.VIDEO_SHORT, "hook": "The digital nomad life"},
                {"title": "Funny AI fails with clients", "format": ContentFormat.BLOG_POST, "hook": "When AI goes wrong"},
                {"title": "Friday Q&A with community", "format": ContentFormat.LIVE_STREAM, "hook": "Let's chat!"},
                {"title": f"Client win: {self.niche} success", "format": ContentFormat.CASE_STUDY, "hook": "Celebration time"},
                {"title": "Books that built my agency", "format": ContentFormat.CAROUSEL, "hook": "Must reads"},
                {"title": f"1 year running {self.agency_name}", "format": ContentFormat.TWITTER_THREAD, "hook": "The honest review"},
                {"title": "Work-life balance as solo founder", "format": ContentFormat.BLOG_POST, "hook": "Is it possible?"},
                {"title": "My favorite agency memes", "format": ContentFormat.VIDEO_SHORT, "hook": "Laugh with me"},
            ],
        }
    
    def generate_50_ideas(self) -> List[ContentIdea]:
        """Generate 50 content ideas (10 per pillar)."""
        ideas = []
        
        for pillar, templates in self.templates.items():
            for template in templates:
                idea = ContentIdea(
                    pillar=pillar,
                    title=template["title"],
                    hook=template["hook"],
                    format=template["format"],
                    cta=f"Follow {self.agency_name} for more!"
                )
                ideas.append(idea)
        
        return ideas
    
    def format_content_calendar(self, ideas: List[ContentIdea]) -> str:
        """Format as content calendar."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📅 CONTENT CALENDAR: {self.agency_name.upper()[:30]:<30} ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        for i, pillar in enumerate(ContentPillar):
            pillar_ideas = [idea for idea in ideas if idea.pillar == pillar]
            pillar_name = pillar.value.replace("_", " ").title()
            
            lines.append(f"║                                                           ║")
            lines.append(f"║  📌 {pillar_name:<50}   ║")
            lines.append(f"║  ─────────────────────────────────────────────────────── ║")
            
            for j, idea in enumerate(pillar_ideas[:3], 1):
                title = idea.title[:40]
                lines.append(f"║    {j}. {title:<50} ║")
            
            lines.append(f"║    ... +{len(pillar_ideas) - 3} more ideas                                  ║")
        
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📊 TOTAL: {len(ideas)} IDEAS | 5 PILLARS | READY TO POST!       ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def export_to_markdown(self, ideas: List[ContentIdea]) -> str:
        """Export ideas as markdown."""
        lines = [
            f"# 📅 {self.agency_name} - 50 Content Ideas",
            "",
            f"> Generated by Agency OS | {self.niche} | {self.location}",
            "",
            "---",
            "",
        ]
        
        for pillar in ContentPillar:
            pillar_ideas = [idea for idea in ideas if idea.pillar == pillar]
            pillar_name = pillar.value.replace("_", " ").title()
            
            lines.append(f"## 📌 {pillar_name}")
            lines.append("")
            
            for i, idea in enumerate(pillar_ideas, 1):
                lines.append(f"### {i}. {idea.title}")
                lines.append(f"- **Format:** {idea.format.value}")
                lines.append(f"- **Hook:** {idea.hook}")
                lines.append(f"- **CTA:** {idea.cta}")
                lines.append("")
            
            lines.append("---")
            lines.append("")
        
        lines.append("🏯 *Generated by Agency OS - \"Không đánh mà thắng\"*")
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    generator = ContentGenerator(
        agency_name="Saigon Digital Hub",
        niche="Real Estate Marketing",
        location="Ho Chi Minh City",
        skill="Facebook Ads"
    )
    
    print("🎨 AI Content Generator")
    print("=" * 60)
    print()
    
    ideas = generator.generate_50_ideas()
    
    print(generator.format_content_calendar(ideas))
    print()
    print(f"✅ Generated {len(ideas)} content ideas!")
    print(f"   Agency: {generator.agency_name}")
    print(f"   Niche: {generator.niche}")
    print()
    
    # Show sample ideas
    print("📝 Sample Ideas:")
    for idea in ideas[:5]:
        print(f"   • {idea.title}")
        print(f"     ({idea.format.value}) - {idea.hook}")
        print()
