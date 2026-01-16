"""
CRM command for customer relationship management.
"""

from typing import List
from cli.commands.base import BaseCommand


class CRMCommand(BaseCommand):
    """CRM command for customer management."""
    
    @property
    def description(self) -> str:
        return "Quick CRM access"
    
    def execute(self, args: List[str]) -> None:
        print("\n🎯 CRM Quick Access")
        print("-" * 50)
        
        try:
            from core.modules.crm import CRM, CRMPresenter
            
            crm = CRM()
            self.console.print(CRMPresenter.format_pipeline_text(crm))
            
            hot_leads = crm.get_hot_leads()
            if hot_leads:
                self.console.print("\n🔥 Hot Leads:")
                for lead in hot_leads[:3]:
                    self.console.print(f"   • {lead.name} ({lead.company}) - Score: {lead.lead_score}")
            
            forecast = crm.forecast_revenue()
            self.console.print(f"\n💰 Pipeline: ${forecast['total_pipeline']:,.0f}")
            self.console.print(f"   Weighted: ${forecast['weighted_pipeline']:,.0f}")
            
        except ImportError:
            self.console.print("   Demo Mode - CRM module loading...")
            self.console.print("   Contacts: 5 | Deals: 4 | Pipeline: $9,500")