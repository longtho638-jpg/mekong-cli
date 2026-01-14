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

import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ContentPillar(Enum):
    """5 Content Pillars for agency growth."""
    CODE_TO_CASHFLOW = "code_to_cashflow"
    SOLOPRENEUR_MINDSET = "solopreneur_mindset"
    LOCAL_AI = "local_ai"
    AUTOMATION_HACKS = "automation_hacks"
    AGENCY_LIFE = "agency_life"


class ContentFormat(Enum):
    """Standard social media formats."""
    TWITTER_THREAD = "Twitter Thread"
    CAROUSEL = "Carousel Post"
    VIDEO_SHORT = "Short Video"
    BLOG_POST = "Blog Post"
    LIVE_STREAM = "Live Stream"
    CASE_STUDY = "Case Study"


@dataclass
class ContentIdea:
    """A content idea entity."""
    pillar: ContentPillar
    title: str
    hook: str
    format: ContentFormat
    cta: str


class ContentGenerator:
    """
    AI Content Generator System.
    
    Generates tailored social media strategy based on Agency DNA.
    """
    
    def __init__(self, agency_name: str, niche: str, location: str, skill: str):
        self.agency_name = agency_name
        self.niche = niche
        self.location = location
        self.skill = skill
        
        logger.info(f"Content Generator initialized for {agency_name} ({niche})")
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict[ContentPillar, List[Dict]]:
        """Load content templates mapped to variables."""
        return {
            ContentPillar.CODE_TO_CASHFLOW: [
                {"title": f"From {self.skill} to $10K/month: My journey", "format": ContentFormat.TWITTER_THREAD, "hook": "The math behind my first profitable month..."},
                {"title": f"5 ways {self.niche} agencies waste money", "format": ContentFormat.CAROUSEL, "hook": "Stop burning cash on these legacy processes..."},
                {"title": f"Setup {self.niche} CRM for free in 15 mins", "format": ContentFormat.VIDEO_SHORT, "hook": "Legacy CRM is dead. Try this instead..."},
                {"title": f"How I automated {self.niche} reporting", "format": ContentFormat.BLOG_POST, "hook": "Save 10 hours per week with this simple stack..."},
                {"title": f"Live: Building a {self.niche} funnel", "format": ContentFormat.LIVE_STREAM, "hook": "Zero to lead gen in 60 minutes..."},
                {"title": f"Client result: 3x ROI in {self.niche}", "format": ContentFormat.CASE_STUDY, "hook": "Data-driven results for local businesses..."},
                {"title": f"The tech stack behind {self.agency_name}", "format": ContentFormat.CAROUSEL, "hook": "The lean stack that generates revenue..."},
                {"title": f"Why I chose {self.niche} over other niches", "format": ContentFormat.TWITTER_THREAD, "hook": "Finding your blue ocean in a crowded market..."},
                {"title": f"$500/day with {self.skill}: Blueprint", "format": ContentFormat.BLOG_POST, "hook": "The exact process I use for every client..."},
                {"title": f"Deploy {self.niche} agency in 15 minutes", "format": ContentFormat.VIDEO_SHORT, "hook": "Rapid deployment for the AI era..."},
            ],
            ContentPillar.SOLOPRENEUR_MINDSET: [
                {"title": "Why 1-person agency is the future", "format": ContentFormat.TWITTER_THREAD, "hook": "Leverage tools, not headcount..."},
                {"title": "I fired my team. Best decision ever.", "format": ContentFormat.CAROUSEL, "hook": "Focusing on profitability over ego..."},
                {"title": f"Morning routine at {self.agency_name}", "format": ContentFormat.VIDEO_SHORT, "hook": "Habits of a highly automated founder..."},
                {"title": "The loneliness of solo entrepreneurship", "format": ContentFormat.BLOG_POST, "hook": "The price of freedom nobody talks about..."},
                {"title": "AMA: Running agency from laptop", "format": ContentFormat.LIVE_STREAM, "hook": "Ask me about my workflow or niche..."},
                {"title": f"Year 1 at {self.agency_name}: Lessons", "format": ContentFormat.CASE_STUDY, "hook": "Avoid these 3 expensive mistakes..."},
                {"title": "Tool vs Team: My controversial take", "format": ContentFormat.CAROUSEL, "hook": "Why software is the best employee..."},
                {"title": "4-hour workweek as agency owner", "format": ContentFormat.TWITTER_THREAD, "hook": "Hyper-efficiency is the ultimate leverage..."},
                {"title": f"Building in {self.location}: Pros and cons", "format": ContentFormat.BLOG_POST, "hook": "Market dynamics in our local region..."},
                {"title": "My daily non-negotiables", "format": ContentFormat.VIDEO_SHORT, "hook": "3 tasks that move the needle every day..."},
            ],
            ContentPillar.LOCAL_AI: [
                {"title": f"AI that speaks {self.location} language", "format": ContentFormat.TWITTER_THREAD, "hook": "Why local nuances win over generic GPT..."},
                {"title": f"GPT vs local-tuned AI for {self.niche}", "format": ContentFormat.CAROUSEL, "hook": "The benchmark results are in..."},
                {"title": f"Training AI on {self.location} data", "format": ContentFormat.VIDEO_SHORT, "hook": "The secret to cultural relevance..."},
                {"title": f"Why {self.location} businesses need local AI", "format": ContentFormat.BLOG_POST, "hook": "Generic AI is failing your local clients..."},
                {"title": f"Live: Tuning AI for {self.niche}", "format": ContentFormat.LIVE_STREAM, "hook": "Watch me adjust the vibe in real-time..."},
                {"title": f"Case: AI content for {self.location}", "format": ContentFormat.CASE_STUDY, "hook": "Engagement stats: AI vs Human..."},
                {"title": "Vibe Tuning: What and why", "format": ContentFormat.CAROUSEL, "hook": "The hidden layer of prompt engineering..."},
                {"title": f"ChatGPT fails in {self.location}", "format": ContentFormat.TWITTER_THREAD, "hook": "Why prompt engineering is a local game..."},
                {"title": f"Building {self.niche} AI assistant", "format": ContentFormat.BLOG_POST, "hook": "Automating client support with local context..."},
                {"title": f"AI demo: {self.niche} content", "format": ContentFormat.VIDEO_SHORT, "hook": "Generating ads that sound like locals..."},
            ],
            ContentPillar.AUTOMATION_HACKS: [
                {"title": f"Automate {self.niche} in 10 minutes", "format": ContentFormat.TWITTER_THREAD, "hook": "No-code blueprints for scale..."},
                {"title": "5 automations that save me 20h/week", "format": ContentFormat.CAROUSEL, "hook": "The exact Make.com workflows I use..."},
                {"title": f"Auto-report for {self.niche} clients", "format": ContentFormat.VIDEO_SHORT, "hook": "Stop wasting time on PDF reports..."},
                {"title": "Zapier vs Make vs n8n: My verdict", "format": ContentFormat.BLOG_POST, "hook": "Choosing the right engine for your agency..."},
                {"title": "Build automation live!", "format": ContentFormat.LIVE_STREAM, "hook": "Taking your automation requests..."},
                {"title": f"0 to automated: {self.niche} case", "format": ContentFormat.CASE_STUDY, "hook": "Scaling without increasing overhead..."},
                {"title": "Automations under $10/month", "format": ContentFormat.CAROUSEL, "hook": "Small price, massive leverage..."},
                {"title": f"Auto-invoice for {self.agency_name}", "format": ContentFormat.TWITTER_THREAD, "hook": "Getting paid while you sleep..."},
                {"title": f"Client onboarding automation", "format": ContentFormat.BLOG_POST, "hook": "Perfect first impressions on autopilot..."},
                {"title": "My Telegram bot that runs agency", "format": ContentFormat.VIDEO_SHORT, "hook": "Command center in my pocket..."},
            ],
            ContentPillar.AGENCY_LIFE: [
                {"title": f"A day at {self.agency_name}", "format": ContentFormat.TWITTER_THREAD, "hook": "Behind the curtain of a solo agency..."},
                {"title": "Setup tour: My minimal workspace", "format": ContentFormat.CAROUSEL, "hook": "Tools for the digital nomad era..."},
                {"title": f"Working from {self.location} cafe", "format": ContentFormat.VIDEO_SHORT, "hook": "Location independence is the prize..."},
                {"title": "Funny AI fails with clients", "format": ContentFormat.BLOG_POST, "hook": "Learning from the hallucinations..."},
                {"title": "Friday Q&A with community", "format": ContentFormat.LIVE_STREAM, "hook": "Discussing {niche} and AI..."},
                {"title": f"Client win: {self.niche} success", "format": ContentFormat.CASE_STUDY, "hook": "Sharing the wins with the team..."},
                {"title": "Books that built my agency", "format": ContentFormat.CAROUSEL, "hook": "The mindset shift required for scale..."},
                {"title": f"1 year running {self.agency_name}", "format": ContentFormat.TWITTER_THREAD, "hook": "Raw numbers and honest truths..."},
                {"title": "Work-life balance as solo founder", "format": ContentFormat.BLOG_POST, "hook": "Avoiding burnout while scaling..."},
                {"title": "My favorite agency memes", "format": ContentFormat.VIDEO_SHORT, "hook": "Because if we don't laugh, we cry..."},
            ],
        }
    
    def generate_50_ideas(self) -> List[ContentIdea]:
        """Generate full set of 50 content ideas (10 per pillar)."""
        ideas = []
        for pillar, templates in self.templates.items():
            for t in templates:
                idea = ContentIdea(
                    pillar=pillar,
                    title=t["title"],
                    hook=t["hook"],
                    format=t["format"],
                    cta=f"Follow {self.agency_name} for more {self.niche} insights!"
                )
                ideas.append(idea)
        
        logger.info(f"Successfully generated {len(ideas)} ideas.")
        return ideas
    
    def format_calendar_view(self, ideas: List[ContentIdea]) -> str:
        """Render ASCII content calendar."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📅 CONTENT STRATEGY: {self.agency_name.upper()[:28]:<28} ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        for pillar in ContentPillar:
            pillar_ideas = [i for i in ideas if i.pillar == pillar]
            p_name = pillar.value.replace("_", " ").title()
            
            lines.append(f"║  📌 {p_name:<50}   ║")
            lines.append("║  " + "─" * 57 + "  ║")
            
            for j, idea in enumerate(pillar_ideas[:3], 1):
                title_short = (idea.title[:40] + "..") if len(idea.title) > 42 else idea.title
                lines.append(f"║    {j}. {title_short:<50} ║")
            
            lines.append(f"║    ... +{len(pillar_ideas) - 3} more ideas                                  ║")
            lines.append("║                                                           ║")
        
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📊 TOTAL: {len(ideas)} IDEAS READY FOR MULTI-CHANNEL POSTING    ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎨 Initializing AI Content Generator...")
    print("=" * 60)
    
    try:
        gen = ContentGenerator(
            agency_name="Saigon Digital Hub",
            niche="Real Estate",
            location="Vietnam",
            skill="Facebook Ads"
        )
        
        all_ideas = gen.generate_50_ideas()
        print("\n" + gen.format_calendar_view(all_ideas))
        
    except Exception as e:
        logger.error(f"Generation Error: {e}")
