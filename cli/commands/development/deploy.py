"""
Deploy command for infrastructure deployment.
"""

from typing import List
from cli.commands.base import BaseCommand


class DeployCommand(BaseCommand):
    """Deploy command for infrastructure."""
    
    @property
    def description(self) -> str:
        return "Infrastructure deployment"
    
    def execute(self, args: List[str]) -> None:
        print("\n🏗️ DEPLOY - Infrastructure Mode")
        print("═" * 60)
        
        print("\n📋 Deployment Options:")
        print("─" * 60)
        print("   1. vercel deploy --prod    (Frontend)")
        print("   2. gcloud run deploy       (Backend)")
        print("   3. docker-compose up -d    (Local)")
        
        print("\n💡 Recommended: Use /ship for unified deployment")