"""
Pillar-specific content templates.
"""
from typing import Dict, List

from ..entities import ContentFormat, ContentPillar


def get_default_templates(agency_name: str, niche: str, location: str, skill: str) -> Dict[ContentPillar, List[Dict]]:
    """Get the default content templates with injected variables."""
    return {
        ContentPillar.CODE_TO_CASHFLOW: [
            {"title": f"From {skill} to $10K/month: My journey", "format": ContentFormat.TWITTER_THREAD, "hook": "The math behind my first profitable month..."},
            {"title": f"5 ways {niche} agencies waste money", "format": ContentFormat.CAROUSEL, "hook": "Stop burning cash on these legacy processes..."},
            {"title": f"Setup {niche} CRM for free in 15 mins", "format": ContentFormat.VIDEO_SHORT, "hook": "Legacy CRM is dead. Try this instead..."},
            {"title": f"How I automated {niche} reporting", "format": ContentFormat.BLOG_POST, "hook": "Save 10 hours per week with this simple stack..."},
            {"title": f"Live: Building a {niche} funnel", "format": ContentFormat.LIVE_STREAM, "hook": "Zero to lead gen in 60 minutes..."},
            {"title": f"Client result: 3x ROI in {niche}", "format": ContentFormat.CASE_STUDY, "hook": "Data-driven results for local businesses..."},
            {"title": f"The tech stack behind {agency_name}", "format": ContentFormat.CAROUSEL, "hook": "The lean stack that generates revenue..."},
            {"title": f"Why I chose {niche} over other niches", "format": ContentFormat.TWITTER_THREAD, "hook": "Finding your blue ocean in a crowded market..."},
            {"title": f"$500/day with {skill}: Blueprint", "format": ContentFormat.BLOG_POST, "hook": "The exact process I use for every client..."},
            {"title": f"Deploy {niche} agency in 15 minutes", "format": ContentFormat.VIDEO_SHORT, "hook": "Rapid deployment for the AI era..."},
        ],
        ContentPillar.SOLOPRENEUR_MINDSET: [
            {"title": "Why 1-person agency is the future", "format": ContentFormat.TWITTER_THREAD, "hook": "Leverage tools, not headcount..."},
            {"title": "I fired my team. Best decision ever.", "format": ContentFormat.CAROUSEL, "hook": "Focusing on profitability over ego..."},
            {"title": f"Morning routine at {agency_name}", "format": ContentFormat.VIDEO_SHORT, "hook": "Habits of a highly automated founder..."},
            {"title": "The loneliness of solo entrepreneurship", "format": ContentFormat.BLOG_POST, "hook": "The price of freedom nobody talks about..."},
            {"title": "AMA: Running agency from laptop", "format": ContentFormat.LIVE_STREAM, "hook": "Ask me about my workflow or niche..."},
            {"title": f"Year 1 at {agency_name}: Lessons", "format": ContentFormat.CASE_STUDY, "hook": "Avoid these 3 expensive mistakes..."},
            {"title": "Tool vs Team: My controversial take", "format": ContentFormat.CAROUSEL, "hook": "Why software is the best employee..."},
            {"title": "4-hour workweek as agency owner", "format": ContentFormat.TWITTER_THREAD, "hook": "Hyper-efficiency is the ultimate leverage..."},
            {"title": f"Building in {location}: Pros and cons", "format": ContentFormat.BLOG_POST, "hook": "Market dynamics in our local region..."},
            {"title": "My daily non-negotiables", "format": ContentFormat.VIDEO_SHORT, "hook": "3 tasks that move the needle every day..."},
        ],
        ContentPillar.LOCAL_AI: [
            {"title": f"AI that speaks {location} language", "format": ContentFormat.TWITTER_THREAD, "hook": "Why local nuances win over generic GPT..."},
            {"title": f"GPT vs local-tuned AI for {niche}", "format": ContentFormat.CAROUSEL, "hook": "The benchmark results are in..."},
            {"title": f"Training AI on {location} data", "format": ContentFormat.VIDEO_SHORT, "hook": "The secret to cultural relevance..."},
            {"title": f"Why {location} businesses need local AI", "format": ContentFormat.BLOG_POST, "hook": "Generic AI is failing your local clients..."},
            {"title": f"Live: Tuning AI for {niche}", "format": ContentFormat.LIVE_STREAM, "hook": "Watch me adjust the vibe in real-time..."},
            {"title": f"Case: AI content for {location}", "format": ContentFormat.CASE_STUDY, "hook": "Engagement stats: AI vs Human..."},
            {"title": "Vibe Tuning: What and why", "format": ContentFormat.CAROUSEL, "hook": "The hidden layer of prompt engineering..."},
            {"title": f"ChatGPT fails in {location}", "format": ContentFormat.TWITTER_THREAD, "hook": "Why prompt engineering is a local game..."},
            {"title": f"Building {niche} AI assistant", "format": ContentFormat.BLOG_POST, "hook": "Automating client support with local context..."},
            {"title": f"AI demo: {niche} content", "format": ContentFormat.VIDEO_SHORT, "hook": "Generating ads that sound like locals..."},
        ],
        ContentPillar.AUTOMATION_HACKS: [
            {"title": f"Automate {niche} in 10 minutes", "format": ContentFormat.TWITTER_THREAD, "hook": "No-code blueprints for scale..."},
            {"title": "5 automations that save me 20h/week", "format": ContentFormat.CAROUSEL, "hook": "The exact Make.com workflows I use..."},
            {"title": f"Auto-report for {niche} clients", "format": ContentFormat.VIDEO_SHORT, "hook": "Stop wasting time on PDF reports..."},
            {"title": "Zapier vs Make vs n8n: My verdict", "format": ContentFormat.BLOG_POST, "hook": "Choosing the right engine for your agency..."},
            {"title": "Build automation live!", "format": ContentFormat.LIVE_STREAM, "hook": "Taking your automation requests..."},
            {"title": f"0 to automated: {niche} case", "format": ContentFormat.CASE_STUDY, "hook": "Scaling without increasing overhead..."},
            {"title": "Automations under $10/month", "format": ContentFormat.CAROUSEL, "hook": "Small price, massive leverage..."},
            {"title": f"Auto-invoice for {agency_name}", "format": ContentFormat.TWITTER_THREAD, "hook": "Getting paid while you sleep..."},
            {"title": "Client onboarding automation", "format": ContentFormat.BLOG_POST, "hook": "Perfect first impressions on autopilot..."},
            {"title": "My Telegram bot that runs agency", "format": ContentFormat.VIDEO_SHORT, "hook": "Command center in my pocket..."},
        ],
        ContentPillar.AGENCY_LIFE: [
            {"title": f"A day at {agency_name}", "format": ContentFormat.TWITTER_THREAD, "hook": "Behind the curtain of a solo agency..."},
            {"title": "Setup tour: My minimal workspace", "format": ContentFormat.CAROUSEL, "hook": "Tools for the digital nomad era..."},
            {"title": f"Working from {location} cafe", "format": ContentFormat.VIDEO_SHORT, "hook": "Location independence is the prize..."},
            {"title": "Funny AI fails with clients", "format": ContentFormat.BLOG_POST, "hook": "Learning from the hallucinations..."},
            {"title": "Friday Q&A with community", "format": ContentFormat.LIVE_STREAM, "hook": f"Discussing {niche} and AI..."},
            {"title": f"Client win: {niche} success", "format": ContentFormat.CASE_STUDY, "hook": "Sharing the wins with the team..."},
            {"title": "Books that built my agency", "format": ContentFormat.CAROUSEL, "hook": "The mindset shift required for scale..."},
            {"title": f"1 year running {agency_name}", "format": ContentFormat.TWITTER_THREAD, "hook": "Raw numbers and honest truths..."},
            {"title": "Work-life balance as solo founder", "format": ContentFormat.BLOG_POST, "hook": "Avoiding burnout while scaling..."},
            {"title": "My favorite agency memes", "format": ContentFormat.VIDEO_SHORT, "hook": "Because if we don't laugh, we cry..."},
        ],
    }
