"""Negotiation advisor agent"""

from typing import Dict, List, Any
from ..base.guardian_base import GuardianBase


class NegotiationAdvisor(GuardianBase):
    """Agent 3: Suggest counter-offers for problematic terms"""
    
    def __init__(self):
        super().__init__()
        self.negotiation_priorities = {
            "CRITICAL": ["anti_dilution", "liquidation_preference"],
            "HIGH": ["participation", "board_control"],
            "MEDIUM": ["equity", "option_pool"],
            "LOW": ["vesting", "pro_rata"]
        }
    
    def generate_counter_offers(self, terms: Dict[str, Any], red_flags: List[Dict]) -> Dict[str, Any]:
        """Generate counter-offer suggestions for problematic terms"""
        counter_offers = []
        
        for flag in red_flags:
            offer = self._create_counter_offer(terms, flag)
            if offer:
                counter_offers.append(offer)
        
        # Sort by priority
        priority_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        counter_offers.sort(key=lambda x: priority_order.get(x["priority"], 99))
        
        result = {
            "total_counters": len(counter_offers),
            "counter_offers": counter_offers,
            "negotiation_strategy": self._get_negotiation_strategy(counter_offers)
        }
        
        return self.log_analysis("negotiation_advisor", result)
    
    def _create_counter_offer(self, terms: Dict[str, Any], flag: Dict) -> Dict[str, Any]:
        """Create specific counter-offer for a red flag"""
        flag_type = flag["type"]
        
        if flag_type == "liquidation_preference":
            return {
                "term": "Liquidation Preference",
                "current": terms.get("liquidation_preference"),
                "proposed": 1.0,
                "rationale": "Industry standard is 1x non-participating",
                "priority": "HIGH"
            }
        
        elif flag_type == "anti_dilution":
            return {
                "term": "Anti-Dilution",
                "current": terms.get("anti_dilution"),
                "proposed": "broad_weighted_average",
                "rationale": "Broad-based weighted average is market standard",
                "priority": "CRITICAL"
            }
        
        elif flag_type == "participation":
            return {
                "term": "Participation",
                "current": "Uncapped participating",
                "proposed": "Non-participating or 3x cap",
                "rationale": "Participating preferred is already generous to investors",
                "priority": "HIGH"
            }
        
        elif flag_type == "equity":
            current_equity = terms.get("equity_percentage", 0)
            return {
                "term": "Equity Percentage",
                "current": f"{current_equity}%",
                "proposed": f"{min(current_equity, 20)}%",
                "rationale": "Preserve founder ownership for future rounds",
                "priority": "MEDIUM"
            }
        
        elif flag_type == "option_pool":
            return {
                "term": "Option Pool",
                "current": f"{terms.get('option_pool')}% pre-money",
                "proposed": "10% post-money",
                "rationale": "Post-money option pool shares dilution with investors",
                "priority": "MEDIUM"
            }
        
        elif flag_type == "board_control":
            return {
                "term": "Board Composition",
                "current": "Investor majority",
                "proposed": "Founder majority with balanced representation",
                "rationale": "Maintain founder strategic control",
                "priority": "HIGH"
            }
        
        return None
    
    def _get_negotiation_strategy(self, counter_offers: List[Dict]) -> str:
        """Determine overall negotiation strategy"""
        critical_count = len([o for o in counter_offers if o["priority"] == "CRITICAL"])
        high_count = len([o for o in counter_offers if o["priority"] == "HIGH"])
        
        if critical_count > 0:
            return "Focus on CRITICAL items first - these are deal breakers"
        elif high_count > 2:
            return "Address HIGH priority items in sequence, be prepared to trade medium items"
        else:
            return "Start with highest priority items, be willing to compromise on medium priority"
    
    def calculate_leverage(self, terms: Dict[str, Any], market_comparison: Dict) -> str:
        """Calculate negotiation leverage based on terms and market position"""
        valuation = terms.get("valuation_pre_money", 0)
        equity = terms.get("equity_percentage", 0)
        
        # High leverage indicators
        high_leverage = valuation > 5000000 and equity < 20
        medium_leverage = valuation > 2000000 and equity < 25
        
        if high_leverage:
            return "HIGH - Strong negotiating position"
        elif medium_leverage:
            return "MEDIUM - Some room for negotiation"
        else:
            return "LOW - Limited negotiating power"