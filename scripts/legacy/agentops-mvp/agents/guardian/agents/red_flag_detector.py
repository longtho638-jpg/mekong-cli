"""Red flag detector agent"""

from typing import Any, Dict

from ..base.guardian_base import GuardianBase


class RedFlagDetector(GuardianBase):
    """Agent 2: Identify dangerous clauses that warrant WALK AWAY"""
    
    def __init__(self):
        super().__init__()
        self.walk_away_triggers = [
            "liquidation_preference >= 2.0",
            "anti_dilution == full_ratchet",
            "investor_board_majority",
            "aggressive_pay_to_play",
            "founder_vesting_reset"
        ]
    
    def analyze_terms(self, terms: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze terms for red flags and walk-away triggers"""
        red_flags = []
        walk_away = False
        
        # Check liquidation preference
        liq_analysis = self.contract_service.analyze_liquidation_preference(
            terms.get("liquidation_preference", 1.0)
        )
        if liq_analysis:
            red_flags.append(liq_analysis)
            if liq_analysis["severity"] == "WALK_AWAY":
                walk_away = True
        
        # Check anti-dilution
        anti_analysis = self.contract_service.analyze_anti_dilution(
            terms.get("anti_dilution", "weighted_average")
        )
        if anti_analysis:
            red_flags.append(anti_analysis)
            if anti_analysis["severity"] == "WALK_AWAY":
                walk_away = True
        
        # Check board control
        board_flag = self._check_board_control(terms)
        if board_flag:
            red_flags.append(board_flag)
            if board_flag["severity"] == "WALK_AWAY":
                walk_away = True
        
        # Check participation
        participation_flag = self._check_participation(terms)
        if participation_flag:
            red_flags.append(participation_flag)
        
        # Check equity
        equity_flag = self._check_equity(terms)
        if equity_flag:
            red_flags.append(equity_flag)
        
        # Check option pool
        option_flag = self._check_option_pool(terms)
        if option_flag:
            red_flags.append(option_flag)
        
        result = {
            "total_flags": len(red_flags),
            "walk_away": walk_away,
            "red_flags": red_flags
        }
        
        return self.log_analysis("red_flag_detector", result)
    
    def _check_board_control(self, terms: Dict[str, Any]) -> Dict[str, Any]:
        """Check for investor board majority"""
        board = terms.get("board_seats", {})
        investor_seats = board.get("investor", 0)
        founder_seats = board.get("founder", 0)
        
        if investor_seats > founder_seats:
            return {
                "type": "board_control",
                "severity": "WALK_AWAY",
                "message": "Investor board majority removes founder control",
                "binh_phap": "Chapter 1: Never lose strategic control"
            }
        
        return None
    
    def _check_participation(self, terms: Dict[str, Any]) -> Dict[str, Any]:
        """Check for uncapped participation rights"""
        if terms.get("participation", False) and not terms.get("participating_cap"):
            return {
                "type": "participation",
                "severity": "HIGH",
                "message": "Uncapped participation is double-dipping",
                "binh_phap": "Negotiate for 3x cap or non-participating"
            }
        
        return None
    
    def _check_equity(self, terms: Dict[str, Any]) -> Dict[str, Any]:
        """Check equity dilution"""
        equity = terms.get("equity_percentage", 0)
        
        if equity > 30:
            return {
                "type": "equity",
                "severity": "HIGH",
                "message": f"Giving up {equity}% in single round is excessive",
                "binh_phap": "Chapter 2: Preserve resources for long war"
            }
        elif equity > 25:
            return {
                "type": "equity",
                "severity": "MEDIUM",
                "message": f"Giving up {equity}% is above average for this stage",
                "binh_phap": "Consider negotiating to 20% max"
            }
        
        return None
    
    def _check_option_pool(self, terms: Dict[str, Any]) -> Dict[str, Any]:
        """Check option pool size"""
        option_pool = terms.get("option_pool", 0)
        
        if option_pool > 15:
            return {
                "type": "option_pool",
                "severity": "MEDIUM",
                "message": f"Option pool of {option_pool}% dilutes founders excessively",
                "binh_phap": "Negotiate to 10% or post-money pool"
            }
        
        return None