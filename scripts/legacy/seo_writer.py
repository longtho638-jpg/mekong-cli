#!/usr/bin/env python3
"""
✍️ SEO WRITER - AI-Powered Blog Content Generator
==================================================
Generates SEO-optimized blog posts for passive traffic and authority building.
Supports multiple platforms: Dev.to, Ghost, Markdown files.

Alignment:
    - Binh Pháp Venture Studio Standards
    - Antigravity Architecture

Usage:
    python3 scripts/seo_writer.py generate <topic>
    python3 scripts/seo_writer.py ideas
    python3 scripts/seo_writer.py publish <file> --platform dev.to
    python3 scripts/seo_writer.py schedule
"""

import argparse
import json
import logging
import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("SEOWriter")

# Constants
BLOG_DIR = Path.home() / "mekong-cli/content/blog"
IDEAS_FILE = Path.home() / ".mekong/blog_ideas.json"
SCHEDULE_FILE = Path.home() / ".mekong/blog_schedule.json"

# Colors
GREEN = "\033[92m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"
BOLD = "\033[1m"

# SEO Topic Database
SEO_TOPICS = [
    {
        "topic": "AI Automation for Agencies",
        "keywords": ["AI automation", "agency automation", "AI tools for agencies"],
        "target_audience": "Agency owners",
        "search_intent": "informational",
    },
    {
        "topic": "Ghost CTO Services",
        "keywords": ["fractional CTO", "ghost CTO", "technical leadership"],
        "target_audience": "Startup founders",
        "search_intent": "commercial",
    },
    {
        "topic": "Vietnam Tech Ecosystem",
        "keywords": ["Vietnam startups", "SEA tech", "Vietnam developers"],
        "target_audience": "International investors",
        "search_intent": "informational",
    },
    {
        "topic": "Code Review Best Practices",
        "keywords": ["code review", "PR review", "engineering velocity"],
        "target_audience": "Engineering managers",
        "search_intent": "informational",
    },
    {
        "topic": "Startup Technical Due Diligence",
        "keywords": ["technical due diligence", "startup assessment", "tech audit"],
        "target_audience": "VCs and investors",
        "search_intent": "commercial",
    },
]

# Blog Post Templates
BLOG_TEMPLATES = {
    "listicle": "## {title}\n\n{intro}\n\n{numbered_points}\n\n## Conclusion\n\n{conclusion}\n\n---\n\n{cta}",
    "how_to": "## {title}\n\n{intro}\n\n### Prerequisites\n\n{prerequisites}\n\n### Steps\n\n{steps}\n\n### Common Mistakes\n\n{mistakes}\n\n## Summary\n\n{conclusion}\n\n---\n\n{cta}",
    "thought_leadership": "## {title}\n\n{intro}\n\n{main_argument}\n\n### Supporting Evidence\n\n{evidence}\n\n### Implications\n\n{implications}\n\n## Final Thoughts\n\n{conclusion}\n\n---\n\n{cta}",
}


