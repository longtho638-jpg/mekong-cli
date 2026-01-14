"""
🤖 AI Assistant - Smart Agency Helper
=======================================

AI-powered assistant for agency tasks.
Work smarter, not harder!

Features:
- Smart suggestions
- Task automation
- Content generation
- Client insights
"""

import uuid
import random
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AssistantCapability(Enum):
    """Assistant capabilities."""
    CONTENT = "content"
    ANALYTICS = "analytics"
    SCHEDULING = "scheduling"
    RESEARCH = "research"
    WRITING = "writing"


@dataclass
class AITask:
    """An AI-assisted task entity."""
    id: str
    capability: AssistantCapability
    prompt: str
    result: str = ""
    tokens_used: int = 0
    completed: bool = False
    created_at: datetime = field(default_factory=datetime.now)


class AIAssistant:
    """
    AI Assistant System.
    
    Manages AI tasks and provides smart suggestions.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.tasks: List[AITask] = []
        self.total_tokens = 0
        self.suggestions: List[str] = []
        logger.info(f"AI Assistant initialized for {agency_name}")
    
    def generate_content(self, topic: str, content_type: str = "blog") -> AITask:
        """
        Generate content using AI (Simulated).
        
        Args:
            topic: The subject to write about.
            content_type: Format (blog, email, social).
            
        Returns:
            AITask: The completed task with result.
        """
        if not topic:
            raise ValueError("Topic cannot be empty")

        task = AITask(
            id=f"AI-{uuid.uuid4().hex[:6].upper()}",
            capability=AssistantCapability.CONTENT,
            prompt=f"Generate {content_type} about: {topic}"
        )
        
        logger.info(f"Generating content for topic: {topic}")
        
        # Simulate AI response time and result
        # TODO: Integrate with actual LLM provider (OpenAI/Anthropic/Gemini)
        task.result = (
            f"📝 **{topic}**\n\n"
            f"This is simulated AI-generated {content_type} about {topic}.\n"
            "Key points covered:\n"
            "- Market trends\n"
            "- Strategic insights\n"
            "- Actionable takeaways"
        )
        task.tokens_used = random.randint(500, 1500)
        task.completed = True
        
        self.tasks.append(task)
        self.total_tokens += task.tokens_used
        
        logger.info(f"Content generated. Tokens used: {task.tokens_used}")
        return task
    
    def analyze_client(self, client_name: str) -> AITask:
        """
        Analyze client data for insights (Simulated).
        """
        if not client_name:
            raise ValueError("Client name cannot be empty")
            
        task = AITask(
            id=f"AI-{uuid.uuid4().hex[:6].upper()}",
            capability=AssistantCapability.ANALYTICS,
            prompt=f"Analyze client: {client_name}"
        )
        
        logger.info(f"Analyzing client: {client_name}")
        
        task.result = (
            f"📊 **Client Analysis: {client_name}**\n\n"
            "• Engagement: High (Top 10%)\n"
            "• Satisfaction: 92% (NPS)\n"
            "• Opportunity: Premium SEO package upsell"
        )
        task.tokens_used = random.randint(300, 800)
        task.completed = True
        
        self.tasks.append(task)
        self.total_tokens += task.tokens_used
        
        return task
    
    def suggest_next_actions(self, context: Optional[Dict] = None) -> List[str]:
        """
        Get smart suggestions based on context.
        """
        # In a real app, this would analyze 'context' or DB state
        base_suggestions = [
            "🎯 Send follow-up to Sunrise Realty (3 days since last contact)",
            "📊 Coffee Lab's monthly report is due tomorrow",
            "💰 Invoice #INV-001 is overdue - send reminder",
            "📈 Tech Startup VN's traffic up 45% - share the win!",
            "👥 Schedule team standup for project review",
        ]
        
        if context and context.get('urgent'):
             base_suggestions.insert(0, "🔥 URGENT: Server alert checked?")

        self.suggestions = base_suggestions
        logger.info(f"Generated {len(self.suggestions)} smart suggestions")
        return self.suggestions
    
    def format_dashboard(self) -> str:
        """Render AI Assistant Dashboard."""
        completed_count = sum(1 for t in self.tasks if t.completed)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🤖 AI ASSISTANT{' ' * 43}║",
            f"║  {completed_count:>3} tasks │ {self.total_tokens:>6,} tokens used                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  💡 SMART SUGGESTIONS                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        # Show top 4 suggestions
        current_suggestions = self.suggestions if self.suggestions else self.suggest_next_actions()
        for suggestion in current_suggestions[:4]:
            lines.append(f"║    {suggestion[:50]:<50}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🧠 CAPABILITIES                                          ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    ✍️ Content Generation    │  📊 Analytics Insights      ║",
            "║    📅 Smart Scheduling      │  🔍 Research & Discovery    ║",
            "║    📧 Email Writing         │  🎯 Task Prioritization     ║",
            "║                                                           ║",
            "║  📋 RECENT AI TASKS                                       ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        cap_icons = {
            AssistantCapability.CONTENT: "✍️", 
            AssistantCapability.ANALYTICS: "📊", 
            AssistantCapability.SCHEDULING: "📅", 
            AssistantCapability.RESEARCH: "🔍", 
            AssistantCapability.WRITING: "📧"
        }
        
        # Show last 3 tasks
        for task in self.tasks[-3:]:
            icon = cap_icons.get(task.capability, "🤖")
            status = "✅" if task.completed else "⏳"
            # Truncate prompt safely
            prompt_display = (task.prompt[:38] + "..") if len(task.prompt) > 40 else task.prompt
            lines.append(f"║    {status} {icon} {prompt_display:<40}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [💬 Chat]  [✍️ Generate]  [📊 Analyze]  [⚙️ Settings]   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - AI-powered!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🤖 Initializing AI Assistant...")
    print("=" * 60)
    
    try:
        ai = AIAssistant("Saigon Digital Hub")
        
        # Generate content
        ai.generate_content("Digital Marketing Trends 2025", "blog")
        ai.analyze_client("Sunrise Realty")
        ai.suggest_next_actions({'urgent': True})
        
        print("\n" + ai.format_dashboard())
        
    except Exception as e:
        logger.error(f"Runtime Error: {e}")
