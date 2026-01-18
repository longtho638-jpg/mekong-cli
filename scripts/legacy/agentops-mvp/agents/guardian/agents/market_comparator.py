"""Market comparator agent"""

from typing import Dict, List, Any
from ..base.guardian_base import GuardianBase


class MarketComparator(GuardianBase):
    """Agent 4: Compare terms to market standards"""
    
    def __init__(self):
        super().__init__()
        self.supported_stages = ["Seed", "Series A", "Series B", "Series C"]
    
    def analyze_market_position(self, terms: Dict[str, Any], stage: str = "Seed") -> Dict[str, Any]:
        """Compare terms to market benchmarks for funding stage"""
        if stage not in self.supported_stages:
            raise ValueError(f"Unsupported stage: {stage}. Supported: {self.supported_stages}")
        
        # Use market service for analysis
        analysis = self.market_service.analyze_market_position(terms, stage)
        
        # Add additional insights
        insights = self._generate_market_insights(terms, stage)
        analysis["insights"] = insights
        
        return self.log_analysis("market_comparator", analysis)
    
    def _generate_market_insights(self, terms: Dict[str, Any], stage: str) -> List[str]:
        """Generate additional market insights"""
        insights = []
        
        # Valuation insights
        valuation = terms.get("valuation_pre_money", 0)
        if valuation > 0:
            benchmark = self.market_service.get_benchmark_data(stage)
            val_range = benchmark["valuation_range"]
            
            if valuation > val_range[1]:
                insights.append(f"Valuation is above {stage} market range - strong position")
            elif valuation < val_range[0]:
                insights.append(f"Valuation below {stage} market - consider improving metrics")
        
        # Equity insights
        equity = terms.get("equity_percentage", 0)
        if equity > 0:
            if equity <= 15:
                insights.append("Equity dilution is founder-friendly")
            elif equity >= 25:
                insights.append("High dilution - ensure proportional value")
        
        # Terms mix insights
        liq_pref = terms.get("liquidation_preference", 1.0)
        participation = terms.get("participation", False)
        
        if liq_pref == 1.0 and not participation:
            insights.append("Clean terms - investor-friendly structure")
        elif liq_pref > 1.0 and participation:
            insights.append("Aggressive terms - should justify with premium valuation")
        
        return insights
    
    def get_percentile_ranking(self, terms: Dict[str, Any], stage: str) -> Dict[str, float]:
        """Get percentile ranking for key terms"""
        # Mock percentile data - would use real market data
        mock_percentiles = {
            "Seed": {
                "valuation_pre_money": 60,  # 60th percentile
                "equity_percentage": 40,    # 40th percentile
                "liquidation_preference": 70
            }
        }
        
        return mock_percentiles.get(stage, {})
    
    def suggest_improvements(self, terms: Dict[str, Any], stage: str) -> List[str]:
        """Suggest improvements based on market comparison"""
        suggestions = []
        analysis = self.analyze_market_position(terms, stage)
        
        for comparison in analysis["comparisons"]:
            term_name = comparison["term"]
            status = comparison["status"]
            
            if status == "UNFAVORABLE":
                if term_name == "Liquidation Preference":
                    suggestions.append("Negotiate to 1x liquidation preference")
                elif term_name == "Equity":
                    suggestions.append("Reduce equity dilution to 20% or less")
                elif term_name == "Valuation":
                    suggestions.append("Improve metrics to justify higher valuation")
            
            elif status == "BELOW_MARKET":
                if term_name == "Valuation":
                    suggestions.append("Strengthen positioning for better valuation")
        
        return suggestions
    
    def benchmark_industry_trends(self, stage: str) -> Dict[str, Any]:
        """Get current industry trends for stage"""
        # Mock trend data - would use real market data
        return {
            "stage": stage,
            "trends": {
                "liquidation_preference": "Moving toward 1x standard",
                "anti_dilution": "Weighted average dominant",
                "board_composition": "Balanced representation preferred",
                "option_pools": "10-15% post-money standard"
            },
            "quarterly_changes": {
                "valuation_change": "+5%",
                "equity_change": "-2%",
                "terms_trend": "Founder-friendly"
            }
        }