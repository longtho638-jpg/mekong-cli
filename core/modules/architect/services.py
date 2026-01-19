"""
Architect Module - Service Logic
"""

import logging

from .entities import ArchitectureBlueprint, ArchitectureType, ProjectProfile

logger = logging.getLogger(__name__)


class ArchitectService:
    """
    The 'Brain' that selects the right architecture based on user vibes.
    """

    def analyze_request(self, user_request: str) -> ProjectProfile:
        """
        Heuristic analysis of the user request to determine complexity.
        """
        user_request_lower = user_request.lower()

        # 1. Detect Keywords
        keywords = {
            ArchitectureType.HEXAGONAL_DDD: [
                "finance",
                "bank",
                "core",
                "microservice",
                "scale",
                "enterprise",
                "audit",
                "money",
            ],
            ArchitectureType.CLEAN_ARCHITECTURE: [
                "saas",
                "platform",
                "crm",
                "dashboard",
                "users",
                "auth",
                "subscription",
            ],
            ArchitectureType.SIMPLE_MODULAR: [
                "landing",
                "demo",
                "quick",
                "script",
                "bot",
                "tool",
                "mvp",
                "prototype",
            ],
        }

        detected = []
        score = 3  # Base score

        for arch, keys in keywords.items():
            for key in keys:
                if key in user_request_lower:
                    detected.append(key)
                    if arch == ArchitectureType.HEXAGONAL_DDD:
                        score += 3
                    elif arch == ArchitectureType.CLEAN_ARCHITECTURE:
                        score += 1

        # 2. Decide Architecture
        if score >= 8:
            arch = ArchitectureType.HEXAGONAL_DDD
            reason = "High complexity domain detected (Enterprise/Finance)."
        elif score >= 5:
            arch = ArchitectureType.CLEAN_ARCHITECTURE
            reason = "Medium complexity SaaS/Platform detected."
        else:
            arch = ArchitectureType.SIMPLE_MODULAR
            reason = "Low complexity or simple tool detected."

        return ProjectProfile(
            raw_request=user_request,
            complexity_score=score,
            detected_keywords=detected,
            recommended_arch=arch,
            reasoning=reason,
        )

    def generate_blueprint(self, profile: ProjectProfile) -> ArchitectureBlueprint:
        """
        Generates the technical blueprint based on the profile.
        """
        if profile.recommended_arch == ArchitectureType.HEXAGONAL_DDD:
            structure = """
src/
  ├── domain/           # Enterprise Business Rules
  ├── application/      # Application Business Rules (Use Cases)
  ├── infrastructure/   # Frameworks & Drivers (DB, Web)
  └── interface/        # Controllers, CLI
"""
            rules = [
                "Dependency Rule: Source code dependencies can only point inwards.",
                "Entities must be Plain Objects (no decorators).",
                "Use Repositories for data access (Interfaces in Domain, Impl in Infra).",
            ]

        elif profile.recommended_arch == ArchitectureType.CLEAN_ARCHITECTURE:
            structure = """
src/
  ├── core/
  │   ├── entities/
  │   ├── use_cases/
  │   └── interfaces/
  ├── infrastructure/
  └── app/
"""
            rules = [
                "Separate Logic (Use Cases) from UI (Controllers).",
                "Keep core independent of frameworks.",
            ]

        else:
            structure = """
src/
  ├── components/
  ├── utils/
  └── main.py
"""
            rules = ["Keep it simple.", "Group by feature/module."]

        prompt_snippet = f"""
ACT AS AN EXPERT ARCHITECT.
STRICTLY FOLLOW THIS ARCHITECTURE: {profile.recommended_arch.value}

FOLDER STRUCTURE:
{structure}

RULES:
{chr(10).join(["- " + r for r in rules])}

REASONING:
{profile.reasoning}
"""
        return ArchitectureBlueprint(
            type=profile.recommended_arch,
            folder_structure=structure,
            core_rules=rules,
            system_prompt_snippet=prompt_snippet,
        )
