"""Guardian Agent - Legacy compatibility layer
DEPRECATED: Use the modular structure in __init__.py instead

This file maintains backward compatibility while the modular structure is preferred.
"""

from typing import Any, Dict, List

# Import new modular structure
from . import GuardianAgent as ModularGuardianAgent
from .models.contract import TermSheetTerms
from .models.risk import RiskLevel


# Legacy compatibility class
class GuardianAgent:
    """Legacy GuardianAgent for backward compatibility"""
    
    def __init__(self):
        self._modular_agent = ModularGuardianAgent()
        self.red_flags = {
            "liquidation_preference_max": 1.5,
            "equity_max": 30,
            "option_pool_max": 15,
            "no_shop_max_days": 45,
        }
    
    # Legacy static method
    @staticmethod
    def parse_term_sheet(document_text: str) -> Dict[str, Any]:
        """Legacy static method for parsing term sheets"""
        agent = ModularGuardianAgent()
        terms = agent.parser.parse_document(document_text)
        return terms
    
    # Legacy instance methods
    def detect_red_flags(self, terms: Dict[str, Any]) -> Dict[str, Any]:
        """Legacy method for red flag detection"""
        return self._modular_agent.detector.analyze_terms(terms)
    
    @staticmethod
    def suggest_counter_offer(terms: Dict[str, Any], red_flags: List[Dict]) -> Dict[str, Any]:
        """Legacy static method for counter-offer suggestions"""
        agent = ModularGuardianAgent()
        return agent.advisor.generate_counter_offers(terms, red_flags)
    
    @staticmethod
    def compare_to_market(terms: Dict[str, Any], stage: str = "Seed") -> Dict[str, Any]:
        """Legacy static method for market comparison"""
        agent = ModularGuardianAgent()
        return agent.comparator.analyze_market_position(terms, stage)
    
    def calculate_risk_score(self, terms: Dict[str, Any], red_flags: Dict[str, Any]) -> Dict[str, Any]:
        """Legacy method for risk scoring"""
        return self._modular_agent.scorer.calculate_risk_score(terms, red_flags)
    
    @staticmethod
    def draft_response(terms: Dict[str, Any], red_flags: Dict[str, Any], 
                      counter_offers: Dict[str, Any], risk_score: Dict[str, Any]) -> Dict[str, Any]:
        """Legacy static method for response drafting"""
        agent = ModularGuardianAgent()
        return agent.responder.draft_response(terms, red_flags, counter_offers, risk_score)


# Legacy pipeline function
def review_term_sheet(document_text: str, stage: str = "Seed") -> Dict[str, Any]:
    """Legacy pipeline function for backward compatibility"""
    agent = ModularGuardianAgent()
    result = agent.review_term_sheet(document_text, stage)
    
    # Convert to legacy format
    return {
        "terms": result["terms"],
        "red_flags": result["red_flags"], 
        "counter_offers": result["counter_offers"],
        "market_comparison": result["market_analysis"],
        "risk_score": result["risk_assessment"],
        "draft_response": result["response"],
        "reviewed_at": result["reviewed_at"]
    }


# Re-export for backward compatibility
TermSheetTerms = TermSheetTerms
RiskLevel = RiskLevel