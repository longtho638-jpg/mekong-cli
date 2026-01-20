"""Base guardian class with common functionality"""

from datetime import datetime
from typing import Any, Dict, List

from ..services.contract_service import ContractService
from ..services.market_service import MarketService


class GuardianBase:
    """Base class for guardian agents with common functionality"""
    
    def __init__(self):
        self.contract_service = ContractService()
        self.market_service = MarketService()
        self.red_flag_thresholds = {
            "liquidation_preference_max": 1.5,
            "equity_max": 30,
            "option_pool_max": 15,
            "no_shop_max_days": 45,
        }
    
    def validate_input(self, data: Any) -> bool:
        """Validate input data"""
        return data is not None and data != ""
    
    def log_analysis(self, agent_name: str, result: Dict[str, Any]) -> Dict[str, Any]:
        """Log analysis with timestamp"""
        result["agent"] = agent_name
        result["analyzed_at"] = datetime.now().isoformat()
        return result
    
    def calculate_term_impact(self, term_value: Any, benchmark: Any) -> str:
        """Calculate impact level of a term vs benchmark"""
        if term_value == benchmark:
            return "MARKET"
        elif abs(float(term_value) - float(benchmark)) / float(benchmark) > 0.5:
            return "UNFAVORABLE"
        else:
            return "FAVORABLE"
    
    def get_risk_factors(self, terms: Dict[str, Any]) -> List[str]:
        """Extract risk factors from terms"""
        factors = []
        
        liq_pref = terms.get("liquidation_preference", 1.0)
        if liq_pref > 1.0:
            factors.append(f"Liquidation preference above 1x ({liq_pref}x)")
        
        if terms.get("participation", False):
            factors.append("Participating preferred")
        
        equity = terms.get("equity_percentage", 0)
        if equity > 25:
            factors.append(f"High equity dilution ({equity}%)")
        elif equity > 20:
            factors.append(f"Above average equity ({equity}%)")
        
        return factors