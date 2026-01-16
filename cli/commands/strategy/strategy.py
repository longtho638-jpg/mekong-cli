"""
Strategy hub command for strategic planning tools.
"""

from typing import List
from cli.commands.base import BaseCommand


class StrategyCommand(BaseCommand):
    """Strategy hub command."""
    
    @property
    def description(self) -> str:
        return "Strategy Hub - Binh Pháp planning commands"
    
    def execute(self, args: List[str]) -> None:
        print("\n🏯 STRATEGY HUB")
        print("═" * 60)
        
        subcommand = args[0].lower() if args else "win3"
        
        if subcommand == "analyze":
            # Delegate to binh-phap command
            from cli.commands.strategy.binh_phap import BinhPhapCommand
            cmd = BinhPhapCommand()
            cmd.execute(args[1:])
        elif subcommand == "plan":
            # Delegate to plan command
            from cli.commands.strategy.plan import PlanCommand
            cmd = PlanCommand()
            cmd.execute(args[1:])
        else:
            print("""
┌───────────────────────────────────────────────────────────┐
│  🏯 STRATEGY HUB                                          │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Commands:                                                │
│  strategy analyze  → Binh Pháp analysis                   │
│  strategy plan     → Create plan                          │
│  strategy win3     → WIN-WIN-WIN check                    │
│                                                           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  WIN-WIN-WIN ALIGNMENT:                                   │
│  👑 ANH (Owner)     ✅ Equity + Cash flow                 │
│  🏢 AGENCY          ✅ Moat + Process                     │
│  🚀 CLIENT          ✅ 10x Value                          │
│                                                           │
└───────────────────────────────────────────────────────────┘
            """)