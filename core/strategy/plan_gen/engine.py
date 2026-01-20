"""
Business Plan Generator Engine logic.
"""
import logging
from typing import Dict, List

from .models import AgencyDNA, PlanSection
from .templates import QUESTIONS, SECTION_TEMPLATES

logger = logging.getLogger(__name__)

class PlanGeneratorEngine:
    def __init__(self):
        self.questions = QUESTIONS
        self.templates = SECTION_TEMPLATES
        self.current_answers: Dict[str, str] = {}

    def answer_question(self, question_id: str, answer: str):
        self.current_answers[question_id] = answer

    def is_complete(self) -> bool:
        required = [q["id"] for q in self.questions]
        return all(q in self.current_answers for q in required)

    def generate_dna(self) -> AgencyDNA:
        if not self.is_complete():
            raise ValueError("Incomplete answers")

        dna = AgencyDNA(
            agency_name=self.current_answers.get("agency_name", ""),
            location=self.current_answers.get("location", ""),
            niche=self.current_answers.get("niche", ""),
            target_audience=self.current_answers.get("target_audience", ""),
            dream_revenue=self.current_answers.get("dream_revenue", ""),
            unique_skill=self.current_answers.get("unique_skill", ""),
            local_vibe=self.current_answers.get("local_vibe", ""),
            language=self.current_answers.get("language", ""),
            currency=self.current_answers.get("currency", ""),
        )

        for section, template in self.templates.items():
            try:
                dna.sections[section.value] = template.format(**self.current_answers)
            except KeyError as e:
                dna.sections[section.value] = f"Missing data for section: {e}"
        return dna
