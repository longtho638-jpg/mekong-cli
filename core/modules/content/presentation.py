"""
Content Module - Presentation Layer
"""
from typing import List
from .services import ContentGenerator
from .entities import ContentIdea, ContentPillar

class ContentPresenter:

    @staticmethod
    def format_calendar_view(generator: ContentGenerator, ideas: List[ContentIdea]) -> str:
        """Render ASCII content calendar."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ☂️ CONTENT STRATEGY: {generator.agency_name.upper()[:28]:<28} ☂️",
            "╠═══════════════════════════════════════════════════════════╣",
        ]

        for pillar in ContentPillar:
            pillar_ideas = [i for i in ideas if i.pillar == pillar]
            p_name = pillar.value.replace("_", " ").title()

            lines.append(f"║  ⚓ {p_name:<50}   ║")
            lines.append("║  " + "─" * 57 + "  ║")

            for j, idea in enumerate(pillar_ideas[:3], 1):
                title_short = (idea.title[:40] + "..") if len(idea.title) > 42 else idea.title
                lines.append(f"║    {j}. {title_short:<50} ║")

            lines.append(f"║    ...+{len(pillar_ideas) - 3} more ideas                                  ║")
            lines.append("║                                                           ║")

        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  ⚖️ TOTAL: {len(ideas)} IDEAS READY FOR MULTI-CHANNEL POSTING    ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])

        return "\n".join(lines)
