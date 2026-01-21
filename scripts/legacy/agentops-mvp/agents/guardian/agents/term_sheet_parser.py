"""Term sheet parser agent"""

from typing import Any, Dict

try:
    from ..base.guardian_base import GuardianBase
except ImportError:
    import os
    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
    from agentops_mvp.agents.guardian.base.guardian_base import GuardianBase


class TermSheetParser(GuardianBase):
    """Agent 1: Extract key terms from term sheet documents"""
    
    def __init__(self):
        super().__init__()
        self.required_fields = [
            "valuation_pre_money",
            "investment_amount",
            "equity_percentage",
            "liquidation_preference"
        ]
    
    def parse_document(self, document_text: str) -> Dict[str, Any]:
        """Parse term sheet document and extract key terms"""
        if not self.validate_input(document_text):
            raise ValueError("Document text cannot be empty")
        
        # Use service to parse the document
        terms = self.contract_service.parse_contract_text(document_text)
        
        # Validate parsed terms
        validation_errors = self.contract_service.validate_terms(terms)
        if validation_errors:
            terms["validation_errors"] = validation_errors
        
        return self.log_analysis("term_sheet_parser", terms)
    
    def extract_numeric_value(self, text: str, field_name: str) -> float:
        """Extract numeric value from text for a specific field"""
        # Note: Implement regex-based extraction in future release
        return 0.0
    
    def format_terms_for_display(self, terms: Dict[str, Any]) -> Dict[str, Any]:
        """Format terms for human-readable display"""
        formatted = {}
        
        for key, value in terms.items():
            if isinstance(value, float) and "valuation" in key or "investment" in key:
                formatted[key] = f"${value:,.0f}"
            elif isinstance(value, float) and "equity" in key or "option_pool" in key:
                formatted[key] = f"{value}%"
            elif isinstance(value, float) and "preference" in key:
                formatted[key] = f"{value}x"
            else:
                formatted[key] = value
        
        return formatted