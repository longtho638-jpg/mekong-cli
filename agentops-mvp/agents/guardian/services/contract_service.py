"""Contract service for guardian agent"""

from typing import Dict, List, Any, Optional
from datetime import datetime
try:
    from ..models.contract import TermSheetTerms, RedFlag
except ImportError:
    from agentops_mvp.agents.guardian.models.contract import TermSheetTerms, RedFlag


class ContractService:
    """Service for contract operations and analysis"""
    
    def __init__(self):
        self.red_flag_thresholds = {
            "liquidation_preference_max": 1.5,
            "equity_max": 30,
            "option_pool_max": 15,
            "no_shop_max_days": 45,
        }
    
    def parse_contract_text(self, document_text: str) -> Dict[str, Any]:
        """Parse contract text and extract key terms"""
        # TODO: Use LLM to extract terms from document
        # Mock extraction for now
        terms = {
            "valuation_pre_money": 10000000,
            "investment_amount": 2000000,
            "equity_percentage": 16.67,
            "liquidation_preference": 1.0,
            "participation": False,
            "anti_dilution": "weighted_average",
            "board_seats": {"investor": 1, "founder": 2, "independent": 1},
            "vesting": "4-year-1-cliff",
            "pro_rata": True,
            "option_pool": 10,
            "no_shop_days": 30,
            "parsed_at": datetime.now().isoformat()
        }
        return terms
    
    def validate_terms(self, terms: Dict[str, Any]) -> List[str]:
        """Validate parsed terms for completeness"""
        validation_errors = []
        required_fields = [
            "valuation_pre_money",
            "investment_amount", 
            "equity_percentage",
            "liquidation_preference"
        ]
        
        for field in required_fields:
            if not terms.get(field):
                validation_errors.append(f"Missing required field: {field}")
        
        return validation_errors
    
    def analyze_liquidation_preference(self, liq_pref: float) -> Optional[Dict[str, Any]]:
        """Analyze liquidation preference terms"""
        if liq_pref >= 2.0:
            return {
                "type": "liquidation_preference",
                "severity": "WALK_AWAY",
                "message": f"Liquidation preference {liq_pref}x is predatory",
                "binh_phap": "Chapter 6: This is a trap, retreat"
            }
        elif liq_pref > 1.5:
            return {
                "type": "liquidation_preference",
                "severity": "HIGH",
                "message": f"Liquidation preference {liq_pref}x is aggressive",
                "binh_phap": "Negotiate to 1x non-participating"
            }
        
        return None
    
    def analyze_anti_dilution(self, anti_dilution: str) -> Optional[Dict[str, Any]]:
        """Analyze anti-dilution protection"""
        if anti_dilution == "full_ratchet":
            return {
                "type": "anti_dilution",
                "severity": "WALK_AWAY",
                "message": "Full ratchet anti-dilution is a deal breaker",
                "binh_phap": "Chapter 6: Never accept full ratchet"
            }
        
        return None