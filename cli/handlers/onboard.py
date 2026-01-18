"""
Onboarding handler for agency setup.
Manages the onboarding flow and DNA generation.
"""

from typing import List


class OnboardHandler:
    """Handles agency onboarding operations."""

    def execute(self, args: List[str]) -> None:
        """Execute onboarding flow."""
        print("\n🎯 Starting Agency Onboarding...")
        print("-" * 50)

        try:
            from cli.onboard import main as onboard_main

            onboard_main()
        except ImportError:
            print("❌ Onboarding module not found. Run from mekong-cli directory.")

    def generate_dna(self) -> dict:
        """Generate agency DNA."""
        return {
            "name": "Sample Agency",
            "niche": "Digital Marketing",
            "location": "Your City",
            "skill": "Your Skill",
        }
