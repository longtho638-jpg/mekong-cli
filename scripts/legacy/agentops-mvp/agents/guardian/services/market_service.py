"""Market service for guardian agent"""

from datetime import datetime
from typing import Any, Dict


class MarketService:
    """Service for market data and comparisons"""
    
    def __init__(self):
        self.market_benchmarks = {
            "Seed": {
                "valuation_range": (2000000, 15000000),
                "equity_typical": (10, 25),
                "liq_pref_typical": 1.0,
                "anti_dilution": "weighted_average",
                "option_pool": 10,
                "board": "Founder majority"
            },
            "Series A": {
                "valuation_range": (10000000, 50000000),
                "equity_typical": (15, 30),
                "liq_pref_typical": 1.0,
                "anti_dilution": "weighted_average",
                "option_pool": 10,
                "board": "2 founder, 1 investor, 1 independent"
            },
            "Series B": {
                "valuation_range": (25000000, 100000000),
                "equity_typical": (20, 35),
                "liq_pref_typical": 1.0,
                "anti_dilution": "weighted_average",
                "option_pool": 15,
                "board": "Balanced representation"
            }
        }
    
    def get_benchmark_data(self, stage: str) -> Dict[str, Any]:
        """Get market benchmark data for funding stage"""
        return self.market_benchmarks.get(stage, self.market_benchmarks["Seed"])
    
    def compare_valuation(self, valuation: float, benchmark_range: tuple) -> Dict[str, Any]:
        """Compare valuation to market range"""
        val_min, val_max = benchmark_range
        
        if valuation < val_min:
            return {
                "term": "Valuation",
                "status": "BELOW_MARKET",
                "benchmark": f"${val_min:,} - ${val_max:,}"
            }
        elif valuation > val_max:
            return {
                "term": "Valuation",
                "status": "ABOVE_MARKET",
                "benchmark": f"${val_min:,} - ${val_max:,}"
            }
        else:
            return {
                "term": "Valuation",
                "status": "MARKET",
                "benchmark": f"${val_min:,} - ${val_max:,}"
            }
    
    def compare_equity(self, equity: float, equity_range: tuple) -> Dict[str, Any]:
        """Compare equity percentage to market range"""
        equity_min, equity_max = equity_range
        
        if equity < equity_min:
            return {
                "term": "Equity",
                "status": "FAVORABLE",
                "benchmark": f"{equity_min}-{equity_max}%"
            }
        elif equity > equity_max:
            return {
                "term": "Equity",
                "status": "UNFAVORABLE",
                "benchmark": f"{equity_min}-{equity_max}%"
            }
        else:
            return {
                "term": "Equity",
                "status": "MARKET",
                "benchmark": f"{equity_min}-{equity_max}%"
            }
    
    def analyze_market_position(self, terms: Dict[str, Any], stage: str) -> Dict[str, Any]:
        """Analyze overall market position of terms"""
        benchmark = self.get_benchmark_data(stage)
        comparisons = []
        
        # Compare valuation
        valuation = terms.get("valuation_pre_money", 0)
        val_comparison = self.compare_valuation(valuation, benchmark["valuation_range"])
        comparisons.append(val_comparison)
        
        # Compare equity
        equity = terms.get("equity_percentage", 0)
        equity_comparison = self.compare_equity(equity, benchmark["equity_typical"])
        comparisons.append(equity_comparison)
        
        # Compare liquidation preference
        liq_pref = terms.get("liquidation_preference", 1.0)
        if liq_pref == benchmark["liq_pref_typical"]:
            comparisons.append({
                "term": "Liquidation Preference",
                "status": "MARKET",
                "benchmark": "1x"
            })
        elif liq_pref > benchmark["liq_pref_typical"]:
            comparisons.append({
                "term": "Liquidation Preference",
                "status": "UNFAVORABLE",
                "benchmark": "1x"
            })
        
        return {
            "stage": stage,
            "comparisons": comparisons,
            "overall": "FAVORABLE" if all(c["status"] in ["MARKET", "FAVORABLE"] for c in comparisons) else "NEEDS_NEGOTIATION",
            "compared_at": datetime.now().isoformat()
        }