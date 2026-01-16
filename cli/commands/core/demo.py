"""
Demo command for showcasing Agency OS features.
"""

from typing import List
from cli.commands.base import BaseCommand


class DemoCommand(BaseCommand):
    """Demo command for showcasing features."""
    
    @property
    def description(self) -> str:
        return "Run full demo of Agency OS"
    
    def execute(self, args: List[str]) -> None:
        print("\n🎮 Running Full Demo...")
        print("=" * 60)
        
        try:
            from demo import main as demo_main
            demo_main()
        except ImportError:
            self._run_mini_demo()
    
    def _run_mini_demo(self) -> None:
        """Run mini demo when full demo not available."""
        print("\n📊 Agency OS - Quick Stats")
        print("-" * 40)
        
        stats = {
            "Modules": 20,
            "Languages": 4,
            "Regions": 4,
            "Content Ideas": 50,
            "Service Tiers": 3,
        }
        
        for key, value in stats.items():
            self.console.print(f"   {key}: {value}")
        
        print()
        self.console.print('🏯 "Không đánh mà thắng"')
        self.console.print("🌐 agencyos.network")