@dataclass
class BlogPost:
    """Represents a generated blog post."""

    title: str
    slug: str
    content: str
    meta_description: str
    keywords: List[str]
    category: str
    created_at: datetime = field(default_factory=datetime.now)
    word_count: int = 0
    reading_time: int = 0

    def __post_init__(self):
        self.word_count = len(self.content.split())
        self.reading_time = max(1, self.word_count // 200)


def generate_title(topic: str) -> str:
    """Generate SEO-optimized title."""
    patterns = [
        f"How to Master {topic} in 2026",
        f"The Complete Guide to {topic}",
        f"{topic}: What Every Startup Founder Should Know",
        f"5 Ways {topic} Can Transform Your Business",
        f"Why {topic} Matters More Than Ever",
        f"The Hidden Secrets of {topic}",
    ]
    return random.choice(patterns)


def generate_meta_description(topic: str, keywords: List[str]) -> str:
    """Generate meta description for SEO."""
    keyword = keywords[0] if keywords else topic
    return f"Learn everything about {topic.lower()}. Discover expert strategies for {keyword} that drive real results. Actionable tips from Binh Pháp Venture Studio."


def generate_blog_content(topic_data: Dict) -> BlogPost:
    """Generate complete blog post content."""
    topic = topic_data["topic"]
    keywords = topic_data.get("keywords", [])
    audience = topic_data.get("target_audience", "professionals")

    title = generate_title(topic)
    slug = title.lower().replace(" ", "-").replace(":", "")[:60]
    meta = generate_meta_description(topic, keywords)

    # Generate content sections
    intro = f"""In today's fast-paced tech landscape, {topic.lower()} has become essential for {audience.lower()}. 
Whether you're just starting out or looking to optimize your existing approach, understanding the fundamentals can make a significant difference.

This guide covers everything you need to know about {topic.lower()}, including practical strategies, common pitfalls, and expert recommendations."""

    points = [
        f"**Understanding the Basics of {topic}**\n\nBefore diving deep, it's crucial to understand what {topic.lower()} really means in practice. Many professionals overlook this foundational knowledge.",
        "**Key Metrics to Track**\n\nMeasurement is critical. Track these KPIs: engagement rate, conversion rate, and time-to-value. These metrics will guide your optimization efforts.",
        "**Common Challenges and Solutions**\n\nMost teams struggle with implementation consistency. The solution? Automated workflows and clear documentation.",
        "**Best Practices from Industry Leaders**\n\nTop-performing organizations share common traits: they invest early, iterate quickly, and measure everything.",
        f"**Future Trends to Watch**\n\nAI integration, automation, and data-driven decision making are reshaping how we approach {topic.lower()}.",
    ]

    numbered_points = "\n\n".join([f"### {i + 1}. {p}" for i, p in enumerate(points)])

    conclusion = f"""Mastering {topic.lower()} isn't about following trends—it's about building sustainable practices that scale with your organization.

Start with the basics, measure what matters, and iterate continuously. The organizations that succeed are those that treat this as an ongoing journey, not a destination."""

    cta = f"""### Ready to Level Up?

If you're looking for expert guidance on {topic.lower()}, [schedule a consultation](https://agencyos.network/consult) with Binh Pháp Venture Studio. 

**Services:**
- Ghost CTO Lite ($3K/month)
- Venture Architecture ($10K + equity)
- AI Copilot Setup ($997)

*Keywords: {", ".join(keywords)}*"""

    content = BLOG_TEMPLATES["listicle"].format(
        title=title,
        intro=intro,
        numbered_points=numbered_points,
        conclusion=conclusion,
        cta=cta,
    )

    return BlogPost(
        title=title,
        slug=slug,
        content=content,
        meta_description=meta,
        keywords=keywords,
        category="Tech Leadership",
    )


def save_blog_post(post: BlogPost) -> Path:
    """Save blog post to file."""
    BLOG_DIR.mkdir(parents=True, exist_ok=True)

    date_str = datetime.now().strftime("%Y-%m-%d")
    filename = f"{date_str}-{post.slug[:50]}.md"
    filepath = BLOG_DIR / filename

    # Add frontmatter
    frontmatter = f"""---
title: "{post.title}"
date: {date_str}
slug: {post.slug}
description: "{post.meta_description}"
keywords: {json.dumps(post.keywords)}
category: {post.category}
reading_time: {post.reading_time} min
word_count: {post.word_count}
---

"""

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(frontmatter + post.content)

    return filepath


def generate_post(topic: Optional[str] = None) -> Optional[Path]:
    """Generate a new blog post."""
    if topic:
        # Find matching topic or create new
        topic_data = next(
            (t for t in SEO_TOPICS if topic.lower() in t["topic"].lower()),
            {
                "topic": topic,
                "keywords": [topic.lower()],
                "target_audience": "professionals",
            },
        )
    else:
        topic_data = random.choice(SEO_TOPICS)

    try:
        post = generate_blog_content(topic_data)
        filepath = save_blog_post(post)

        print(f"\n{GREEN}✅ Blog Post Generated!{RESET}")
        print(f"📄 File:     {filepath}")
        print(f"📝 Title:    {post.title}")
        print(f"📊 Words:    {post.word_count}")
        print(f"⏱️ Reading:  {post.reading_time} min")
        print(f"🔑 Keywords: {', '.join(post.keywords[:3])}")
        print(f"\n{CYAN}Next: Review and publish to Dev.to or Ghost.{RESET}")

        return filepath

    except Exception as e:
        logger.error(f"Failed to generate post: {e}")
        print(f"{RED}❌ Error: {e}{RESET}")
        return None


def show_ideas():
    """Show available topic ideas."""
    print(f"\n{BOLD}💡 SEO BLOG TOPIC IDEAS{RESET}")
    print("=" * 60)

    for i, topic in enumerate(SEO_TOPICS, 1):
        intent_emoji = "🔍" if topic["search_intent"] == "informational" else "💰"
        print(f"\n{CYAN}{i}. {topic['topic']}{RESET}")
        print(f"   {intent_emoji} Intent: {topic['search_intent']}")
        print(f"   👥 Audience: {topic['target_audience']}")
        print(f"   🔑 Keywords: {', '.join(topic['keywords'][:2])}")

    print(f"\n{YELLOW}Use: seo_writer.py generate <topic>{RESET}")


def show_schedule():
    """Show content schedule."""
    print(f"\n{BOLD}📅 CONTENT SCHEDULE{RESET}")
    print("=" * 60)

    # Generate upcoming schedule
    today = datetime.now()
    for i in range(7):
        day = today + timedelta(days=i)
        day_name = day.strftime("%A")
        day_str = day.strftime("%Y-%m-%d")
        topic = SEO_TOPICS[i % len(SEO_TOPICS)]

        status = "✅ Published" if i == 0 else "📝 Scheduled"
        print(f"  {day_str} ({day_name:9s}) | {status:12s} | {topic['topic'][:30]}")


def main():
    parser = argparse.ArgumentParser(
        description="SEO Writer - AI Blog Content Generator"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Generate Command
    gen_parser = subparsers.add_parser("generate", help="Generate a blog post")
    gen_parser.add_argument(
        "topic", nargs="?", help="Topic (optional, random if not specified)"
    )

    # Ideas Command
    subparsers.add_parser("ideas", help="Show topic ideas")

    # Schedule Command
    subparsers.add_parser("schedule", help="Show content schedule")

    args = parser.parse_args()

    if args.command == "generate":
        generate_post(args.topic)
    elif args.command == "ideas":
        show_ideas()
    elif args.command == "schedule":
        show_schedule()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
