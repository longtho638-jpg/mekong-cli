"""
CRM Module - Presentation Layer
"""
from .services import CRMService

class CRMPresenter:
    """Handles visual formatting of CRM data."""
    
    @staticmethod
    def format_pipeline_text(crm: CRMService) -> str:
        """Renders a text-based pipeline overview."""
        summary = crm.get_summary()
        forecast = crm.forecast_revenue()
        
        lines = [
            "╔" + "═" * 50 + "╗",
            "║" + "🎯 SALES PIPELINE OVERVIEW".center(50) + "║",
            "╠" + "═" * 50 + "╣",
            f"║  CONTACTS TOTAL : {summary['total_contacts']:<28} ║",
            f"║  ACTIVE DEALS   : {summary['active_deal_count']:<28} ║",
            f"║  WIN RATE       : {summary['win_rate']:>5.1f}%{' ' * 22} ║",
            "╟" + "─" * 50 + "╢",
            f"║  PIPELINE VALUE : ${summary['pipeline_value']:>12,.0f}{' ' * 15} ║",
            f"║  WEIGHTED FORECAST: ${forecast['weighted_pipeline']:>12,.0f}{' ' * 11} ║",
            "╚" + "═" * 50 + "╝"
        ]
        return "\n".join(lines)
