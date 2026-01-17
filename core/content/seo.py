"""
SEO Writer Service
==================
Generates SEO-optimized blog content.
"""

import random
from typing import Dict, List, Optional
from datetime import datetime

SEO_TOPICS = [
    {
        "topic": "AI Automation for Agencies",
        "keywords": ["AI automation", "agency automation"],
        "audience": "Agency owners",
    },
    {
        "topic": "Ghost CTO Services",
        "keywords": ["fractional CTO", "technical leadership"],
        "audience": "Founders",
    },
]

class SEOService:
    def list_ideas(self) -> List[Dict]:
        return SEO_TOPICS

    def generate_post(self, topic_str: Optional[str] = None) -> Dict[str, str]:
        topic = next((t for t in SEO_TOPICS if t["topic"] == topic_str), None)
        if not topic:
            topic = random.choice(SEO_TOPICS)
            
        title = f"The Ultimate Guide to {topic['topic']}"
        content = f"""# {title}

**Target Audience**: {topic['audience']}
**Keywords**: {', '.join(topic['keywords'])}

## Introduction
{topic['topic']} is changing the landscape of business...

## Key Strategies
1. Strategy A
2. Strategy B

## Conclusion
Start implementing today.
"""
        return {
            "title": title,
            "content": content,
            "slug": title.lower().replace(" ", "-")
        }
