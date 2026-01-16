"""
Architect Module - Presentation
"""
from .entities import ArchitectureBlueprint, ProjectProfile

class ArchitectPresenter:

    @staticmethod
    def display_blueprint(profile: ProjectProfile, blueprint: ArchitectureBlueprint) -> str:
        """Friendly output for the user."""

        icon = "🏰"
        if "Simple" in blueprint.type.value: icon = "⛺"
        if "Clean" in blueprint.type.value: icon = "🏡"

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  {icon} ARCHITECT AGENT - BLUEPRINT GENERATED{' '*16}║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🎯 Request: {profile.raw_request[:40]:<35}... ║",
            f"║  🧠 Analysis: {profile.reasoning[:45]:<43} ║",
            f"║  🏗️  Selected Style: {blueprint.type.value:<29} ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 RECOMMENDED STRUCTURE:                                ",
            "║  ───────────────────────────────────────────────────────  ║"
        ]

        for line in blueprint.folder_structure.strip().split('\n'):
            lines.append(f"║    {line:<51}    ║")

        lines.extend([
            "║                                                           ║",
            "║  💡 HOW TO VIBE CODE:                                     ",
            "║  Copy the Prompt below and paste it to AI:                ",
            "╚═══════════════════════════════════════════════════════════╝",
            "",
            "--- ✂️  COPY BELOW THIS LINE ✂️  ---",
            blueprint.system_prompt_snippet,
            "--- ✂️  END COPY ✂️  ---"
        ])

        return "\n".join(lines)
