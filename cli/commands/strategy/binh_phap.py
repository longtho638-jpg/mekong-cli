"""
Binh Phap command for strategic analysis.
"""

from typing import List
from cli.commands.base import BaseCommand


class BinhPhapCommand(BaseCommand):
    """Binh Phap strategic analysis command."""
    
    @property
    def description(self) -> str:
        return "Run Binh Pháp strategic analysis"
    
    def execute(self, args: List[str]) -> None:
        try:
            from core.modules.strategy import StrategyPresenter, StrategyService
            
            idea = " ".join(args) if args else "your project"
            
            print("\n🏯 BINH PHÁP ANALYSIS")
            print("═" * 60)
            
            service = StrategyService(agency_name=idea)
            insights = service.analyze_situation(idea)
            
            self.console.print(StrategyPresenter.format_report(service, insights))
            
            print('\n   Next: agencyos plan "Create implementation plan"')
            
        except ImportError as e:
            self.console.print(f"❌ Strategy module not found: {e}")