"""Guardian Agent - Term Sheet Protection System

STARTUP WIN Impact:
- Protection: 25% → 70%
- Auto-review all term sheets
- Flag 2x+ liquidation preferences → WALK AWAY
- Flag full ratchet → WALK AWAY
- Auto-negotiate better terms

6 Agents in this cluster:
1. Term Sheet Parser - Extract key terms from documents
2. Red Flag Detector - Identify dangerous clauses
3. Negotiation Advisor - Suggest counter-offers
4. Market Comparator - Compare to market standard
5. Risk Scorer - Rate deal risk 1-10
6. Auto-Responder - Draft response emails
"""

from datetime import datetime
from typing import Any, Dict, List

from .agents.auto_responder import AutoResponder
from .agents.market_comparator import MarketComparator
from .agents.negotiation_advisor import NegotiationAdvisor
from .agents.red_flag_detector import RedFlagDetector
from .agents.risk_scorer import RiskScorer
from .agents.term_sheet_parser import TermSheetParser


class GuardianAgent:
    """Main Guardian Agent orchestrating 6 specialized sub-agents"""
    
    def __init__(self):
        self.parser = TermSheetParser()
        self.detector = RedFlagDetector()
        self.advisor = NegotiationAdvisor()
        self.comparator = MarketComparator()
        self.scorer = RiskScorer()
        self.responder = AutoResponder()
    
    def review_term_sheet(self, document_text: str, stage: str = "Seed") -> Dict[str, Any]:
        """Complete term sheet review pipeline using all 6 agents"""
        
        # Agent 1: Parse terms
        terms = self.parser.parse_document(document_text)
        
        # Agent 2: Detect red flags
        red_flags = self.detector.analyze_terms(terms)
        
        # Agent 3: Generate counter-offers
        counter_offers = self.advisor.generate_counter_offers(
            terms, red_flags.get("red_flags", [])
        )
        
        # Agent 4: Market comparison
        market_analysis = self.comparator.analyze_market_position(terms, stage)
        
        # Agent 5: Calculate risk score
        risk_assessment = self.scorer.calculate_risk_score(terms, red_flags)
        
        # Agent 6: Draft response
        response = self.responder.draft_response(
            terms, red_flags, counter_offers, risk_assessment
        )
        
        return {
            "terms": terms,
            "red_flags": red_flags,
            "counter_offers": counter_offers,
            "market_analysis": market_analysis,
            "risk_assessment": risk_assessment,
            "response": response,
            "reviewed_at": datetime.now().isoformat()
        }
    
    def get_quick_analysis(self, terms: Dict[str, Any]) -> Dict[str, Any]:
        """Quick analysis without full pipeline"""
        red_flags = self.detector.analyze_terms(terms)
        risk_assessment = self.scorer.calculate_risk_score(terms, red_flags)
        
        return {
            "walk_away": red_flags.get("walk_away", False),
            "risk_score": risk_assessment.get("score", 0),
            "rating": risk_assessment.get("rating", "UNKNOWN"),
            "key_issues": [f["message"] for f in red_flags.get("red_flags", [])[:3]]
        }
    
    def should_proceed(self, document_text: str, stage: str = "Seed") -> bool:
        """Quick go/no-go decision"""
        analysis = self.review_term_sheet(document_text, stage)
        return not analysis["red_flags"].get("walk_away", False)


# Convenience function for quick usage
def analyze_term_sheet(document_text: str, stage: str = "Seed") -> Dict[str, Any]:
    """Analyze term sheet and return complete analysis"""
    guardian = GuardianAgent()
    return guardian.review_term_sheet(document_text, stage)


def quick_check(document_text: str) -> Dict[str, Any]:
    """Quick risk check of term sheet"""
    guardian = GuardianAgent()
    terms = guardian.parser.parse_document(document_text)
    return guardian.get_quick_analysis(terms)