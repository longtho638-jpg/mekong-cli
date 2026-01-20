"""
Animator Persona Facade and Engine.
"""
import logging
import uuid
from typing import Dict

from .models import AnimationProject, AnimationStatus, AnimationType

logger = logging.getLogger(__name__)

class Animator:
    """Animator System."""
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.projects: Dict[str, AnimationProject] = {}

    def create_project(self, name: str, client: str, anim_type: AnimationType, duration_seconds: int, **kwargs) -> AnimationProject:
        project = AnimationProject(id=f"ANM-{uuid.uuid4().hex[:6].upper()}", name=name, client=client, anim_type=anim_type, duration_seconds=duration_seconds, **kwargs)
        self.projects[project.id] = project
        return project

    def update_status(self, project_id: str, status: AnimationStatus):
        if project_id in self.projects:
            self.projects[project_id].status = status

    def format_dashboard(self) -> str:
        lines = ["╔═══════════════════════════════════════════════════════════╗", f"║  🎬 ANIMATOR - {self.agency_name.upper()[:30]:<30} ║", f"║  {len(self.projects)} projects active {' ' * 31} ║", "╚═══════════════════════════════════════════════════════════╝"]
        return "\n".join(lines)
