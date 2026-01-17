"""Risk scorer agent"""

from typing import Dict, List, Any
from datetime import datetime
from ..base.guardian_base import GuardianBase
from ..models.risk import RiskLevel


class RiskScorer(GuardianBase):
    """Agent 5: Calculate overall deal risk score 1-10"""
    
    def __init__(self):
        super().__init__()
        self.risk_weights = {
            "liquidation_preference": 3,
            "anti_dilution": 3,
            "board_control": 2,
            "participation": 2,
            "equity_dilution": 1,
            "option_pool": 1
        }
    
    def calculate_risk_score(self, terms: Dict[str, Any], red_flags: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate overall risk score and recommendation"""
        # Walk away flags = instant 10
        if red_flags.get("walk_away", False):
            return {
                "score": 10,
                "rating": "WALK_AWAY",
                "factors": ["Critical red flags detected"],
                "recommendation": "DO NOT PROCEED. Negotiate or walk away."
            }
        
        score = 0
        factors = []
        
        # Count red flags impact
        flag_count = red_flags.get("total_flags", 0)
        if flag_count >= 4:
            score += 4
            factors.append("Multiple concerning terms")
        elif flag_count >= 2:
            score += 2
            factors.append("Some concerning terms")
        
        # Analyze specific risk factors
        term_risks = self._analyze_term_risks(terms)
        score += term_risks["score"]
        factors.extend(term_risks["factors"])
        
        # Determine rating and recommendation
        rating = self._get_risk_rating(score)
        recommendation = self._get_recommendation(rating, score)
        
        result = {
            "score": min(score, 10),
            "rating": rating,
            "factors": factors,
            "recommendation": recommendation
        }
        
        return self.log_analysis("risk_scorer", result)
    
    def _analyze_term_risks(self, terms: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze risk from individual terms"""
        score = 0
        factors = []
        
        # Liquidation preference risk
        liq_pref = terms.get("liquidation_preference", 1.0)
        if liq_pref > 1.0:
            risk_points = (liq_pref - 1.0) * 2
            score += min(risk_points, 3)
            factors.append(f"Liquidation preference above 1x ({liq_pref}x)")
        
        # Participation risk
        if terms.get("participation", False):
            score += 1
            factors.append("Participating preferred")
        
        # Equity dilution risk
        equity = terms.get("equity_percentage", 0)
        if equity > 25:
            score += 2
            factors.append(f"High equity dilution ({equity}%)")
        elif equity > 20:
            score += 1
            factors.append(f"Above average equity ({equity}%)")
        
        # Option pool risk
        option_pool = terms.get("option_pool", 0)
        if option_pool > 15:
            score += 1
            factors.append(f"Large option pool ({option_pool}%)")
        
        # Board control risk
        board = terms.get("board_seats", {})
        if board.get("investor", 0) > board.get("founder", 0):
            score += 2
            factors.append("Investor board majority")
        
        return {"score": score, "factors": factors}
    
    def _get_risk_rating(self, score: int) -> str:
        """Convert numeric score to risk rating"""
        if score >= 8:
            return "VERY_HIGH"
        elif score >= 6:
            return "HIGH"
        elif score >= 4:
            return "MEDIUM"
        elif score >= 2:
            return "LOW"
        else:
            return "VERY_LOW"
    
    def _get_recommendation(self, rating: str, score: int) -> str:
        """Get recommendation based on risk rating"""
        recommendations = {
            "VERY_HIGH": "Strongly recommend declining or major renegotiation",
            "HIGH": "Significant concerns. Negotiate key terms before proceeding.",
            "MEDIUM": "Acceptable with negotiation on specific terms",
            "LOW": "Good deal with minor improvements possible",
            "VERY_LOW": "Excellent terms. Recommend proceeding."
        }
        
        return recommendations.get(rating, "Further analysis needed")
    
    def assess_risk_trends(self, terms: Dict[str, Any]) -> Dict[str, Any]:
        """Assess risk trends over time"""
        # Mock trend analysis
        return {
            "current_risk": self.calculate_risk_score(terms, {"total_flags": 0, "walk_away": False}),
            "trend": "IMPROVING",
            "risk_mitigation_suggestions": [
                "Focus on improving founder control provisions",
                "Consider capping participation rights",
                "Optimize option pool structure"
            ]
        }
    
    def get_risk_breakdown(self, terms: Dict[str, Any]) -> Dict[str, float]:
        """Get detailed risk breakdown by category"""
        breakdown = {}
        
        for category, weight in self.risk_weights.items():
            if category == "liquidation_preference":
                liq_pref = terms.get("liquidation_preference", 1.0)
                breakdown[category] = min((liq_pref - 1.0) * 2, 3) / 10
            elif category == "equity_dilution":
                equity = terms.get("equity_percentage", 0)
                breakdown[category] = min(equity / 30, 1.0)
            else:
                breakdown[category] = 0.1  # Default low risk
        
        return breakdown