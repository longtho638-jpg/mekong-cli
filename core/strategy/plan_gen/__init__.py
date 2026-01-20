"""
Business Plan Generator Facade.
"""
import logging

from .engine import PlanGeneratorEngine
from .models import AgencyDNA, PlanSection

logger = logging.getLogger(__name__)

class BusinessPlanGenerator(PlanGeneratorEngine):
    """
    Agentic Business Plan Generator.
    Transforms owner answers into a comprehensive 13-section business strategy.
    """
    def __init__(self):
        super().__init__()
        logger.info("Business Plan Generator initialized")

    def format_full_plan(self, dna: AgencyDNA) -> str:
        """Render the complete 13-section business plan."""
        border = "═" * 60
        lines = [border, f"📂 BUSINESS PLAN: {dna.agency_name.upper()}", f"DNA ID: {dna.id}", border, ""]
        for section in PlanSection:
            lines.append(dna.sections.get(section.value, "Section not generated."))
            lines.append("-" * 40 + "\n")
        lines.extend(['🏯 "Không đánh mà thắng" - Win Without Fighting', f"Location: {dna.location}", border])
        return "\n".join(lines)
