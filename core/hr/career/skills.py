"""
Skill management logic for Career Development.
"""
import logging
import uuid
from typing import Dict, Optional

from .models import CareerPath, Skill, SkillLevel

logger = logging.getLogger(__name__)

class SkillManager:
    def __init__(self):
        self.career_paths: Dict[str, CareerPath] = {}

    def add_skill(
        self,
        path_id: str,
        skill_name: str,
        category: str,
        current: SkillLevel = SkillLevel.BEGINNER,
        target: SkillLevel = SkillLevel.INTERMEDIATE,
    ) -> Optional[Skill]:
        """Attach a skill to a career path."""
        if path_id not in self.career_paths:
            logger.error(f"Career path {path_id} not found")
            return None

        skill = Skill(
            id=f"SKL-{uuid.uuid4().hex[:6].upper()}",
            name=skill_name,
            category=category,
            level=current,
            target_level=target,
        )
        self.career_paths[path_id].skills.append(skill)
        logger.info(f"Skill '{skill_name}' added to {self.career_paths[path_id].employee}'s path")
        return skill

    def update_skill_progress(
        self, skill: Skill, progress: int, level: Optional[SkillLevel] = None
    ):
        """Update progress and proficiency for a skill."""
        try:
            skill.progress = progress
            if level:
                skill.level = level
            logger.debug(f"Skill {skill.name} updated: {progress}%")
        except ValueError as e:
            logger.error(f"Invalid progress update: {e}")
