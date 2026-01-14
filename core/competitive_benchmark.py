"""
📊 Competitive Benchmarking - Industry Comparison
===================================================

Compare against industry benchmarks.
Know where you stand!

Features:
- Industry benchmarks
- Percentile ranking
- Gap analysis
- Improvement suggestions
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BenchmarkCategory(Enum):
    """Benchmark categories for metrics classification."""
    PRICING = "pricing"
    GROWTH = "growth"
    PROFITABILITY = "profitability"
    EFFICIENCY = "efficiency"
    CLIENT = "client"


class Percentile(Enum):
    """Percentile rankings based on performance."""
    TOP_10 = "top_10"
    TOP_25 = "top_25"
    MEDIAN = "median"
    BOTTOM_25 = "bottom_25"


@dataclass
class Benchmark:
    """An industry benchmark record entity."""
    metric: str
    category: BenchmarkCategory
    your_value: float
    industry_avg: float
    top_performers: float
    unit: str = ""

    def __post_init__(self):
        if self.industry_avg > self.top_performers:
            logger.warning(f"Consistency issue in '{self.metric}': Industry Avg ({self.industry_avg}) > Top Performers ({self.top_performers})")


class CompetitiveBenchmarking:
    """
    Competitive Benchmarking System.
    
    Provides context by comparing agency metrics against global and local industry benchmarks.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.benchmarks: List[Benchmark] = []
        logger.info(f"Competitive Benchmarking initialized for {agency_name}")
        self._load_defaults()
    
    def _load_defaults(self):
        """Pre-populate with standard digital agency benchmarks."""
        defaults = [
            ("Hourly Rate", BenchmarkCategory.PRICING, 125.0, 100.0, 200.0, "$"),
            ("Project Value", BenchmarkCategory.PRICING, 8000.0, 5000.0, 15000.0, "$"),
            ("Revenue Growth", BenchmarkCategory.GROWTH, 15.0, 12.0, 30.0, "%"),
            ("Profit Margin", BenchmarkCategory.PROFITABILITY, 42.0, 30.0, 50.0, "%"),
            ("Rev/Employee", BenchmarkCategory.PROFITABILITY, 150.0, 120.0, 200.0, "k"),
            ("Utilization", BenchmarkCategory.EFFICIENCY, 82.0, 70.0, 85.0, "%"),
            ("Retention", BenchmarkCategory.CLIENT, 92.0, 85.0, 95.0, "%"),
            ("NPS Score", BenchmarkCategory.CLIENT, 72.0, 50.0, 80.0, ""),
        ]
        
        for m, cat, val, avg, top, unit in defaults:
            self.benchmarks.append(Benchmark(m, cat, val, avg, top, unit))
    
    def get_percentile(self, benchmark: Benchmark) -> Percentile:
        """Determine the percentile ranking for a specific benchmark."""
        if benchmark.your_value >= benchmark.top_performers:
            return Percentile.TOP_10
        elif benchmark.your_value >= (benchmark.industry_avg + (benchmark.top_performers - benchmark.industry_avg) * 0.5):
            return Percentile.TOP_25
        elif benchmark.your_value >= benchmark.industry_avg:
            return Percentile.MEDIAN
        else:
            return Percentile.BOTTOM_25
    
    def get_gap_to_top(self, benchmark: Benchmark) -> float:
        """Calculate the numerical gap between current value and top performance."""
        return max(0.0, benchmark.top_performers - benchmark.your_value)
    
    def format_dashboard(self) -> str:
        """Render Benchmarking Dashboard."""
        above_avg_count = sum(1 for b in self.benchmarks if b.your_value >= b.industry_avg)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 COMPETITIVE BENCHMARKING{' ' * 31}║",
            f"║  {above_avg_count}/{len(self.benchmarks)} metrics above industry average {' ' * 24}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  Metric          │ You    │ Avg    │ Top    │ Rank      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        rank_icons = {
            Percentile.TOP_10: "🥇", 
            Percentile.TOP_25: "🥈", 
            Percentile.MEDIAN: "🔵", 
            Percentile.BOTTOM_25: "⚪"
        }
        
        for b in self.benchmarks[:8]:
            p = self.get_percentile(b)
            icon = rank_icons.get(p, "❓")
            
            val_str = f"{b.your_value:,.0f}{b.unit}"
            avg_str = f"{b.industry_avg:,.0f}{b.unit}"
            top_str = f"{b.top_performers:,.0f}{b.unit}"
            
            # Extract rank text safely
            rank_text = p.value.replace("top_", "Top ").replace("median", "Median").replace("bottom_25", "Btm 25")
            
            lines.append(f"║  {b.metric[:15]:<15} │ {val_str:>6} │ {avg_str:>6} │ {top_str:>6} │ {icon} {rank_text:<7} ║")
        
        lines.extend([
            "║                                                           ║",
            "║  💡 GROWTH OPPORTUNITIES                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        # Identify top 3 gaps
        gaps = sorted(self.benchmarks, key=lambda x: self.get_gap_to_top(x), reverse=True)
        for b in gaps[:3]:
            gap = self.get_gap_to_top(b)
            if gap > 0:
                lines.append(f"║    📈 {b.metric:<15}: +{gap:,.0f}{b.unit} to reach top performance{' ' * 10}║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📊 Full Report]  [🎯 Set Targets]  [📈 Track Progress]  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Be Competitive!    ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📊 Initializing Competitive Benchmarking...")
    print("=" * 60)
    
    try:
        benchmark_system = CompetitiveBenchmarking("Saigon Digital Hub")
        print("\n" + benchmark_system.format_dashboard())
    except Exception as e:
        logger.error(f"System Error: {e}")
